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

import models.EnrichedFileSegment;

public class FileSegmentAnalyticsJob {
	public static void main(String[] args) throws Exception {
		StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();

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

		DataStream<UserLanguageStat> language_stream = stream
				.assignTimestampsAndWatermarks(
						WatermarkStrategy.<EnrichedFileSegment>forBoundedOutOfOrderness(Duration.ofMinutes(5))
								.withTimestampAssigner((seg, ts) -> Instant.parse(seg.getEnd_time()).toEpochMilli()))
				.keyBy(EnrichedFileSegment::getUser_id)
				.process(new LanguageProcessFunction(Duration.ofDays(7).toMillis(), Duration.ofMinutes(30).toMillis()));

		language_stream.addSink(JdbcSink.sink(
				"INSERT INTO user_language_stats_active (user_id, window_start, window_end, total_duration, lang_percentages, updated_at) "
						+ "VALUES (?, ?, ?, ?, ?::jsonb, NOW()) " + "ON CONFLICT (user_id) DO UPDATE "
						+ "SET window_start = EXCLUDED.window_start, " + "    window_end = EXCLUDED.window_end, "
						+ "    total_duration = EXCLUDED.total_duration, "
						+ "    lang_durations = EXCLUDED.lang_durations, " + "    updated_at = NOW();",
				(ps, stat) -> {
					ps.setInt(1, stat.getUserId());
					ps.setTimestamp(2, Timestamp.from(stat.getWindowStart()));
					ps.setTimestamp(3, Timestamp.from(stat.getWindowEnd()));
					ps.setLong(4, stat.getTotalDuration());
					try {
						String json = new ObjectMapper().writeValueAsString(stat.getLanguagePercentages());
						ps.setString(5, json);
					} catch (JsonProcessingException e) {
						// Log and store an empty JSON fallback
						ps.setString(3, "{}");
						e.printStackTrace();
					}
				}, JdbcExecutionOptions.builder().withBatchSize(100).withBatchIntervalMs(200).build(),
				new JdbcConnectionOptions.JdbcConnectionOptionsBuilder()
						.withUrl("jdbc:postgresql://postgres_db:5432/myapp").withDriverName("org.postgresql.Driver")
						.withUsername("admin").withPassword("secure_password").build()));

		env.execute("FileSegment");
	}
}
