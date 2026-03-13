import { AppointmentStatus } from "@prisma/client";
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

export function createAppointmentCreateSchema(locale: Locale = "es") {
  return z.object({
    patientId: z.string().min(1, locale === "en" ? "Select a patient." : "Selecciona un paciente."),
    treatmentId: optionalTrimmedString(z.string()),
    scheduledAt: z.string().min(1, locale === "en" ? "Select the date and time." : "Selecciona la fecha y hora."),
    reason: optionalTrimmedString(z.string()),
    notes: optionalTrimmedString(z.string().max(1000, locale === "en" ? "Notes are too long." : "Notas demasiado largas.")),
  });
}

export function createAppointmentUpdateSchema(locale: Locale = "es") {
  return createAppointmentCreateSchema(locale).extend({
    appointmentId: z.string().min(1, locale === "en" ? "The appointment could not be identified." : "No se pudo identificar la cita."),
    redirectPath: z.string().min(1),
  });
}

export function createAppointmentStatusUpdateSchema(locale: Locale = "es") {
  return z.object({
    appointmentId: z.string().min(1),
    status: z.nativeEnum(AppointmentStatus),
    redirectPath: z.string().min(1),
    rescheduledAt: optionalTrimmedString(z.string()),
  }).superRefine((data, context) => {
    if (data.status === AppointmentStatus.RESCHEDULED && !data.rescheduledAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rescheduledAt"],
        message: locale === "en"
          ? "Select the new reschedule date and time."
          : "Selecciona la nueva fecha y hora de reprogramacion.",
      });
    }
  });
}

export function createAppointmentBulkStatusSchema(locale: Locale = "es") {
  return z.object({
    date: z.string().min(1, locale === "en" ? "The date could not be identified." : "No se pudo identificar la fecha."),
    redirectPath: z.string().min(1),
  });
}
