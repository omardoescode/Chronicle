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

  // Segment metadata
  segment_type: SegmentTypeSchema,
  human_line_changes: z.number().int().nonnegative().default(0),
  ai_line_changes: z.number().int().nonnegative().default(0),
});

export const ProjectSessionSchema = z.object({
  project_path: z.string().default("__unknown__"),

  files: z.array(
    z.object({
      file_path: z.string(),
      lang: z.string(),
      segments: z.array(SegmentSchema),
    })
  ),
});

export type Segment = z.infer<typeof SegmentSchema>;
export type ProjectSessionInput = z.input<typeof ProjectSessionSchema>;
export type ProjectSession = z.infer<typeof ProjectSessionSchema>;
