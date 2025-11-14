package file_segment_analytics;

import java.io.InputStream;
import java.io.Serializable;
import java.time.Duration;
import java.time.Instant;
import java.util.Properties;

import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.common.typeinfo.TypeInformation;
import org.apache.flink.api.java.functions.KeySelector;
import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.api.java.typeutils.TypeExtractor;
import org.apache.flink.connector.jdbc.JdbcConnectionOptions;
import org.apache.flink.connector.kafka.source.KafkaSource;
import org.apache.flink.formats.json.JsonDeserializationSchema;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.sink.SinkFunction;
import org.apache.flink.streaming.api.windowing.assigners.TumblingEventTimeWindows;
import org.apache.flink.streaming.api.windowing.assigners.SlidingEventTimeWindows;
import org.apache.flink.streaming.api.windowing.time.Time;

import models.EnrichedFileSegment;
import sinks.JdbcSinkFactory;
import stats.UserAggregateStat;
import stats.UserRollingStat;
import stats.UserProjectAggregateStat;
import stats.UserProjectRollingStat;
import stats.StatFactory;

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
				.window(TumblingEventTimeWindows.of(Time.days(1)))
				.process(
						new UserStatWindowFunction<Integer, UserAggregateStat>("daily", new UserAggregateStatFactory()))
				.returns(TypeExtractor.getForClass(UserAggregateStat.class));

		DataStream<UserRollingStat> rollingStream = timestampedStream.keyBy(EnrichedFileSegment::getUser_id)
				.window(SlidingEventTimeWindows.of(Time.hours(24), Time.seconds(10)))
				.process(new UserStatWindowFunction<Integer, UserRollingStat>("rolling_24h",
						new UserRollingStatFactory()))
				.returns(TypeExtractor.getForClass(UserRollingStat.class));

		DataStream<UserProjectRollingStat> projectsRollingStream = timestampedStream
				.keyBy(new KeySelector<EnrichedFileSegment, Tuple2<Integer, String>>() {
					@Override
					public Tuple2<Integer, String> getKey(EnrichedFileSegment seg) throws Exception {
						return Tuple2.of(seg.getUser_id(), seg.getProject_path());
					}
				}).window(SlidingEventTimeWindows.of(Time.hours(24), Time.seconds(10)))
				.process(new UserStatWindowFunction<Tuple2<Integer, String>, UserProjectRollingStat>("rolling_24h",
						new UserProjectRollingStatFactory()))
				.returns(TypeExtractor.getForClass(UserProjectRollingStat.class));

		DataStream<UserProjectAggregateStat> projectsAggregateStream = timestampedStream
				.keyBy(new KeySelector<EnrichedFileSegment, Tuple2<Integer, String>>() {
					@Override
					public Tuple2<Integer, String> getKey(EnrichedFileSegment seg) throws Exception {
						return Tuple2.of(seg.getUser_id(), seg.getProject_path());
					}
				}).window(TumblingEventTimeWindows.of(Time.hours(24)))
				.process(new UserStatWindowFunction<Tuple2<Integer, String>, UserProjectAggregateStat>("daily",
						new UserProjectAggregateStatFactory()))
				.returns(TypeExtractor.getForClass(UserProjectAggregateStat.class));

		// Use stat type definitions for columns and conflict keys

		JdbcConnectionOptions jdbcOptions = new JdbcConnectionOptions.JdbcConnectionOptionsBuilder()
				.withUrl("jdbc:postgresql://postgres_db:5432/myapp").withDriverName("org.postgresql.Driver")
				.withUsername("admin").withPassword("secure_password").build();

		// Sinks using asRecord (createGeneralSink)
		SinkFunction<UserAggregateStat> dailySink = JdbcSinkFactory.createGeneralSink("user_stats_aggregate",
				UserAggregateStat.PRIMITIVE_COLUMNS, UserAggregateStat.JSONB_COLUMNS,
				String.join(", ", UserAggregateStat.CONFLICT_KEYS), jdbcOptions, 10, 1000);
		SinkFunction<UserRollingStat> rollingSink = JdbcSinkFactory.createGeneralSink("user_stats_rolling",
				UserRollingStat.PRIMITIVE_COLUMNS, UserRollingStat.JSONB_COLUMNS,
				String.join(", ", UserRollingStat.CONFLICT_KEYS), jdbcOptions, 10, 1000);
		SinkFunction<UserProjectAggregateStat> projectSink = JdbcSinkFactory.createGeneralSink(
				"user_project_stats_aggregate", UserProjectAggregateStat.PRIMITIVE_COLUMNS,
				UserProjectAggregateStat.JSONB_COLUMNS, String.join(", ", UserProjectAggregateStat.CONFLICT_KEYS),
				jdbcOptions, 10, 1000);
		SinkFunction<UserProjectRollingStat> projectRollingSink = JdbcSinkFactory.createGeneralSink(
				"user_project_stats_Rolling", UserProjectRollingStat.PRIMITIVE_COLUMNS,
				UserProjectRollingStat.JSONB_COLUMNS, String.join(", ", UserProjectRollingStat.CONFLICT_KEYS),
				jdbcOptions, 10, 1000);

		dailyStream.addSink(dailySink);
		rollingStream.addSink(rollingSink);
		projectsAggregateStream.addSink(projectSink);
		projectsRollingStream.addSink(projectRollingSink);

		env.execute("FileSegment Analytics");
	}

	public static class UserAggregateStatFactory implements StatFactory<Integer, UserAggregateStat>, Serializable {
		@Override
		public UserAggregateStat create(Integer key) {
			return new UserAggregateStat(key);
		}
	}

	public static class UserRollingStatFactory implements StatFactory<Integer, UserRollingStat>, Serializable {
		@Override
		public UserRollingStat create(Integer key) {
			return new UserRollingStat(key);
		}
	}

	public static class UserProjectAggregateStatFactory
			implements StatFactory<Tuple2<Integer, String>, UserProjectAggregateStat>, Serializable {
		@Override
		public UserProjectAggregateStat create(Tuple2<Integer, String> key) {
			return new UserProjectAggregateStat(key.f0, key.f1);
		}
	}

	public static class UserProjectRollingStatFactory
			implements StatFactory<Tuple2<Integer, String>, UserProjectRollingStat>, Serializable {
		@Override
		public UserProjectRollingStat create(Tuple2<Integer, String> key) {
			return new UserProjectRollingStat(key.f0, key.f1);
		}
	}
}
