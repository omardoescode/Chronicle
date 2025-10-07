import { JWTPayload, SignJWT, jwtVerify } from "jose";
import env from "./env";

const secret = new TextEncoder().encode(env.JWT_SECRET);

export async function generateToken(payload: JWTPayload, expiresIn = "1h") {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload;
}
