import { AppointmentStatus } from "@prisma/client";
import { z } from "zod";

export const appointmentCreateSchema = z.object({
  patientId: z.string().min(1, "Selecciona un paciente."),
  treatmentId: z
    .string()
    .optional()
    .transform((value) => value || undefined),
  scheduledAt: z.string().min(1, "Selecciona la fecha y hora."),
  reason: z.string().trim().min(3, "Ingresa el motivo de la cita."),
  notes: z
    .string()
    .trim()
    .max(1000, "Notas demasiado largas.")
    .optional()
    .transform((value) => value || undefined),
});

export const appointmentStatusUpdateSchema = z.object({
  appointmentId: z.string().min(1),
  status: z.nativeEnum(AppointmentStatus),
  redirectPath: z.string().min(1),
});
