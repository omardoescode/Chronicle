package file_segment_analytics;

import java.io.InputStream;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.Properties;

import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.common.typeinfo.TypeInformation;
import org.apache.flink.connector.jdbc.JdbcConnectionOptions;
import org.apache.flink.connector.jdbc.JdbcExecutionOptions;
import org.apache.flink.connector.jdbc.JdbcSink;
import org.apache.flink.connector.kafka.source.KafkaSource;
import org.apache.flink.formats.json.JsonDeserializationSchema;
import org.apache.flink.shaded.jackson2.com.fasterxml.jackson.core.JsonProcessingException;
import org.apache.flink.shaded.jackson2.com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.sink.SinkFunction;
import org.apache.flink.streaming.api.windowing.assigners.TumblingEventTimeWindows;
import org.apache.flink.streaming.api.windowing.assigners.SlidingEventTimeWindows;
import org.apache.flink.streaming.api.windowing.time.Time;

import models.EnrichedFileSegment;

public class FileSegmentAnalyticsJob {
	public static void main(String[] args) throws Exception {
		StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
		// TODO: Control parallelism
		env.setParallelism(1);

		Properties consumerConfig = new Properties();
		try (InputStream stream = FileSegmentAnalyticsJob.class.getClassLoader()
				.getResourceAsStream("kafka_consumer.properties")) {
			consumerConfig.load(stream);
		}

		KafkaSource<EnrichedFileSegment> kafkaSource = KafkaSource.<EnrichedFileSegment>builder()
				.setProperties(consumerConfig).setTopics("enriched_file_segments").setValueOnlyDeserializer(
						new JsonDeserializationSchema<>(TypeInformation.of(EnrichedFileSegment.class)))
				.build();

		DataStream<EnrichedFileSegment> stream = env.fromSource(kafkaSource,
				WatermarkStrategy.forMonotonousTimestamps(), "enriched_file_segments");

		// TODO: Change the watermark time in production
		DataStream<EnrichedFileSegment> timestampedStream = stream.assignTimestampsAndWatermarks(
				WatermarkStrategy.<EnrichedFileSegment>forBoundedOutOfOrderness(Duration.ofSeconds(1))
						.withTimestampAssigner((seg, ts) -> {
							return Instant.parse(seg.getEnd_time()).toEpochMilli();
						}));

		DataStream<UserAggregateStat> dailyStream = timestampedStream.keyBy(EnrichedFileSegment::getUser_id)
				.window(TumblingEventTimeWindows.of(Time.days(1))).process(new UserStatWindowFunction("daily"));

		DataStream<UserAggregateStat> rollingStream = timestampedStream.keyBy(EnrichedFileSegment::getUser_id)
				.window(SlidingEventTimeWindows.of(Time.hours(24), Time.seconds(10))) // TODO: Change this beheavior to
																						// 5
																						// minutes I guess?
				.process(new UserStatWindowFunction("rolling_24h"));

		JdbcConnectionOptions jdbcOptions = new JdbcConnectionOptions.JdbcConnectionOptionsBuilder()
				.withUrl("jdbc:postgresql://postgres_db:5432/myapp").withDriverName("org.postgresql.Driver")
				.withUsername("admin").withPassword("secure_password").build();

		dailyStream.addSink(createJdbcSink(jdbcOptions, 1, 0, false));

		rollingStream.addSink(createJdbcSink(jdbcOptions, 1, 0, true));

		env.execute("FileSegment Analytics");
	}

	private static SinkFunction<UserAggregateStat> createJdbcSink(JdbcConnectionOptions jdbcOptions, int batchSize,
			long batchIntervalMs, boolean rolling) {
		String table = rolling ? "user_stats_rolling" : "user_stats_aggregate";
		String conflict = rolling ? "(user_id, window_type)" : "(user_id, window_type, window_start)";

		String columns = "user_id, window_type, lang_durations, machine_durations, editor_durations, project_durations, activity_durations";
		String values = "?, ?, ?::jsonb, ?::jsonb, ?::jsonb, ?::jsonb, ?::jsonb";

		if (!rolling) {
			columns += ", window_start, window_end";
			values += ", ?, ?";
		}

		String sql;
		if (rolling) {
			sql = "INSERT INTO user_stats_rolling ("
					+ "user_id, window_type, lang_durations, machine_durations, editor_durations, "
					+ "project_durations, activity_durations) "
					+ "VALUES (?, ?, ?::jsonb, ?::jsonb, ?::jsonb, ?::jsonb, ?::jsonb) "
					+ "ON CONFLICT (user_id, window_type) DO UPDATE SET " + "lang_durations = EXCLUDED.lang_durations, "
					+ "machine_durations = EXCLUDED.machine_durations, "
					+ "editor_durations = EXCLUDED.editor_durations, "
					+ "project_durations = EXCLUDED.project_durations, "
					+ "activity_durations = EXCLUDED.activity_durations, " + "updated_at = NOW();";
		} else {
			sql = "INSERT INTO user_stats_aggregate ("
					+ "user_id, window_type, lang_durations, machine_durations, editor_durations, "
					+ "project_durations, activity_durations, window_start, window_end) "
					+ "VALUES (?, ?, ?, ?, ?::jsonb, ?::jsonb, ?::jsonb, ?::jsonb, ?::jsonb) "
					+ "ON CONFLICT (user_id, window_type, window_start) DO UPDATE SET "
					+ "window_end = EXCLUDED.window_end, " + "lang_durations = EXCLUDED.lang_durations, "
					+ "machine_durations = EXCLUDED.machine_durations, "
					+ "editor_durations = EXCLUDED.editor_durations, "
					+ "project_durations = EXCLUDED.project_durations, "
					+ "activity_durations = EXCLUDED.activity_durations, " + "updated_at = NOW();";
		}

		return JdbcSink.sink(sql, (ps, stat) -> {
			ObjectMapper mapper = new ObjectMapper();
			UserAggregateStat userStat = (UserAggregateStat) stat;
			ps.setInt(1, userStat.getUserId());
			ps.setString(2, stat.getWindowType());

			if (!rolling) {
				ps.setTimestamp(8, Timestamp.from(userStat.getWindowStart()));
				ps.setTimestamp(9, Timestamp.from(userStat.getWindowEnd()));
			}

			try {
				// 5-9: Serialize Map fields to JSON strings
				ps.setString(3, mapper.writeValueAsString(userStat.getLangDurations()));
				ps.setString(4, mapper.writeValueAsString(userStat.getMachineDurations()));
				ps.setString(5, mapper.writeValueAsString(userStat.getEditorDurations()));
				ps.setString(6, mapper.writeValueAsString(userStat.getProjectDurations()));
				ps.setString(7, mapper.writeValueAsString(userStat.getActivityDurations()));
			} catch (JsonProcessingException e) {
				// Handle serialization error gracefully
				e.printStackTrace();
				for (int i = 3; i <= 7; i++)
					ps.setString(i, "{}"); // Send empty JSON object on error
			}
		},
				// Define execution options (batching)
				JdbcExecutionOptions.builder().withBatchSize(batchSize).withBatchIntervalMs(batchIntervalMs).build(),
				// Provide JDBC connection details
				jdbcOptions);
	}
}
