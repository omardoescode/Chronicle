# Chroncile

<center>
This is a code stats tool extension for vscode (and hopefully neovim in the future)
</center>

# Development
- Backend: Navigate to [backend/README.md](https://github.com/omardoescode/Chronicle/blob/main/backend/README.md)

# Running the project

```sh

# Copy .env.example to .env
cp .env.example .env

# Run all backend services
docker compose up -d 

# Run analytics job
docker compose exec jobmanager flink run --detach -c file_segment_analytics.FileSegmentAnalyticsJob /opt/flink/usrlib/chronicle_analytics_job-1.0.jar

# Run frontned
cd frontend 
bun install 
bun dev
```
