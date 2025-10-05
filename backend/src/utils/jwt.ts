import jwt from "jsonwebtoken";
import env from "./env";

const JWT_SECRET = env.JWT_SECRET || "It will be updated";
const JWT_EXPIRES_IN = "24h";

interface JWTPayload {
  userId: number;
  email: string;
}

export function generateJWT(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyJWT(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error("Invalid token");
  }
}
