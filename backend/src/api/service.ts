import * as db from "./db";
import crypto from "node:crypto";
import { ApiKey, Editor } from "./validation";
import { UserNotFound } from "@/auth/errors";
import { ApiGenerationAfterAttempts } from "./errors";
import { DBError } from "@/pool";
import pool from "@/pool";

const ATTEMPTS = 3;

const generateApiKey = async (
  user_id: number
): Promise<ApiGenerationAfterAttempts | ApiKey | DBError> => {
  const client = await pool.connect();
  try {
    client.query("begin transaction");
    for (let i = 0; i < ATTEMPTS; i++) {
      const test = crypto.randomBytes(32).toString("hex");
      const valid = await db.createAPIKey(client, test, user_id);
      if (valid) {
        client.query("commit");
        return test;
      }
    }
  } catch (err) {
    client.query("rollback");
    console.error(err);
  } finally {
    client.release();
  }

  return new ApiGenerationAfterAttempts(ATTEMPTS);
};

const setApiMetadata = async (
  api_key: ApiKey,
  editor: Editor,
  machine_name: string,
  os: string
): Promise<void | UserNotFound> => {
  const client = await pool.connect();
  try {
    client.query("begin transaction");
    await db.setAPIMetadata(client, api_key, editor, machine_name, os);
    client.query("commit");
  } catch (err) {
    client.query("rollback");
    console.error(err);
  } finally {
    client.release();
  }
};

export { generateApiKey, setApiMetadata };
