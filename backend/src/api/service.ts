import * as db from "./db";
import crypto from "node:crypto";
import { ApiKey, Editor } from "./validation";
import { UserNotFound } from "@/auth/errors";
import { ApiGenerationAfterAttempts } from "./errors";

const attempts = 3;

const generateApiKey = async (
  user_id: number
): Promise<ApiGenerationAfterAttempts | ApiKey> => {
  for (let i = 0; i < attempts; i++) {
    const test = crypto.randomBytes(32).toString("hex");
    if (await db.createAPIKey(test, user_id)) return test;
  }

  return new ApiGenerationAfterAttempts(attempts);
};

const setApiMetadata = async (
  api_key: ApiKey,
  editor: Editor,
  machine_name: string,
  os: string
): Promise<void | UserNotFound> => {
  return await db.setAPIMetadata(api_key, editor, machine_name, os);
};

export { generateApiKey, setApiMetadata };
