# Stage 1: Build the analytics JAR
FROM maven:3-openjdk-11 AS builder
WORKDIR /app/analytics

# Copy project files
COPY . .

# Build the JAR
RUN mvn clean package -DskipTests

# Verify the JAR contains your main class
RUN if ! jar tf target/chronicle_analytics_job-1.0.jar | grep -q 'file_segment_analytics/FileSegmentAnalyticsJob.class'; then \
      echo "❌ FileSegmentAnalyticsJob not found in JAR!" && exit 1; \
    else \
      echo "✅ Verified FileSegmentAnalyticsJob is in the JAR"; \
    fi

FROM flink:1.20.2-scala_2.12-java11

RUN apt-get update && apt-get install -y wget git && rm -rf /var/lib/apt/lists/*

# Add Flink connectors
RUN wget -P /opt/flink/lib/ https://repo.maven.apache.org/maven2/org/apache/flink/flink-sql-connector-kafka/3.4.0-1.20/flink-sql-connector-kafka-3.4.0-1.20.jar && \
    wget -P /opt/flink/lib/ https://github.com/knaufk/flink-faker/releases/download/v0.5.3/flink-faker-0.5.3.jar

# Create directory for user JARs
RUN mkdir -p /opt/flink/usrlib && chown -R flink:flink /opt/flink/usrlib /opt/flink/lib

# Copy the verified JAR from the builder stage
COPY --from=builder /app/analytics/target/chronicle_analytics_job-1.0.jar /opt/flink/usrlib/

# Set working directory
WORKDIR /opt/flink

