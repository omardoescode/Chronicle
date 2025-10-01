import "dotenv/config";
import z from "zod";
import { toNumber } from "./parsers";

const envSchema = z.object({
  POSTGRES_USER: z.string().min(1, "POSTGRES_USER is required"),
  POSTGRES_HOST: z.string().min(1, "POSTGRES_HOST is required"),
  POSTGRES_NAME: z.string().min(1, "POSTGRES_NAME is required"),
  POSTGRES_PASSWORD: z.string().min(1, "POSTGRES_PASSWORD is required"),
  POSTGRES_PORT: z
    .string()
    .default("5432")
    .transform((val) => toNumber(val, "POSTGRES_PORT must be a number")), // We can monitor later using `pg_stats_activity` to check for the best value
  POSTGRES_PARALLEL_CONNECTION: z
    .string()
    .default("1000")
    .transform((val) => toNumber(val)),
});

const env = envSchema.parse(process.env);

export default env;
