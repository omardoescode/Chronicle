import { type ProjectSession } from "./validation";
import * as db from "./db";
import { getApiMetadata } from "@/api/db";
import { User } from "@/auth/validation";
import { AppError } from "@/utils/error";
import { ApiKey } from "@/api/validation";

const heartbeat = async (
  user: User,
  api_key: ApiKey,
  session: ProjectSession
): Promise<void | AppError> => {
  await db.upsertProject(user.user_id, session.project_path);

  await db.upsertFiles(
    user.user_id,
    session.project_path,
    session.files.map((x) => ({ path: x.file_path, lang: x.lang }))
  );

  const api_metadata = await getApiMetadata(api_key);
  if (api_metadata instanceof AppError) return api_metadata;
  const {
    editor,
    machine: { machine_id },
  } = api_metadata;

  await Promise.all(
    session.files.map(({ file_path, segments }) =>
      db.upsertFileSegments(
        user.user_id,
        session.project_path,
        file_path,
        segments,
        editor,
        machine_id
      )
    )
  );
};
export { heartbeat };
