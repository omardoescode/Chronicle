import { UserWithPasswordHash } from "@/types/auth";
import db from ".";

const getUserByEmail = async (
  email: string
): Promise<UserWithPasswordHash | null> => {
  const users = await db.query({
    text: "select user_id, name, password_hash from users where email = $1",
    values: [email],
  });

  if (!users) return null;
  const user = users.rows[0];
  return user as UserWithPasswordHash;
};

export { getUserByEmail };
