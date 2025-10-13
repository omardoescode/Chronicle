import {
  ApiMetadataAlreadySet,
  ApiMetadataNotSet,
  ApiNotFound,
} from "./errors.js";
import { ApiKey, Editor } from "./validation.js";
import db from "@/db";
import { User } from "@/auth/validation.js";
import { ApiMetadata } from "./types.js";

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

    if (metadata_set) throw new ApiMetadataAlreadySet();

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

const getUserByApi = async (api: ApiKey): Promise<User | ApiNotFound> => {
  const keyRes = await db.query({
    text: "SELECT user_id, metadata_set FROM api_key WHERE value = $1",
    values: [api],
  });

  if (keyRes.rowCount === 0) return new ApiNotFound();

  const { user_id, metadata_set } = keyRes.rows[0];
  if (!metadata_set) return new ApiMetadataNotSet();

  const userRes = await db.query({
    text: "select name, email from users where user_id = $1",
    values: [user_id],
  });

  if (userRes.rowCount === 0) throw new ApiNotFound();
  const { name, email } = userRes.rows[0];

  const user: User = {
    user_id,
    name,
    email,
  };

  return user;
};

async function getApiMetadata(
  api_key: ApiKey
): Promise<ApiMetadata | ApiNotFound | ApiMetadataNotSet> {
  const result = await db.query({
    text: `
select a.user_id user_id, a.editor editor, a.machine_id machine_id, a.metadata_set metadata_set, m.name machine_name, m.os os
from api_key a left join machine m on a.machine_id = m.machine_id 
where value = $1`,
    values: [api_key],
  });

  if (result.rows.length === 0) return new ApiNotFound();

  const { editor, machine_id, metadata_set, machine_name, os, user_id } =
    result.rows[0];

  if (!metadata_set) return new ApiMetadataNotSet();

  return {
    value: api_key,
    user_id,
    editor,
    machine: {
      machine_id,
      name: machine_name,
      os,
    },
  };
}

export { createAPIKey, setAPIMetadata, getUserByApi, getApiMetadata };
