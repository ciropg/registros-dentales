import { z } from "zod";
import type { Locale } from "@/lib/i18n/config";

export function createLoginSchema(locale: Locale = "es") {
  return z.object({
    email: z.string().email(locale === "en" ? "Enter a valid email." : "Ingresa un email valido."),
    password: z.string().min(6, locale === "en" ? "Password must be at least 6 characters long." : "La contrasena debe tener al menos 6 caracteres."),
  });
}
