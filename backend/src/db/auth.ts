import db from "./index";
import { User } from "@/types";

export async function createUser(
  name: string,
  email: string,
  passwordHash: string,
  timezone: number
): Promise<User> {

  const maxIdQuery = `SELECT COALESCE(MAX(user_id), 0) as max_id FROM users`;
  const maxIdResult = await db.query(maxIdQuery);
  const nextId = maxIdResult.rows[0].max_id + 1;

  const query = `
    INSERT INTO users (user_id, name, email, password_hash, timezone, is_deleted)
    VALUES ($1, $2, $3, $4, $5, false)
    RETURNING user_id, name, email, timezone, is_deleted
  `;
  const values = [nextId, name, email, passwordHash, timezone];
  const result = await db.query(query, values);
  return result.rows[0];
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const query = `
    SELECT user_id, name, email, password_hash, timezone, is_deleted
    FROM users
    WHERE email = $1 AND is_deleted = false
  `;
  const result = await db.query(query, [email]);
  return result.rows[0] || null;
}

export async function getUserById(userId: number): Promise<User | null> {
  const query = `
    SELECT user_id, name, email, timezone, is_deleted
    FROM users
    WHERE user_id = $1 AND is_deleted = false
  `;
  const result = await db.query(query, [userId]);
  return result.rows[0] || null;
}

export async function getAllUsers(): Promise<User[]> {
  const query = `
    SELECT user_id, name, email, timezone, is_deleted
    FROM users
    WHERE is_deleted = false
    ORDER BY user_id ASC
  `;
  const result = await db.query(query);
  return result.rows;
}

export async function getUserByIdentifier(identifier: string): Promise<User | null> {
  const query = `
    SELECT user_id, name, email, password_hash, timezone, is_deleted
    FROM users
    WHERE (
      email = $1 OR 
      name = $1 OR 
      user_id = CASE 
        WHEN $1 ~ '^[0-9]+$' THEN $1::integer
        ELSE -1
      END
    ) AND is_deleted = false
  `;
  const result = await db.query(query, [identifier]);
  return result.rows[0] || null;
}
