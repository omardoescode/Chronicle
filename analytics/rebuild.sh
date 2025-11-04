#!/bin/bash
set -e # Exit on error

JAR_NAME="chronicle_analytics_job-1.0.jar"
JAR_PATH="./target/$JAR_NAME"
REMOTE_PATH="/opt/flink/usrlib/$JAR_NAME"
MAIN_CLASS="file_segment_analytics.FileSegmentAnalyticsJob"

echo "🚀 Starting Flink redeploy script..."

# 1. List running jobs
echo "📜 Listing running Flink jobs..."
RUNNING_JOBS=$(docker compose exec -T jobmanager flink list | grep "(RUNNING)" | awk '{print $4}')

# 2. Cancel all running jobs
if [ -n "$RUNNING_JOBS" ]; then
  echo "🧨 Canceling running jobs..."
  for JOB_ID in $RUNNING_JOBS; do
    echo "  → Canceling job $JOB_ID"
    docker compose exec -T jobmanager flink cancel "$JOB_ID"
  done
else
  echo "✅ No running jobs found."
fi

# 3. Build the project
echo "🛠️ Building with Maven..."
mvn clean package -DskipTests

# 4. Verify JAR exists
if [ ! -f "$JAR_PATH" ]; then
  echo "❌ Build failed: JAR not found at $JAR_PATH"
  exit 1
fi

echo "✅ Build successful."

# 5. Copy JAR into the jobmanager container
echo "📦 Copying JAR into jobmanager container..."
docker compose cp "$JAR_PATH" jobmanager:"$REMOTE_PATH"

# 6. Run the new Flink job
echo "▶️ Submitting new Flink job..."
docker compose exec -T jobmanager flink run -d -c "$MAIN_CLASS" "$REMOTE_PATH"

echo "🎉 Done! Check Flink UI or logs for execution status."
