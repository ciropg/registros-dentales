import { AppointmentStatus } from "@prisma/client";
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

export const appointmentCreateSchema = z.object({
  patientId: z.string().min(1, "Selecciona un paciente."),
  treatmentId: optionalTrimmedString(z.string()),
  scheduledAt: z.string().min(1, "Selecciona la fecha y hora."),
  reason: optionalTrimmedString(z.string()),
  notes: optionalTrimmedString(z.string().max(1000, "Notas demasiado largas.")),
});

export const appointmentStatusUpdateSchema = z.object({
  appointmentId: z.string().min(1),
  status: z.nativeEnum(AppointmentStatus),
  redirectPath: z.string().min(1),
});
