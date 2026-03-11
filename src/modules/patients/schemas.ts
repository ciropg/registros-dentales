import { z } from "zod";

export const patientCreateSchema = z.object({
  firstName: z.string().trim().min(2, "Ingresa el nombre del paciente."),
  lastName: z.string().trim().min(2, "Ingresa el apellido del paciente."),
  documentNumber: z
    .string()
    .trim()
    .max(20, "Documento demasiado largo.")
    .optional()
    .transform((value) => value || undefined),
  phone: z
    .string()
    .trim()
    .max(30, "Telefono demasiado largo.")
    .optional()
    .transform((value) => value || undefined),
  email: z
    .string()
    .trim()
    .email("Ingresa un email valido.")
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
  birthDate: z
    .string()
    .optional()
    .transform((value) => value || undefined),
  notes: z
    .string()
    .trim()
    .max(1000, "Notas demasiado largas.")
    .optional()
    .transform((value) => value || undefined),
});

export const patientPhotoUploadSchema = z.object({
  description: z
    .string()
    .trim()
    .max(500, "La descripcion no puede superar 500 caracteres.")
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
});
