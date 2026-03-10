import { SignJWT, jwtVerify } from "jose";

export type SessionPayload = {
  userId: string;
  role: string;
  email: string;
  name: string;
};

const SESSION_COOKIE = "rd_session";

function getSecret() {
  const value = process.env.AUTH_SECRET;

  if (!value) {
    throw new Error("AUTH_SECRET is not configured.");
  }

  return new TextEncoder().encode(value);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySession(token: string) {
  const { payload } = await jwtVerify(token, getSecret());
  return payload as SessionPayload;
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}
