import { createUser, getUserByEmail, getUserById, getUserByIdentifier } from "@/db/auth";
import { generateJWT, verifyJWT } from "@/utils/jwt";
import { User, AuthResponse } from "@/types";
import { hash, compare } from "bcrypt";

const SALT_ROUNDS = 10;

export async function signup(
  name: string,
  email: string,
  password: string,
  timezone: number
): Promise<AuthResponse> {
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  const passwordHash = await hash(password, SALT_ROUNDS);
  const user = await createUser(name, email, passwordHash, timezone);
  const token = generateJWT({ userId: user.user_id, email: user.email });

  return {
    user: {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      timezone: user.timezone,
      is_deleted: user.is_deleted,
    },
    token,
  };
}

export async function login(
  identifier: string,
  password: string
): Promise<AuthResponse> {
  const user = await getUserByIdentifier(identifier);
  if (!user) {
    throw new Error("Invalid credentials");
  }

  if (user.is_deleted) {
    throw new Error("Your account has been deleted.");
  }

  const isValidPassword = await compare(password, user.password_hash!);
  if (!isValidPassword) {
    throw new Error("Invalid email or password");
  }

  const token = generateJWT({ userId: user.user_id, email: user.email });

  return {
    user: {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      timezone: user.timezone,
      is_deleted: user.is_deleted,
    },
    token,
  };
}

export async function getCurrentUser(token: string): Promise<User> {
  const payload = verifyJWT(token);
  if (!payload || !payload.userId) {
    throw new Error("Invalid token");
  }

  const user = await getUserById(payload.userId);
  if (!user) {
    throw new Error("User not found");
  }

  return user;
}
