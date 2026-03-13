"use server";

import { redirect } from "next/navigation";
import { authenticateUser, clearSession, persistSession } from "@/lib/auth";
import { getCurrentLocale } from "@/lib/i18n/server";
import { buildErrorSearch } from "@/lib/utils";
import { createLoginSchema } from "@/modules/auth/schemas";

export async function loginAction(formData: FormData) {
  const locale = await getCurrentLocale();
  const copy = locale === "en"
    ? {
        invalidCredentials: "Invalid credentials.",
        incorrectEmailOrPassword: "Incorrect email or password.",
      }
    : {
        invalidCredentials: "Credenciales invalidas.",
        incorrectEmailOrPassword: "Email o contrasena incorrectos.",
      };

  const parsed = createLoginSchema(locale).safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(`/login${buildErrorSearch(parsed.error.issues[0]?.message ?? copy.invalidCredentials)}`);
  }

  const session = await authenticateUser(parsed.data.email, parsed.data.password);

  if (!session) {
    redirect(`/login${buildErrorSearch(copy.incorrectEmailOrPassword)}`);
  }

  await persistSession(session);
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}
