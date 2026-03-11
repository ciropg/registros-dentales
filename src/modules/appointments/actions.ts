"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBaseRole } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { buildErrorSearch, buildSuccessSearch } from "@/lib/utils";
import {
  appointmentCreateSchema,
  appointmentStatusUpdateSchema,
} from "@/modules/appointments/schemas";

export async function createAppointmentAction(formData: FormData) {
  const user = await requireBaseRole(["ADMIN", "DENTIST", "ASSISTANT", "RECEPTIONIST"]);

  const parsed = appointmentCreateSchema.safeParse({
    patientId: formData.get("patientId"),
    treatmentId: formData.get("treatmentId"),
    scheduledAt: formData.get("scheduledAt"),
    reason: formData.get("reason"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    redirect(`/appointments/new${buildErrorSearch(parsed.error.issues[0]?.message ?? "No se pudo crear la cita.")}`);
  }

  const appointment = await prisma.appointment.create({
    data: {
      patientId: parsed.data.patientId,
      treatmentId: parsed.data.treatmentId,
      scheduledAt: new Date(parsed.data.scheduledAt),
      reason: parsed.data.reason,
      notes: parsed.data.notes,
    },
  });

  await recordAudit({
    actorId: user.id,
    entityType: "appointment",
    entityId: appointment.id,
    action: "APPOINTMENT_CREATED",
    description: `Se creo una cita para ${parsed.data.scheduledAt}.`,
  });

  revalidatePath("/appointments");
  revalidatePath("/dashboard");
  revalidatePath(`/patients/${parsed.data.patientId}`);
  redirect(`/appointments${buildSuccessSearch("Cita registrada correctamente.")}`);
}

export async function updateAppointmentStatusAction(formData: FormData) {
  const user = await requireBaseRole(["ADMIN", "DENTIST", "ASSISTANT", "RECEPTIONIST"]);

  const parsed = appointmentStatusUpdateSchema.safeParse({
    appointmentId: formData.get("appointmentId"),
    status: formData.get("status"),
    redirectPath: formData.get("redirectPath"),
  });

  if (!parsed.success) {
    redirect(`/appointments${buildErrorSearch("No se pudo actualizar el estado de la cita.")}`);
  }

  const appointment = await prisma.appointment.update({
    where: { id: parsed.data.appointmentId },
    data: {
      status: parsed.data.status,
    },
    select: {
      id: true,
      patientId: true,
      treatmentId: true,
      status: true,
    },
  });

  await recordAudit({
    actorId: user.id,
    entityType: "appointment",
    entityId: appointment.id,
    action: "APPOINTMENT_STATUS_UPDATED",
    description: `Cita actualizada a ${appointment.status}.`,
  });

  revalidatePath("/appointments");
  revalidatePath("/dashboard");
  revalidatePath(`/patients/${appointment.patientId}`);

  if (appointment.treatmentId) {
    revalidatePath(`/treatments/${appointment.treatmentId}`);
  }

  redirect(`${parsed.data.redirectPath}${buildSuccessSearch("Estado de cita actualizado.")}`);
}
