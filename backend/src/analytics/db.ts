import { User } from "@/auth/validation";
import { PoolClient } from "pg";
import { UserAnalytics } from "./types";
import { WindowSchemaType } from "./validation";

const getUserAnalytics = async (
  client: PoolClient,
  user_id: User["user_id"],
  window: WindowSchemaType
): Promise<UserAnalytics> => {
  const { count, unit } = window.interval;
  const interval = `${count} ${unit}`;
  const data = await client.query({
    text: `select lang_durations, machine_durations, editor_durations, project_durations, activity_durations, work_duration_ms from user_analytics_aggregate_period($1, $2, $3::interval)`,
    values: [user_id, window.start, interval],
  });
  console.log(data.rows[0]);
  return data.rows[0];
};
const db = { getUserAnalytics };

export default db;
