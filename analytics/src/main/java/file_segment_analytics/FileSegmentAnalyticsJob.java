package file_segment_analytics;

import java.io.InputStream;
import java.time.Duration;
import java.time.Instant;
import java.util.Properties;

import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.common.typeinfo.TypeInformation;
import org.apache.flink.connector.kafka.source.KafkaSource;
import org.apache.flink.formats.json.JsonDeserializationSchema;
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

		stream.assignTimestampsAndWatermarks(
				WatermarkStrategy.<EnrichedFileSegment>forBoundedOutOfOrderness(Duration.ofMinutes(5))
						.withTimestampAssigner((seg, ts) -> Instant.parse(seg.getEnd_time()).toEpochMilli()))
				.keyBy(EnrichedFileSegment::getUser_id).process(new LanguageProcessFunction()).print();

		env.execute("FileSegmentPrinter");
	}
}
