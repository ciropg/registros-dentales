"use server";

import { redirect } from "next/navigation";
import { authenticateUser, clearSession, persistSession } from "@/lib/auth";
import { buildErrorSearch } from "@/lib/utils";
import { loginSchema } from "@/modules/auth/schemas";

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(`/login${buildErrorSearch(parsed.error.issues[0]?.message ?? "Credenciales invalidas.")}`);
  }

  const session = await authenticateUser(parsed.data.email, parsed.data.password);

  if (!session) {
    redirect(`/login${buildErrorSearch("Email o contrasena incorrectos.")}`);
  }

  await persistSession(session);
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}
