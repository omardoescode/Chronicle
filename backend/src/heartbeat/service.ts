import { type ProjectSession } from "./validation";
import * as db from "./db";
import { getApiMetadata } from "@/api/db";
import { User } from "@/auth/validation";
import { AppError } from "@/utils/error";
import { ApiKey } from "@/api/validation";
import pool from "@/pool";

const heartbeat = async (
  user: User,
  api_key: ApiKey,
  session: ProjectSession
): Promise<void | AppError> => {
  const client = await pool.connect();
  try {
    client.query("begin transaction");
    await db.upsertProject(client, user.user_id, session.project_path);

    await db.upsertFiles(
      client,
      user.user_id,
      session.project_path,
      session.files.map((x) => ({ path: x.file_path, lang: x.lang }))
    );

    const api_metadata = await getApiMetadata(client, api_key);
    if (api_metadata instanceof AppError) return api_metadata;
    const {
      editor,
      machine: { machine_id },
    } = api_metadata;

    const ids = await Promise.all(
      session.files.map(({ file_path, segments }) =>
        db.upsertFileSegments(
          client,
          user.user_id,
          session.project_path,
          file_path,
          segments,
          editor,
          machine_id
        )
      )
    ).then((values) => values.flatMap((x) => x));

    await db.insertOutboxSegments(client, ids);
    client.query("commit");
  } catch (err) {
    client.query("rollback");
    console.error(err);
  } finally {
    client.release();
  }
};

export { heartbeat };
