import { User } from "@/auth/validation";
import pool from "@/pool";
import {
  NormalizedUserSession,
  UserAnalytics,
  UserProjectAnalytics,
} from "./types";
import { WindowSchemaType } from "./validation";
import db from "./db";
import { normalizeSession } from "./utils";

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

const getUserProjectAnalytics = async (
  user_id: User["user_id"],
  project_path: string,
  window: WindowSchemaType
): Promise<UserProjectAnalytics> => {
  const client = await pool.connect();

  try {
    const data = await db.getUserProjectAnalytics(
      client,
      user_id,
      window,
      project_path
    );
    return data;
  } finally {
    client.release();
  }
};

const getUserLangSessions = async (
  user_id: User["user_id"],
  window: WindowSchemaType
): Promise<NormalizedUserSession<{ lang: string }>[]> => {
  const client = await pool.connect();

  try {
    const data = await db.getOverlappingUserLangSessions(
      client,
      user_id,
      window
    );
    return data.map(normalizeSession);
  } finally {
    client.release();
  }
};

const getUserProjectSessions = async (
  user_id: User["user_id"],
  window: WindowSchemaType
): Promise<NormalizedUserSession<{ project_path: string }>[]> => {
  const client = await pool.connect();

  try {
    const data = await db.getOverlappingUserProjectSessions(
      client,
      user_id,
      window
    );
    return data.map(normalizeSession);
  } finally {
    client.release();
  }
};
export {
  getUserAnalytics,
  getUserProjectSessions,
  getUserLangSessions,
  getUserProjectAnalytics,
};
