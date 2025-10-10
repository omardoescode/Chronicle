import z from "zod";

export const EditorSchema = z.enum(["vscode"]);

export type Editor = z.infer<typeof EditorSchema>;

export const ApiKeySchema = z.string().regex(/^[A-Za-z0-9]{64}$/, {
  message: "API key must be 64 alphanumeric characters.",
});

export type ApiKey = z.infer<typeof ApiKeySchema>;
