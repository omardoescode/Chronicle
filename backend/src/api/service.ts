import * as db from "./db";
import crypto from "node:crypto";
import { ApiKey, Editor } from "./validation";
import { UserNotFound } from "@/auth/errors";
import {
  ApiGenerationAfterAttempts,
  ApiMetadataAlreadySet,
  ApiNotFound,
} from "./errors";
import { DBError } from "@/pool";
import pool from "@/pool";
import { AppError } from "@/utils/error";

const ATTEMPTS = 3;

const generateApiKey = async (
  user_id: number
): Promise<ApiGenerationAfterAttempts | ApiKey | DBError> => {
  const client = await pool.connect();
  try {
    await client.query("begin transaction");
    for (let i = 0; i < ATTEMPTS; i++) {
      const test = crypto.randomBytes(32).toString("hex");
      const valid = await db.createAPIKey(client, test, user_id);
      if (valid) {
        await client.query("commit");
        return test;
      }
    }
  } catch (err) {
    await client.query("rollback");
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
): Promise<void | UserNotFound | ApiMetadataAlreadySet | ApiNotFound> => {
  const client = await pool.connect();
  try {
    await client.query("begin transaction");
    console.log(`setting ${api_key}`);
    const res = await db.setAPIMetadata(
      client,
      api_key,
      editor,
      machine_name,
      os
    );
    if (res instanceof AppError) {
      await client.query("rollback");
      return res;
    }
    await client.query("commit");
  } catch (err) {
    await client.query("rollback");
    console.error(err);
  } finally {
    client.release();
  }
};

export { generateApiKey, setApiMetadata };
