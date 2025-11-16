import { Kafka, Producer, Transaction } from "kafkajs";
import { Pool } from "pg";

export default class OutboxProcessor {
  private producer: Producer;
  constructor(
    private analytics_topic: string,
    private kafka: Kafka,
    private db: Pool,
    private intervalMs: number = 100
  ) {
    this.producer = kafka.producer({
      idempotent: true,
      maxInFlightRequests: 1,
      transactionalId: "enriched-file-segment-processor",
    });
  }

  async start() {
    await this.ensure_topic_exists();
    await this.producer
      .connect()
      .then(() => console.log("Producer successfully connected"));
    const interval = this.intervalMs;

    const run = async () => {
      await this.processOutbox().catch(console.error);
      setTimeout(run, interval);
    };

    await run();
  }

  async ensure_topic_exists() {
    const admin = this.kafka.admin();
    await admin.connect();

    const topics = await admin.listTopics();

    if (!topics.includes(this.analytics_topic)) {
      await admin.createTopics({
        topics: [
          {
            topic: this.analytics_topic,
            numPartitions: 3,
            replicationFactor: 1,
          },
        ],
      });
      console.log(`✅ Created missing topic: ${this.analytics_topic}`);
    }

    await admin.disconnect();
  }

  private async processOutbox() {
    console.log("Processing");
    const client = await this.db.connect();
    let transaction: null | Transaction = null;

    try {
      client.query("begin transaction");
      const ids_res = await client.query({
        text: "select segment_id from outbox where processed is false for update",
      });
      const ids = ids_res.rows.map((x) => x.segment_id);
      console.log(`found ${ids.length} segments`);

      if (ids.length == 0) {
        await client.query("commit");
        return;
      }

      const enriched_segments_text = `
SELECT
  fs.segment_id,
  fs.start_time,
  fs.end_time,
  fs.duration_seconds,
  fs.segment_type,
  fs.human_line_changes,
  fs.ai_line_changes,
  fs.editor,
  
  -- File info
  f.file_id,
  f.file_path,
  f.file_name,
  f.lang,

  -- Project info
  p.project_path,
  p.project_name,
  p.started_at AS project_started_at,

  -- User info
  u.user_id,
  u.name AS user_name,
  u.email AS user_email,
  u.timezone AS user_timezone,

  -- Machine info
  m.machine_id,
  m.name AS machine_name,
  m.os AS machine_os

FROM file_segments fs
JOIN project_files f
  ON fs.file_id = f.file_id
JOIN projects p
  ON f.user_id = p.user_id AND f.project_path = p.project_path
JOIN users u
  ON p.user_id = u.user_id
LEFT JOIN machine m
  ON fs.machine_id = m.machine_id

WHERE fs.segment_id = ANY($1::int[])
order by fs.start_time;
`;
      const segments = await client
        .query({
          text: enriched_segments_text,
          values: [ids],
        })
        .then((v) => v.rows);

      transaction = await this.producer.transaction();
      await transaction.send({
        topic: this.analytics_topic,
        messages: segments.map((seg) => ({
          key: String(seg.segment_id),
          value: JSON.stringify(seg),
        })),
      });

      // TODO: should I update and do a batch delete later, or delete right away?
      await client.query({
        text: `update outbox set processed=true where segment_id = any($1::int[])`,
        values: [ids],
      });
      console.log(`Submitted ${segments.length} segments`);

      await transaction.commit();
      await client.query("commit");
    } catch (err) {
      console.error(err);
      if (transaction !== null) transaction.abort();
      await client.query("rollback");
    } finally {
      client.release();
    }
  }
}
