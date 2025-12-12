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
import org.apache.flink.streaming.api.windowing.assigners.EventTimeSessionWindows;
import org.apache.flink.streaming.api.windowing.assigners.SlidingEventTimeWindows;
import org.apache.flink.streaming.api.windowing.time.Time;

import models.EnrichedFileSegment;
import sinks.JdbcSinkFactory;
import stats.UserAggregateStat;
import stats.UserLangSessionStat;
import stats.UserRollingStat;
import stats.UserProjectAggregateStat;
import stats.UserProjectRollingStat;
import stats.UserProjectSessionStat;
import stats.StatFactory;

public class FileSegmentAnalyticsJob {
	public static void main(String[] args) throws Exception {
		StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
		// TODO: Control parallelism
		env.setParallelism(1);

		String dbUser = System.getenv("POSTGRES_USER");
		String dbName = System.getenv("POSTGRES_NAME");
		String dbPass = System.getenv("POSTGRES_PASSWORD");
		String dbHost = System.getenv("POSTGRES_HOST");
		String dbPort = System.getenv("POSTGRES_PORT");

		if (dbUser == null || dbPass == null || dbName == null || dbHost == null || dbPort == null) {
			throw new IllegalStateException("Missing one or more required DB environment variables");
		}

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
				.process(new UserStatWindowFunction<Integer, UserAggregateStat>(new UserAggregateStatFactory()))
				.returns(TypeExtractor.getForClass(UserAggregateStat.class));

		DataStream<UserRollingStat> rollingStream = timestampedStream.keyBy(EnrichedFileSegment::getUser_id)
				.window(SlidingEventTimeWindows.of(Time.hours(24), Time.seconds(10)))
				.process(new UserStatWindowFunction<Integer, UserRollingStat>(new UserRollingStatFactory()))
				.returns(TypeExtractor.getForClass(UserRollingStat.class));

		DataStream<UserProjectRollingStat> projectsRollingStream = timestampedStream
				.keyBy(new KeySelector<EnrichedFileSegment, Tuple2<Integer, String>>() {
					@Override
					public Tuple2<Integer, String> getKey(EnrichedFileSegment seg) throws Exception {
						return Tuple2.of(seg.getUser_id(), seg.getProject_path());
					}
				}).window(SlidingEventTimeWindows.of(Time.hours(24), Time.seconds(10)))
				.process(new UserStatWindowFunction<Tuple2<Integer, String>, UserProjectRollingStat>(
						new UserProjectRollingStatFactory()))
				.returns(TypeExtractor.getForClass(UserProjectRollingStat.class));

		DataStream<UserProjectAggregateStat> projectsAggregateStream = timestampedStream
				.keyBy(new KeySelector<EnrichedFileSegment, Tuple2<Integer, String>>() {
					@Override
					public Tuple2<Integer, String> getKey(EnrichedFileSegment seg) {
						return Tuple2.of(seg.getUser_id(), seg.getProject_path());
					}
				}).window(TumblingEventTimeWindows.of(Time.hours(24)))
				.process(new UserStatWindowFunction<Tuple2<Integer, String>, UserProjectAggregateStat>(
						new UserProjectAggregateStatFactory()))
				.returns(TypeExtractor.getForClass(UserProjectAggregateStat.class));

		DataStream<UserProjectSessionStat> projectSessionStream = timestampedStream
				.keyBy(new KeySelector<EnrichedFileSegment, Tuple2<Integer, String>>() {
					@Override
					public Tuple2<Integer, String> getKey(EnrichedFileSegment seg) {
						return Tuple2.of(seg.getUser_id(), seg.getProject_path());
					}
				}).window(EventTimeSessionWindows.withGap(Time.seconds(30)))
				.process(new UserStatWindowFunction<>(new UserProjectSessionStatFactory()))
				.returns(TypeExtractor.getForClass(UserProjectSessionStat.class));

		DataStream<UserLangSessionStat> langSessionStream = timestampedStream
				.keyBy(new KeySelector<EnrichedFileSegment, Tuple2<Integer, String>>() {
					@Override
					public Tuple2<Integer, String> getKey(EnrichedFileSegment seg) throws Exception {
						return Tuple2.of(seg.getUser_id(), seg.getLang());
					}
				}).window(EventTimeSessionWindows.withGap(Time.seconds(30))) // <<< session gap
				.process(new UserStatWindowFunction<>(new UserLangSessionStatFactory()))
				.returns(TypeExtractor.getForClass(UserLangSessionStat.class));

		JdbcConnectionOptions jdbcOptions = new JdbcConnectionOptions.JdbcConnectionOptionsBuilder()
				.withUrl("jdbc:postgresql://" + dbHost + ":" + dbPort + "/" + dbName)
				.withDriverName("org.postgresql.Driver").withUsername(dbUser).withPassword(dbPass).build();

		// Sinks using asRecord (createGeneralSink)
		SinkFunction<UserAggregateStat> dailySink = JdbcSinkFactory.createGeneralSink("user_stats_aggregate_daily",
				UserAggregateStat.PRIMITIVE_COLUMNS, UserAggregateStat.JSONB_COLUMNS,
				String.join(", ", UserAggregateStat.CONFLICT_KEYS), jdbcOptions, 10, 1000);
		SinkFunction<UserRollingStat> rollingSink = JdbcSinkFactory.createGeneralSink("user_stats_rolling_day",
				UserRollingStat.PRIMITIVE_COLUMNS, UserRollingStat.JSONB_COLUMNS,
				String.join(", ", UserRollingStat.CONFLICT_KEYS), jdbcOptions, 10, 1000);
		SinkFunction<UserProjectAggregateStat> projectSink = JdbcSinkFactory.createGeneralSink(
				"user_project_stats_aggregate_daily", UserProjectAggregateStat.PRIMITIVE_COLUMNS,
				UserProjectAggregateStat.JSONB_COLUMNS, String.join(", ", UserProjectAggregateStat.CONFLICT_KEYS),
				jdbcOptions, 10, 1000);
		SinkFunction<UserProjectRollingStat> projectRollingSink = JdbcSinkFactory.createGeneralSink(
				"user_project_stats_rolling_day", UserProjectRollingStat.PRIMITIVE_COLUMNS,
				UserProjectRollingStat.JSONB_COLUMNS, String.join(", ", UserProjectRollingStat.CONFLICT_KEYS),
				jdbcOptions, 10, 1000);

		SinkFunction<UserProjectSessionStat> projectSessionSink = JdbcSinkFactory.createGeneralSink(
				"user_project_session", UserProjectSessionStat.PRIMITIVE_COLUMNS, UserProjectSessionStat.JSONB_COLUMNS,
				UserProjectSessionStat.CONFLICT_KEYS, jdbcOptions, 10, 1000);

		SinkFunction<UserLangSessionStat> langSessionSink = JdbcSinkFactory.createGeneralSink("user_lang_session",
				UserLangSessionStat.PRIMITIVE_COLUMNS, UserLangSessionStat.JSONB_COLUMNS,
				UserLangSessionStat.CONFLICT_KEYS, jdbcOptions, 10, 1000);

		dailyStream.addSink(dailySink);
		rollingStream.addSink(rollingSink);
		projectsAggregateStream.addSink(projectSink);
		projectsRollingStream.addSink(projectRollingSink);
		projectSessionStream.addSink(projectSessionSink);
		langSessionStream.addSink(langSessionSink);

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

	public static class UserProjectSessionStatFactory
			implements StatFactory<Tuple2<Integer, String>, UserProjectSessionStat>, Serializable {
		@Override
		public UserProjectSessionStat create(Tuple2<Integer, String> key) {
			return new UserProjectSessionStat(key.f0, key.f1);
		}
	}

	public static class UserLangSessionStatFactory
			implements StatFactory<Tuple2<Integer, String>, UserLangSessionStat>, Serializable {
		@Override
		public UserLangSessionStat create(Tuple2<Integer, String> key) {
			return new UserLangSessionStat(key.f0, key.f1);
		}
	}
}
