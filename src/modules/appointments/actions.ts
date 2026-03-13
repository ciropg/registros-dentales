"use server";

import { AppointmentStatus } from "@prisma/client";
import { endOfDay, startOfDay } from "date-fns";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBaseRole } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { buildErrorSearch, buildSuccessSearch } from "@/lib/utils";
import {
  appointmentBulkStatusSchema,
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

function revalidateBulkAppointmentPaths(
  appointments: Array<{
    patientId: string;
    treatmentId?: string | null;
  }>,
) {
  revalidatePath("/appointments");
  revalidatePath("/appointments/new");
  revalidatePath("/dashboard");

  for (const patientId of new Set(appointments.map((appointment) => appointment.patientId))) {
    revalidatePath(`/patients/${patientId}`);
  }

  for (const treatmentId of new Set(
    appointments
      .map((appointment) => appointment.treatmentId)
      .filter((treatmentId): treatmentId is string => Boolean(treatmentId)),
  )) {
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

export async function markTodayAppointmentsAsAttendedAction(formData: FormData) {
  const user = await requireBaseRole(["ADMIN", "DENTIST", "ASSISTANT", "RECEPTIONIST"]);

  const parsed = appointmentBulkStatusSchema.safeParse({
    date: formData.get("date"),
    redirectPath: formData.get("redirectPath"),
  });

  if (!parsed.success) {
    redirect(`/appointments${buildErrorSearch("No se pudo actualizar las citas de hoy.")}`);
  }

  const normalizedDate = new Date(`${parsed.data.date}T00:00:00`);

  if (Number.isNaN(normalizedDate.getTime())) {
    redirect(appendSearchMessage(parsed.data.redirectPath, "error", "La fecha enviada no es valida."));
  }

  const appointmentsToUpdate = await prisma.appointment.findMany({
    where: {
      isDemo: user.isDemo,
      scheduledAt: {
        gte: startOfDay(normalizedDate),
        lte: endOfDay(normalizedDate),
      },
      status: {
        in: [AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED],
      },
    },
    select: {
      id: true,
      patientId: true,
      treatmentId: true,
    },
  });

  if (!appointmentsToUpdate.length) {
    redirect(appendSearchMessage(parsed.data.redirectPath, "success", "No habia citas de hoy pendientes por marcar."));
  }

  await prisma.appointment.updateMany({
    where: {
      id: {
        in: appointmentsToUpdate.map((appointment) => appointment.id),
      },
    },
    data: {
      status: AppointmentStatus.ATTENDED,
    },
  });

  await Promise.all(
    appointmentsToUpdate.map((appointment) =>
      recordAudit({
        actorId: user.id,
        entityType: "appointment",
        entityId: appointment.id,
        action: "APPOINTMENT_STATUS_UPDATED",
        description: "Cita actualizada a ATTENDED desde la accion masiva de agenda.",
      }),
    ),
  );

  revalidateBulkAppointmentPaths(appointmentsToUpdate);

  redirect(
    appendSearchMessage(
      parsed.data.redirectPath,
      "success",
      `${appointmentsToUpdate.length} cita${appointmentsToUpdate.length === 1 ? "" : "s"} de hoy marcada${appointmentsToUpdate.length === 1 ? "" : "s"} como asistio.`,
    ),
  );
}

export async function markTodayAppointmentsAsNoShowAction(formData: FormData) {
  const user = await requireBaseRole(["ADMIN", "DENTIST", "ASSISTANT", "RECEPTIONIST"]);

  const parsed = appointmentBulkStatusSchema.safeParse({
    date: formData.get("date"),
    redirectPath: formData.get("redirectPath"),
  });

  if (!parsed.success) {
    redirect(`/appointments${buildErrorSearch("No se pudo actualizar las citas de hoy.")}`);
  }

  const normalizedDate = new Date(`${parsed.data.date}T00:00:00`);

  if (Number.isNaN(normalizedDate.getTime())) {
    redirect(appendSearchMessage(parsed.data.redirectPath, "error", "La fecha enviada no es valida."));
  }

  const appointmentsToUpdate = await prisma.appointment.findMany({
    where: {
      isDemo: user.isDemo,
      scheduledAt: {
        gte: startOfDay(normalizedDate),
        lte: endOfDay(normalizedDate),
      },
      status: {
        in: [AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED],
      },
    },
    select: {
      id: true,
      patientId: true,
      treatmentId: true,
    },
  });

  if (!appointmentsToUpdate.length) {
    redirect(
      appendSearchMessage(parsed.data.redirectPath, "success", "No habia citas de hoy pendientes por marcar como no asistio."),
    );
  }

  await prisma.appointment.updateMany({
    where: {
      id: {
        in: appointmentsToUpdate.map((appointment) => appointment.id),
      },
    },
    data: {
      status: AppointmentStatus.NO_SHOW,
    },
  });

  await Promise.all(
    appointmentsToUpdate.map((appointment) =>
      recordAudit({
        actorId: user.id,
        entityType: "appointment",
        entityId: appointment.id,
        action: "APPOINTMENT_STATUS_UPDATED",
        description: "Cita actualizada a NO_SHOW desde la accion masiva de agenda.",
      }),
    ),
  );

  revalidateBulkAppointmentPaths(appointmentsToUpdate);

  redirect(
    appendSearchMessage(
      parsed.data.redirectPath,
      "success",
      `${appointmentsToUpdate.length} cita${appointmentsToUpdate.length === 1 ? "" : "s"} de hoy marcada${appointmentsToUpdate.length === 1 ? "" : "s"} como no asistio.`,
    ),
  );
}
