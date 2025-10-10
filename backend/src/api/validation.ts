import z from "zod";

export enum Editor {
  VSCODE = "vscode",
  UNKNOWN = "unknown",
}

export const EditorSchema = z.enum(Object.values(Editor));

export const ApiKeySchema = z.string().regex(/^[A-Za-z0-9]{64}$/, {
  message: "API key must be 64 alphanumeric characters.",
});

export type ApiKey = z.infer<typeof ApiKeySchema>;
