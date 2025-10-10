import { ApiKey, Editor } from "@/validation/api";
import db from ".";

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
  user_id: number,
  api_key: ApiKey,
  editor: Editor,
  machine_name: string,
  os: string
) => {
  try {
    await db.query("BEGIN");
    // Create the machine
    const machineQ = await db.query({
      text: "insert into machine (user_id, name, os) values ($1, $2, $3) on conflict (user_id, name) do update set os = excluded.os returning machine_id",
      values: [user_id, machine_name, os],
    });
    const machine_id = machineQ.rows[0].machine_id;

    await db.query({
      text: "update api_key set machine_id = $1, editor= $2 where value = $3",
      values: [machine_id, editor, api_key],
    });
    await db.query("COMMIT");
  } catch (err) {
    db.query("rollback");
    throw err;
  }
};
export { createAPIKey, setAPIMetadata };
