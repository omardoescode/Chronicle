import { Project } from "./types";
import assert from "assert";
import { type Segment } from "./validation";
import { Editor } from "@/api/validation";
import { makePlaceholderGenerator } from "@/utils/db_helpers";
import { PoolClient } from "pg";

async function upsertProject(
  client: PoolClient,
  user_id: number,
  project_path: string
): Promise<Project> {
  const result = await client.query({
    text: `
      INSERT INTO projects(user_id, project_path, started_at) 
      VALUES ($1, $2, NOW()) 
      ON CONFLICT (user_id, project_path) 
      DO UPDATE SET started_at = projects.started_at  
      RETURNING started_at, project_name, user_id, project_path
    `,
    values: [user_id, project_path],
  });

  return result.rows[0];
}

async function upsertFiles(
  client: PoolClient,
  user_id: number,
  project_path: string,
  files: { path: string; lang: string }[]
): Promise<void> {
  assert(files.length > 0);

  const placeholderGenerator = makePlaceholderGenerator(4);
  const placeholders: string[] = [];
  const values: unknown[] = [];

  files.forEach((file) => {
    placeholders.push(placeholderGenerator());
    values.push(user_id, project_path, file.path, file.lang);
  });

  const placeholder_str = placeholders.join(", ");

  const text = `insert into project_files (user_id, project_path, file_path, lang) values ${placeholder_str}  on conflict (user_id, project_path, file_path) do update set lang = excluded.lang`;
  await client.query({
    text,
    values,
  });
}

async function upsertFileSegments(
  client: PoolClient,
  user_id: number,
  project_path: string,
  file_path: string,
  segments: Segment[],
  editor: Editor,
  machine_id: number
): Promise<number[]> {
  // Get file_id
  const file_id_res = await client.query({
    text: "select file_id from project_files where user_id = $1 and project_path = $2 and file_path = $3",
    values: [user_id, project_path, file_path],
  });
  if (file_id_res.rows.length === 0) {
    console.warn(
      `Skipping upserting segments for file ${file_path}. file_id not found`
    );
    return [];
  }

  const { file_id } = file_id_res.rows[0];

  const placeholderGenerator = makePlaceholderGenerator(8);
  const placeholders: string[] = [];
  const values: unknown[] = [];

  segments.forEach(
    ({
      start_time,
      end_time,
      ai_line_changes,
      human_line_changes,
      segment_type,
    }) => {
      placeholders.push(placeholderGenerator());
      values.push(
        file_id,
        start_time,
        end_time,
        ai_line_changes,
        human_line_changes,
        segment_type,
        editor,
        machine_id
      );
    }
  );

  const placeholders_str = placeholders.join(", ");

  const text = `insert into file_segments (file_id, start_time, end_time, ai_line_changes, human_line_changes, segment_type, editor, machine_id) values ${placeholders_str} on conflict do nothing returning segment_id;`;

  const result = await client.query({ text, values });

  const segment_ids = result.rows.map((r) => r.segment_id);
  return segment_ids;
}

const insertOutboxSegments = async (
  client: PoolClient,
  segment_ids: number[]
) => {
  if (segment_ids.length > 0) {
    const outboxPlaceholderGen = makePlaceholderGenerator(1);
    const outboxPlaceholders: string[] = [];
    const outboxValues: unknown[] = [];

    segment_ids.forEach((segment_id) => {
      outboxPlaceholders.push(outboxPlaceholderGen());
      outboxValues.push(segment_id);
    });

    const outboxPlaceholderStr = outboxPlaceholders.join(", ");

    const insertOutbox = `
      INSERT INTO outbox (segment_id)
      VALUES ${outboxPlaceholderStr}
      ON CONFLICT DO NOTHING;
    `;

    await client.query({
      text: insertOutbox,
      values: outboxValues,
    });
  }
};

export { upsertProject, upsertFiles, upsertFileSegments, insertOutboxSegments };
