import * as db from "@/db/auth";
import { generateToken } from "@/utils/jwt";
import bcrypt from "bcrypt";

const login = async (
  email: string,
  password: string
): Promise<string | null> => {
  const user = await db.getUserByEmail(email);
  if (!user) return null;

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) return null;

  const { password_hash: _, ...rest } = user;

  const token = generateToken(rest, "7d");
  return token;
};

export { login };
