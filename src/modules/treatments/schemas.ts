import { PhaseStatus } from "@prisma/client";
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

export const treatmentPhaseSchema = z.object({
  name: z.string().trim().min(2, "Cada fase debe tener nombre."),
  weight: z.coerce.number().int().min(1, "El peso minimo es 1."),
  plannedDate: optionalTrimmedString(z.string()),
});

export const treatmentCreateSchema = z
  .object({
    patientId: z.string().min(1, "Selecciona un paciente."),
    dentistId: z
      .string()
      .optional()
      .transform((value) => value || undefined),
    title: z.string().trim().min(3, "Ingresa el nombre del tratamiento."),
    diagnosis: optionalTrimmedString(z.string()),
    startDate: z.string().min(1, "Ingresa la fecha de inicio."),
    estimatedEndDate: z.string().min(1, "Ingresa la fecha estimada de fin."),
    notes: optionalTrimmedString(z.string().max(1000, "Notas demasiado largas.")),
    phases: z.array(treatmentPhaseSchema).min(1, "Agrega al menos una fase."),
  })
  .superRefine((value, context) => {
    if (new Date(value.estimatedEndDate) <= new Date(value.startDate)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["estimatedEndDate"],
        message: "La fecha final debe ser posterior a la fecha de inicio.",
      });
    }
  });

export const treatmentPhaseUpdateSchema = z.object({
  treatmentId: z.string().min(1),
  phaseId: z.string().min(1),
  status: z.nativeEnum(PhaseStatus),
});
