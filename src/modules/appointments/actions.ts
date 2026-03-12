"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBaseRole } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { buildErrorSearch, buildSuccessSearch } from "@/lib/utils";
import {
  appointmentCreateSchema,
  appointmentUpdateSchema,
  appointmentStatusUpdateSchema,
} from "@/modules/appointments/schemas";

function appendSearchMessage(path: string, type: "error" | "success", message: string) {
  const separator = path.includes("?") ? "&" : "?";

  return `${path}${separator}${type}=${encodeURIComponent(message)}`;
}

async function getAppointmentOrRedirect(appointmentId: string, isDemo: boolean, redirectPath: string) {
  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      isDemo,
    },
    select: {
      id: true,
      patientId: true,
      treatmentId: true,
    },
  });

  if (!appointment) {
    redirect(appendSearchMessage(redirectPath, "error", "La cita no existe en tu entorno."));
  }

  return appointment;
}

async function resolveAppointmentReferences(params: {
  patientId: string;
  treatmentId?: string;
  isDemo: boolean;
  redirectPath: string;
}) {
  const patient = await prisma.patient.findFirst({
    where: {
      id: params.patientId,
      isDemo: params.isDemo,
    },
    select: {
      id: true,
    },
  });

  if (!patient) {
    redirect(appendSearchMessage(params.redirectPath, "error", "El paciente no existe en tu entorno."));
  }

  let treatmentId: string | undefined;

  if (params.treatmentId) {
    const treatment = await prisma.treatment.findFirst({
      where: {
        id: params.treatmentId,
        isDemo: params.isDemo,
      },
      select: {
        id: true,
        patientId: true,
      },
    });

    if (!treatment) {
      redirect(appendSearchMessage(params.redirectPath, "error", "El tratamiento no existe en tu entorno."));
    }

    if (treatment.patientId !== patient.id) {
      redirect(appendSearchMessage(params.redirectPath, "error", "El tratamiento no pertenece al paciente seleccionado."));
    }

    treatmentId = treatment.id;
  }

  return {
    patientId: patient.id,
    treatmentId,
  };
}

function revalidateAppointmentPaths(patientId: string, treatmentId?: string | null) {
  revalidatePath("/appointments");
  revalidatePath("/appointments/new");
  revalidatePath("/dashboard");
  revalidatePath(`/patients/${patientId}`);

  if (treatmentId) {
    revalidatePath(`/treatments/${treatmentId}`);
  }
}

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

  const references = await resolveAppointmentReferences({
    patientId: parsed.data.patientId,
    treatmentId: parsed.data.treatmentId,
    isDemo: user.isDemo,
    redirectPath: "/appointments/new",
  });

  const appointment = await prisma.appointment.create({
    data: {
      patientId: references.patientId,
      treatmentId: references.treatmentId,
      scheduledAt: new Date(parsed.data.scheduledAt),
      reason: parsed.data.reason ?? "",
      notes: parsed.data.notes,
      isDemo: user.isDemo,
    },
  });

  await recordAudit({
    actorId: user.id,
    entityType: "appointment",
    entityId: appointment.id,
    action: "APPOINTMENT_CREATED",
    description: `Se creo una cita para ${parsed.data.scheduledAt}.`,
  });

  revalidateAppointmentPaths(references.patientId, references.treatmentId);
  redirect(`/appointments${buildSuccessSearch("Cita registrada correctamente.")}`);
}

export async function updateAppointmentAction(formData: FormData) {
  const user = await requireBaseRole(["ADMIN", "DENTIST", "ASSISTANT", "RECEPTIONIST"]);

  const parsed = appointmentUpdateSchema.safeParse({
    appointmentId: formData.get("appointmentId"),
    patientId: formData.get("patientId"),
    treatmentId: formData.get("treatmentId"),
    scheduledAt: formData.get("scheduledAt"),
    reason: formData.get("reason"),
    notes: formData.get("notes"),
    redirectPath: formData.get("redirectPath"),
  });

  if (!parsed.success) {
    redirect(
      appendSearchMessage(
        `/appointments/${String(formData.get("appointmentId") ?? "")}/edit`,
        "error",
        parsed.error.issues[0]?.message ?? "No se pudo actualizar la cita.",
      ),
    );
  }

  const existingAppointment = await getAppointmentOrRedirect(
    parsed.data.appointmentId,
    user.isDemo,
    parsed.data.redirectPath,
  );

  const references = await resolveAppointmentReferences({
    patientId: parsed.data.patientId,
    treatmentId: parsed.data.treatmentId,
    isDemo: user.isDemo,
    redirectPath: `/appointments/${parsed.data.appointmentId}/edit`,
  });

  const appointment = await prisma.appointment.update({
    where: {
      id: existingAppointment.id,
    },
    data: {
      patientId: references.patientId,
      treatmentId: references.treatmentId,
      scheduledAt: new Date(parsed.data.scheduledAt),
      reason: parsed.data.reason ?? "",
      notes: parsed.data.notes,
    },
  });

  await recordAudit({
    actorId: user.id,
    entityType: "appointment",
    entityId: appointment.id,
    action: "APPOINTMENT_UPDATED",
    description: `Se actualizo la cita programada para ${parsed.data.scheduledAt}.`,
  });

  revalidateAppointmentPaths(appointment.patientId, appointment.treatmentId);

  if (existingAppointment.patientId !== appointment.patientId) {
    revalidatePath(`/patients/${existingAppointment.patientId}`);
  }

  if (existingAppointment.treatmentId && existingAppointment.treatmentId !== appointment.treatmentId) {
    revalidatePath(`/treatments/${existingAppointment.treatmentId}`);
  }

  redirect(appendSearchMessage(parsed.data.redirectPath, "success", "Cita actualizada correctamente."));
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

  const existingAppointment = await getAppointmentOrRedirect(parsed.data.appointmentId, user.isDemo, parsed.data.redirectPath);

  const appointment = await prisma.appointment.update({
    where: { id: existingAppointment.id },
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

  revalidateAppointmentPaths(appointment.patientId, appointment.treatmentId);

  redirect(appendSearchMessage(parsed.data.redirectPath, "success", "Estado de cita actualizado."));
}
