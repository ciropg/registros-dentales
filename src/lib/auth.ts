import { type UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getBaseRole, type BaseUserRole } from "@/lib/roles";
import { getSessionCookieName, signSession, verifySession, type SessionPayload } from "@/lib/session";

export async function getSession() {
  const store = await cookies();
  const token = store.get(getSessionCookieName())?.value;

  if (!token) {
    return null;
  }

  try {
    return await verifySession(token);
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isDemo: true,
      active: true,
    },
  });
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user || !user.active) {
    redirect("/login");
  }

  return user;
}

export async function requireRole(roles: UserRole[]) {
  const user = await requireUser();

  if (!roles.includes(user.role)) {
    redirect("/dashboard");
  }

  return user;
}

export async function requireBaseRole(roles: BaseUserRole[]) {
  const user = await requireUser();

  if (!roles.includes(getBaseRole(user.role))) {
    redirect("/dashboard");
  }

  return user;
}

export async function authenticateUser(email: string, password: string): Promise<SessionPayload | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user || !user.active) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    return null;
  }

  return {
    userId: user.id,
    role: user.role,
    isDemo: user.isDemo,
    email: user.email,
    name: user.name,
  };
}

export async function persistSession(session: SessionPayload) {
  const store = await cookies();
  const token = await signSession(session);

  store.set(getSessionCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(getSessionCookieName());
}
