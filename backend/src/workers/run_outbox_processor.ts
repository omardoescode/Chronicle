import OutboxProcessor from "./OutboxProcessor";
import env from "@/utils/env";
import { Kafka } from "kafkajs";
import pool from "@/pool";

const kafka = new Kafka({
  clientId: "backend",
  brokers: [env.KAFKA_URL],
});

const outbox_processor = new OutboxProcessor(
  "enriched_file_segments",
  kafka,
  pool,
  1000
);

await outbox_processor.start(); // blocks until failure or completion
