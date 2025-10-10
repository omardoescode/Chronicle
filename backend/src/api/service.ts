import * as db from "./db";
import crypto from "node:crypto";

const attempts = 3;

const generateApiKey = async (user_id: number) => {
  for (let i = 0; i < attempts; i++) {
    const test = crypto.randomBytes(32).toString("hex");
    if (await db.createAPIKey(test, user_id)) return test;
  }

  return Error(`Failed to generate an API key after ${attempts} attempts`);
};

export { generateApiKey };
