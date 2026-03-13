import { PhaseStatus } from "@prisma/client";
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

function createTreatmentPhaseSchema(locale: Locale) {
  return z.object({
    name: z.string().trim().min(2, locale === "en" ? "Each phase must have a name." : "Cada fase debe tener nombre."),
    weight: z.coerce.number().int().min(1, locale === "en" ? "The minimum weight is 1." : "El peso minimo es 1."),
    plannedDate: optionalTrimmedString(z.string()),
  });
}

export function createTreatmentCreateSchema(locale: Locale = "es") {
  return z
    .object({
      patientId: z.string().min(1, locale === "en" ? "Select a patient." : "Selecciona un paciente."),
      dentistId: z
        .string()
        .optional()
        .transform((value) => value || undefined),
      title: z.string().trim().min(3, locale === "en" ? "Enter the treatment name." : "Ingresa el nombre del tratamiento."),
      diagnosis: optionalTrimmedString(z.string()),
      startDate: z.string().min(1, locale === "en" ? "Enter the start date." : "Ingresa la fecha de inicio."),
      estimatedEndDate: z.string().min(1, locale === "en" ? "Enter the estimated end date." : "Ingresa la fecha estimada de fin."),
      notes: optionalTrimmedString(z.string().max(1000, locale === "en" ? "Notes are too long." : "Notas demasiado largas.")),
      phases: z.array(createTreatmentPhaseSchema(locale)).min(1, locale === "en" ? "Add at least one phase." : "Agrega al menos una fase."),
    })
    .superRefine((value, context) => {
      if (new Date(value.estimatedEndDate) <= new Date(value.startDate)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["estimatedEndDate"],
          message: locale === "en" ? "The end date must be after the start date." : "La fecha final debe ser posterior a la fecha de inicio.",
        });
      }
    });
}

export function createTreatmentUpdateSchema(locale: Locale = "es") {
  return z
    .object({
      treatmentId: z.string().min(1),
      dentistId: z
        .string()
        .optional()
        .transform((value) => value || undefined),
      title: z.string().trim().min(3, locale === "en" ? "Enter the treatment name." : "Ingresa el nombre del tratamiento."),
      diagnosis: optionalTrimmedString(z.string()),
      startDate: z.string().min(1, locale === "en" ? "Enter the start date." : "Ingresa la fecha de inicio."),
      estimatedEndDate: z.string().min(1, locale === "en" ? "Enter the estimated end date." : "Ingresa la fecha estimada de fin."),
      notes: optionalTrimmedString(z.string().max(1000, locale === "en" ? "Notes are too long." : "Notas demasiado largas.")),
    })
    .superRefine((value, context) => {
      if (new Date(value.estimatedEndDate) <= new Date(value.startDate)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["estimatedEndDate"],
          message: locale === "en" ? "The end date must be after the start date." : "La fecha final debe ser posterior a la fecha de inicio.",
        });
      }
    });
}

export function createTreatmentPhaseUpdateSchema() {
  return z.object({
    treatmentId: z.string().min(1),
    phaseId: z.string().min(1),
    status: z.nativeEnum(PhaseStatus),
  });
}
