import z from "zod";

export enum SegmentType {
  CODING = "coding",
  DEBUGGING = "debugging",
  AICODING = "ai-coding",
}
export const SegmentTypeSchema = z.enum(Object.values(SegmentType));

export const SegmentSchema = z.object({
  // Time range
  start_time: z.coerce.date(),
  end_time: z.coerce.date(),

  // File identification
  file_path: z.string(),

  // Segment metadata
  segment_type: SegmentType,
  human_line_changes: z.number().int().nonnegative().default(0),
  ai_line_changes: z.number().int().nonnegative().default(0),
});

// File rename event - separate from regular segments
export const FileRenameSchema = z.object({
  timestamp: z.coerce.date(),
  old_file_path: z.string(),
  new_file_path: z.string(),
  lang: z.string().optional(), // language might change?
});

export const ProjectSessionSchema = z.object({
  project_path: z.string().default("__unknown__"),

  file_sessions: z.array(
    z.object({
      file_path: z.string(),
      segments: z.array(SegmentSchema),
      renames: z.array(FileRenameSchema),
    })
  ),
});

export type Segment = z.infer<typeof SegmentSchema>;
export type FileRename = z.infer<typeof FileRenameSchema>;
export type ProjectSession = z.input<typeof ProjectSessionSchema>;
