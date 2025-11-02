import pool from "@/pool";
import * as db from "./db";
import { EmailExists, InvalidPassword, UserNotFound } from "./errors";
import { type User } from "./validation";
import { generateToken } from "@/utils/jwt";
import bcrypt from "bcrypt";
import { DBError } from "@/pool";

const SALT_ROUNDS = 10;

const login = async (
  email: string,
  password: string
): Promise<
  { token: string; user: User } | UserNotFound | InvalidPassword | DBError
> => {
  const client = await pool.connect();
  try {
    client.query("begin transaction");
    const user = await db.getUserByEmail(client, email);
    if (user instanceof UserNotFound) return user;

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return new InvalidPassword();

    const { password_hash: _, ...rest } = user;

    const token = await generateToken(rest, "7d");
    client.query("commit");
    return { token, user: rest };
  } catch (err) {
    client.query("rollback");
    console.error(err);
    return new DBError();
  } finally {
    client.release();
  }
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
}): Promise<{ token: string; user: User } | EmailExists | DBError> => {
  const client = await pool.connect();
  try {
    client.query("begin transaction");
    const checkExisting = await db.getUserByEmail(client, email);
    if (!(checkExisting instanceof UserNotFound)) {
      client.query("commit");
      return new EmailExists(email);
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const new_user = await db.createUser(client, {
      name,
      email,
      password_hash,
      timezone,
    });

    const token = await generateToken(new_user, "7d");

    client.query("commit");
    return { token, user: new_user };
  } catch (err) {
    client.query("rollback");
    console.error(err);
    return new DBError();
  } finally {
    client.release();
  }
};
export { login, register };
