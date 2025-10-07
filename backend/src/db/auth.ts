import { type UserWithPasswordHash } from "@/validation/auth";
import db from ".";
import { Int } from "@getcronit/pylon";

const getUserByEmail = async (
  email: string
): Promise<UserWithPasswordHash | null> => {
  const users = await db.query({
    text: "select user_id, name, password_hash from users where email = $1 and is_deleted = false",
    values: [email],
  });
  console.log(users.rows);

  if (users.rows.length === 0) return null;
  const user = users.rows[0];
  return { ...user, email } as UserWithPasswordHash;
};

const createUser = async (data: {
  name: string;
  email: string;
  password_hash: string;
  timezone: Int;
}) => {
  const { name, email, password_hash, timezone } = data;
  const new_user_id = await db.query({
    text: "insert into users(name, email, password_hash, timezone) values ($1, $2, $3, $4) returning user_id",
    values: [name, email, password_hash, timezone],
  });

  const user_id = new_user_id.rows[0].user_id;
  return { name, email, timezone, user_id };
};
export { getUserByEmail, createUser };
