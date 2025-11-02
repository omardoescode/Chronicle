import env from "@/utils/env";
import { Pool } from "pg";
import { AppError } from "./utils/error";

const pool = new Pool({
  user: env.POSTGRES_USER,
  host: env.POSTGRES_HOST,
  database: env.POSTGRES_NAME,
  password: env.POSTGRES_PASSWORD,
  port: env.POSTGRES_PORT,
  max: env.POSTGRES_PARALLEL_CONNECTION,
  idleTimeoutMillis: 30000,
  min: 2,
  connectionTimeoutMillis: 2000,
});

export default pool;

export class DBError extends AppError {
  constructor() {
    super(`DB Connection Error`, {
      code: "INTERNAL_SERVER_ERROR",
      isOperational: false,
    });
  }
}
