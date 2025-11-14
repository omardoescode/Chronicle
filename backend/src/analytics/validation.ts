import { z } from "zod";

export const WindowSchema = z.object({
  start: z.iso.date().transform((x) => new Date(x)),
  interval: z.object({
    unit: z.enum(["day", "week", "month", "year"]),
    count: z.number().int().positive(),
  }),
});

export type WindowSchemaType = z.infer<typeof WindowSchema>;
export type WindowSchemaInputType = z.input<typeof WindowSchema>;
