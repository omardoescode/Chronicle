import env from "@/utils/env";
import { Pool } from "pg";

const db = new Pool({
  user: env.POSTGRES_USER,
  host: env.POSTGRES_HOST,
  database: env.POSTGRES_NAME,
  password: env.POSTGRES_PASSWORD,
  port: env.POSTGRES_PORT,
  max: env.POSTGRES_PARALLEL_CONNECTION,
  idleTimeoutMillis: 30000, // = 30 seconds
});

await db
  .connect()
  .then(() =>
    console.log(
      `Connected Successfully on the database at ${env.POSTGRES_HOST}:${env.POSTGRES_PORT}`
    )
  )
  .catch((error) => {
    console.error(
      `Failed to connect to database at ${env.POSTGRES_HOST}:${env.POSTGRES_PORT}. Make sure the database is running`
    );
    console.error(`Error: ${error}`);
    process.exit(1);
  });

export default db;
