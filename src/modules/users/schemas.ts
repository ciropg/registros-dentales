import { UserRole } from "@prisma/client";
import { z } from "zod";

export const userCreateSchema = z.object({
  name: z.string().trim().min(3, "Ingresa el nombre del usuario."),
  email: z.string().trim().email("Ingresa un email valido.").transform((value) => value.toLowerCase()),
  role: z.nativeEnum(UserRole),
  password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres."),
});

export const userUpdateSchema = z.object({
  userId: z.string().min(1),
  name: z.string().trim().min(3, "Ingresa el nombre del usuario."),
  email: z.string().trim().email("Ingresa un email valido.").transform((value) => value.toLowerCase()),
  role: z.nativeEnum(UserRole),
  password: z
    .string()
    .optional()
    .transform((value) => value?.trim() || undefined)
    .refine((value) => !value || value.length >= 8, {
      message: "La contrasena debe tener al menos 8 caracteres.",
    }),
});

export const userToggleActiveSchema = z.object({
  userId: z.string().min(1),
  redirectPath: z.string().min(1),
});
