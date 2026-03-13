import { UserRole } from "@prisma/client";
import { z } from "zod";
import type { Locale } from "@/lib/i18n/config";

export function createUserCreateSchema(locale: Locale = "es") {
  return z.object({
    name: z.string().trim().min(3, locale === "en" ? "Enter the user's name." : "Ingresa el nombre del usuario."),
    email: z.string().trim().email(locale === "en" ? "Enter a valid email." : "Ingresa un email valido.").transform((value) => value.toLowerCase()),
    role: z.nativeEnum(UserRole),
    password: z.string().min(8, locale === "en" ? "Password must be at least 8 characters long." : "La contrasena debe tener al menos 8 caracteres."),
  });
}

export function createUserUpdateSchema(locale: Locale = "es") {
  return z.object({
    userId: z.string().min(1),
    name: z.string().trim().min(3, locale === "en" ? "Enter the user's name." : "Ingresa el nombre del usuario."),
    email: z.string().trim().email(locale === "en" ? "Enter a valid email." : "Ingresa un email valido.").transform((value) => value.toLowerCase()),
    role: z.nativeEnum(UserRole),
    password: z
      .string()
      .optional()
      .transform((value) => value?.trim() || undefined)
      .refine((value) => !value || value.length >= 8, {
        message: locale === "en" ? "Password must be at least 8 characters long." : "La contrasena debe tener al menos 8 caracteres.",
      }),
  });
}

export function createUserToggleActiveSchema() {
  return z.object({
    userId: z.string().min(1),
    redirectPath: z.string().min(1),
  });
}
