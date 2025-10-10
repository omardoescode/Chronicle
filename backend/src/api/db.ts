import { UserNotFound } from "@/auth/errors.js";
import { ApiMetadataAlreadySet, ApiNotFound } from "./errors.js";
import { ApiKey, Editor } from "./validation.js";
import db from "@/db";

const createAPIKey = (api_key: ApiKey, user_id: number): Promise<boolean> =>
  db
    .query({
      text: "insert into api_key(value, user_id) values ($1, $2)",
      values: [api_key, user_id],
    })
    .then(() => {
      return true;
    })
    .catch((err) => {
      if (err.code === "23505") return false; // Collision Detected
      throw err;
    });

const setAPIMetadata = async (
  api_key: ApiKey,
  editor: Editor,
  machine_name: string,
  os: string
): Promise<void | ApiMetadataAlreadySet> => {
  try {
    await db.query("BEGIN");

    // Get user_id
    const keyRes = await db.query({
      text: "SELECT user_id, metadata_set FROM api_key WHERE value = $1 FOR UPDATE",
      values: [api_key],
    });

    if (keyRes.rowCount === 0) {
      throw new ApiNotFound();
    }

    const { user_id, metadata_set } = keyRes.rows[0];

    if (metadata_set) return new ApiMetadataAlreadySet();

    // Create the machine
    const machineQ = await db.query({
      text: "insert into machine (user_id, name, os) values ($1, $2, $3) on conflict (user_id, name) do update set os = excluded.os returning machine_id",
      values: [user_id, machine_name, os],
    });
    const machine_id = machineQ.rows[0].machine_id;

    await db.query({
      text: "update api_key set machine_id = $1, editor= $2, metadata_set = true where value = $3",
      values: [machine_id, editor, api_key],
    });

    await db.query("COMMIT");
  } catch (err) {
    db.query("rollback");
    if (err) throw err; // an unknown error, throw, don't return
  }
};
export { createAPIKey, setAPIMetadata };
