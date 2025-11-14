import { User } from "@/auth/validation";
import pool from "@/pool";
import { UserAnalytics } from "./types";
import { WindowSchemaType } from "./validation";
import db from "./db";

const getUserAnalytics = async (
  user_id: User["user_id"],
  window: WindowSchemaType
): Promise<UserAnalytics> => {
  const client = await pool.connect();

  try {
    const data = await db.getUserAnalytics(client, user_id, window);
    return data;
  } finally {
    client.release();
  }
};

export { getUserAnalytics };
