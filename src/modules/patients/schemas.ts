import { z } from "zod";
import type { Locale } from "@/lib/i18n/config";

function normalizeOptionalText(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length ? trimmedValue : undefined;
}

function optionalTrimmedString(schema: z.ZodString) {
  return z.preprocess(normalizeOptionalText, schema.optional());
}

export function createPatientCreateSchema(locale: Locale = "es") {
  return z.object({
    firstName: z.string().trim().min(1, locale === "en" ? "Enter the patient's first name." : "Ingresa el nombre del paciente."),
    lastName: z.string().trim().min(1, locale === "en" ? "Enter the patient's last name." : "Ingresa el apellido del paciente."),
    documentNumber: optionalTrimmedString(
      z.string().regex(/^\d{8}$/, locale === "en" ? "The document must contain 8 digits." : "El documento debe tener 8 digitos."),
    ),
    phone: optionalTrimmedString(z.string().max(30, locale === "en" ? "Phone number is too long." : "Telefono demasiado largo.")),
    email: z.preprocess(
      normalizeOptionalText,
      z
        .string()
        .email(locale === "en" ? "Enter a valid email." : "Ingresa un email valido.")
        .transform((value) => value.toLowerCase())
        .optional(),
    ),
    birthDate: optionalTrimmedString(z.string()),
    notes: optionalTrimmedString(z.string().max(1000, locale === "en" ? "Notes are too long." : "Notas demasiado largas.")),
  });
}

export function createPatientUpdateSchema(locale: Locale = "es") {
  return createPatientCreateSchema(locale).extend({
    patientId: z.string().min(1, locale === "en" ? "The patient could not be identified." : "No se pudo identificar el paciente."),
  });
}

export function createPatientPhotoUploadSchema(locale: Locale = "es") {
  return z.object({
    description: z
      .string()
      .trim()
      .max(500, locale === "en" ? "The description cannot exceed 500 characters." : "La descripcion no puede superar 500 caracteres.")
      .optional()
      .or(z.literal(""))
      .transform((value) => value || undefined),
  });
}
