import db from "@/db";
import { Project } from "./types";
import assert from "assert";
import { type Segment } from "./validation";
import { Editor } from "@/api/validation";
import { makePlaceholderGenerator } from "@/utils/db_helpers";

async function upsertProject(
  user_id: number,
  project_path: string
): Promise<Project> {
  const result = await db.query({
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
  await db.query({
    text,
    values,
  });
}

async function upsertFileSegments(
  user_id: number,
  project_path: string,
  file_path: string,
  segments: Segment[],
  editor: Editor,
  machine_id: number
): Promise<void> {
  // Get file_id
  const file_id_res = await db.query({
    text: "select file_id from project_files where user_id = $1 and project_path = $2 and file_path = $3",
    values: [user_id, project_path, file_path],
  });
  if (file_id_res.rows.length === 0) {
    console.warn(
      `Skipping upserting segments for file ${file_path}. file_id not found`
    );
    return;
  }

  const { file_id } = file_id_res.rows[0];

  const placeholderGenerator = makePlaceholderGenerator(11);
  const placeholders: string[] = [];
  const values: unknown[] = [];

  segments.forEach(
    ({
      start_time,
      end_time,
      ai_line_changes: { additions: ai_additions, deletions: ai_deletions },
      human_line_changes: {
        additions: human_additions,
        deletions: human_deletions,
      },
      segment_type,
      git_branch,
    }) => {
      placeholders.push(placeholderGenerator());
      values.push(
        file_id,
        start_time,
        end_time,
        ai_additions,
        ai_deletions,
        human_additions,
        human_deletions,
        segment_type,
        editor,
        machine_id,
        git_branch || null
      );
    }
  );

  const placeholders_str = placeholders.join(", ");

  const text = `insert into file_segments (file_id, start_time, end_time, ai_line_additions, ai_line_deletions, human_line_additions, human_line_deletions, segment_type, editor, machine_id, git_branch) values ${placeholders_str} on conflict (file_id, start_time, end_time) do nothing`;

  await db.query({ text, values });
}

export { upsertProject, upsertFiles, upsertFileSegments };
