import * as db from "./db";
import { EmailExists, InvalidPassword, UserNotFound } from "./errors";
import { type User } from "./validation";
import { generateToken } from "@/utils/jwt";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

const login = async (
  email: string,
  password: string
): Promise<{ token: string; user: User } | UserNotFound | InvalidPassword> => {
  const user = await db.getUserByEmail(email);
  if (user instanceof UserNotFound) return user;

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) return new InvalidPassword();

  const { password_hash: _, ...rest } = user;

  const token = await generateToken(rest, "7d");
  return { token, user: rest };
};

const register = async ({
  name,
  email,
  password,
  timezone,
}: {
  name: string;
  email: string;
  password: string;
  timezone: number;
}): Promise<{ token: string; user: User } | EmailExists> => {
  const checkExisting = await db.getUserByEmail(email);
  if (checkExisting) return new EmailExists(email);

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  const new_user = await db.createUser({
    name,
    email,
    password_hash,
    timezone,
  });

  const token = await generateToken(new_user, "7d");
  return { token, user: new_user };
};
export { login, register };
