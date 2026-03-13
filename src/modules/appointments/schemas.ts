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

export const appointmentUpdateSchema = appointmentCreateSchema.extend({
  appointmentId: z.string().min(1, "No se pudo identificar la cita."),
  redirectPath: z.string().min(1),
});

export const appointmentStatusUpdateSchema = z.object({
  appointmentId: z.string().min(1),
  status: z.nativeEnum(AppointmentStatus),
  redirectPath: z.string().min(1),
  rescheduledAt: optionalTrimmedString(z.string()),
}).superRefine((data, context) => {
  if (data.status === AppointmentStatus.RESCHEDULED && !data.rescheduledAt) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["rescheduledAt"],
      message: "Selecciona la nueva fecha y hora de reprogramacion.",
    });
  }
});

export const appointmentBulkStatusSchema = z.object({
  date: z.string().min(1, "No se pudo identificar la fecha."),
  redirectPath: z.string().min(1),
});
