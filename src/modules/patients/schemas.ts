import { z } from "zod";

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

export const patientCreateSchema = z.object({
  firstName: z.string().trim().min(1, "Ingresa el nombre del paciente."),
  lastName: z.string().trim().min(1, "Ingresa el apellido del paciente."),
  documentNumber: optionalTrimmedString(
    z.string().regex(/^\d{8}$/, "El documento debe tener 8 digitos."),
  ),
  phone: optionalTrimmedString(z.string().max(30, "Telefono demasiado largo.")),
  email: z.preprocess(
    normalizeOptionalText,
    z
      .string()
      .email("Ingresa un email valido.")
      .transform((value) => value.toLowerCase())
      .optional(),
  ),
  birthDate: optionalTrimmedString(z.string()),
  notes: optionalTrimmedString(z.string().max(1000, "Notas demasiado largas.")),
});

export const patientUpdateSchema = patientCreateSchema.extend({
  patientId: z.string().min(1, "No se pudo identificar el paciente."),
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
