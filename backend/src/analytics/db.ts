import { User } from "@/auth/validation";
import { PoolClient } from "pg";
import { UserAnalytics, UserSession } from "./types";
import { WindowSchemaType } from "./validation";

const getUserAnalytics = async (
  client: PoolClient,
  user_id: User["user_id"],
  window: WindowSchemaType
): Promise<UserAnalytics> => {
  const { count, unit } = window.interval;
  const interval = `${count} ${unit}`;
  const data = await client.query({
    text: `select lang_durations, machine_durations, editor_durations, project_durations, activity_durations, work_duration_ms, active_days from user_analytics_aggregate_period($1, $2, $3::interval)`,
    values: [user_id, window.start, interval],
  });
  return data.rows[0];
};

const getOverlappingUserProjectSessions = async (
  client: PoolClient,
  user_id: User["user_id"],
  window: WindowSchemaType
): Promise<UserSession<{ project_path: string }>[]> => {
  const { count, unit } = window.interval;
  const interval = `${count} ${unit}`;
  const data = await client.query({
    text: `select project_path, window_start, window_end, work_duration_ms from user_project_session where user_id = $1 and window_start < ($2::timestamp + $3::interval) and window_end > $2::timestamp`,
    values: [user_id, window.start, interval],
  });
  return data.rows;
};

const getOverlappingUserLangSessions = async (
  client: PoolClient,
  user_id: User["user_id"],
  window: WindowSchemaType
): Promise<UserSession<{ lang: string }>[]> => {
  const { count, unit } = window.interval;
  const interval = `${count} ${unit}`;
  const data = await client.query({
    text: `select lang, window_start, window_end, work_duration_ms from user_lang_session where user_id = $1 and window_start < ($2::timestamp + $3::interval) and window_end > $2::timestamp
`,
    values: [user_id, window.start, interval],
  });
  return data.rows;
};

const db = {
  getUserAnalytics,
  getOverlappingUserProjectSessions,
  getOverlappingUserLangSessions,
};

export default db;
