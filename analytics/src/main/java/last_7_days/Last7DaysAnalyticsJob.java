package last_7_days;

import java.io.InputStream;
import java.util.Date;
import java.util.Properties;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.common.functions.MapFunction;
import org.apache.flink.api.common.serialization.SimpleStringSchema;
import org.apache.flink.connector.kafka.source.KafkaSource;
import org.apache.flink.shaded.jackson2.com.fasterxml.jackson.databind.JsonNode;
import org.apache.flink.shaded.jackson2.com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import models.FileSegment;

public class Last7DaysAnalyticsJob {
	public static void main(String[] args) throws Exception {
		StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();

		Properties consumerConfig = new Properties();
		try (InputStream stream = Last7DaysAnalyticsJob.class.getClassLoader()
				.getResourceAsStream("file_segments_consumer.properties")) {
			consumerConfig.load(stream);
		}

		// Use SimpleStringSchema to read raw JSON strings
		KafkaSource<String> kafkaSource = KafkaSource.<String>builder().setProperties(consumerConfig)
				.setTopics("file_segments").setValueOnlyDeserializer(new SimpleStringSchema()).build();

		// Parse Debezium JSON and extract FileSegment
		DataStream<FileSegment> segment_stream = env
				.fromSource(kafkaSource, WatermarkStrategy.noWatermarks(), "file_segments_stream")
				.map(new MapFunction<String, FileSegment>() {
					private transient ObjectMapper objectMapper;

					@Override
					public FileSegment map(String value) throws Exception {
						if (objectMapper == null) {
							objectMapper = new ObjectMapper();
						}

						// Parse Debezium envelope
						JsonNode root = objectMapper.readTree(value);
						JsonNode after = root.get("after");

						if (after == null || after.isNull()) {
							return null; // Handle delete operations
						}

						// Map to FileSegment
						Date startTime = new Date(after.get("start_time").asLong());
						Date endTime = new Date(after.get("end_time").asLong());
						return new FileSegment(after.get("segment_id").asInt(), after.get("file_id").asInt(), startTime,
								endTime, after.get("segment_type").asText(), after.get("human_line_changes").asInt(),
								after.get("ai_line_changes").asInt(), after.get("editor").asText(),
								after.get("machine_id").asInt());
					}
				}).filter(segment -> segment != null); // Filter out nulls

		segment_stream.print();
		env.execute("FileSegmentPrinter");
	}
}
