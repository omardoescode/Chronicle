import z from "zod";

export const UserSchema = z
  .object({
    user_id: z.int(),
    name: z.string().min(1),
    email: z.string().min(1),
  })
  .loose();

export type User = z.infer<typeof UserSchema>;

export const UserWithPasswordHashSchema = UserSchema.extend({
  password_hash: z.string(),
});

export type UserWithPasswordHash = z.infer<typeof UserWithPasswordHashSchema>;
