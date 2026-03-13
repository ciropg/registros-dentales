"use server";

import { AppointmentStatus } from "@prisma/client";
import { endOfDay, startOfDay } from "date-fns";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBaseRole } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { getCurrentLocale } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { buildErrorSearch, buildSuccessSearch } from "@/lib/utils";
import {
  createAppointmentBulkStatusSchema,
  createAppointmentCreateSchema,
  createAppointmentUpdateSchema,
  createAppointmentStatusUpdateSchema,
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
      scheduledAt: true,
      reason: true,
      notes: true,
      status: true,
      isDemo: true,
    },
  });

  if (!appointment) {
    const locale = await getCurrentLocale();
    redirect(
      appendSearchMessage(
        redirectPath,
        "error",
        locale === "en" ? "The appointment does not exist in your environment." : "La cita no existe en tu entorno.",
      ),
    );
  }

  return appointment;
}

async function resolveAppointmentReferences(params: {
  patientId: string;
  treatmentId?: string;
  isDemo: boolean;
  redirectPath: string;
}) {
  const locale = await getCurrentLocale();
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
    redirect(
      appendSearchMessage(
        params.redirectPath,
        "error",
        locale === "en" ? "The patient does not exist in your environment." : "El paciente no existe en tu entorno.",
      ),
    );
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
      redirect(
        appendSearchMessage(
          params.redirectPath,
          "error",
          locale === "en" ? "The treatment does not exist in your environment." : "El tratamiento no existe en tu entorno.",
        ),
      );
    }

    if (treatment.patientId !== patient.id) {
      redirect(
        appendSearchMessage(
          params.redirectPath,
          "error",
          locale === "en"
            ? "The treatment does not belong to the selected patient."
            : "El tratamiento no pertenece al paciente seleccionado.",
        ),
      );
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
  const locale = await getCurrentLocale();
  const user = await requireBaseRole(["ADMIN", "DENTIST", "ASSISTANT", "RECEPTIONIST"]);
  const copy = locale === "en"
    ? {
        createFailed: "The appointment could not be created.",
        patientMissing: "The patient does not exist in your environment.",
        treatmentMissing: "The treatment does not exist in your environment.",
        treatmentPatientMismatch: "The treatment does not belong to the selected patient.",
        created: "Appointment created successfully.",
      }
    : {
        createFailed: "No se pudo crear la cita.",
        patientMissing: "El paciente no existe en tu entorno.",
        treatmentMissing: "El tratamiento no existe en tu entorno.",
        treatmentPatientMismatch: "El tratamiento no pertenece al paciente seleccionado.",
        created: "Cita registrada correctamente.",
      };

  const parsed = createAppointmentCreateSchema(locale).safeParse({
    patientId: formData.get("patientId"),
    treatmentId: formData.get("treatmentId"),
    scheduledAt: formData.get("scheduledAt"),
    reason: formData.get("reason"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    redirect(`/appointments/new${buildErrorSearch(parsed.error.issues[0]?.message ?? copy.createFailed)}`);
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
  redirect(`/appointments${buildSuccessSearch(copy.created)}`);
}

export async function updateAppointmentAction(formData: FormData) {
  const locale = await getCurrentLocale();
  const user = await requireBaseRole(["ADMIN", "DENTIST", "ASSISTANT", "RECEPTIONIST"]);
  const copy = locale === "en"
    ? {
        updateFailed: "The appointment could not be updated.",
        updated: "Appointment updated successfully.",
      }
    : {
        updateFailed: "No se pudo actualizar la cita.",
        updated: "Cita actualizada correctamente.",
      };

  const parsed = createAppointmentUpdateSchema(locale).safeParse({
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
        parsed.error.issues[0]?.message ?? copy.updateFailed,
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

  redirect(appendSearchMessage(parsed.data.redirectPath, "success", copy.updated));
}

export async function updateAppointmentStatusAction(formData: FormData) {
  const locale = await getCurrentLocale();
  const user = await requireBaseRole(["ADMIN", "DENTIST", "ASSISTANT", "RECEPTIONIST"]);
  const copy = locale === "en"
    ? {
        updateFailed: "The appointment status could not be updated.",
        onlyScheduled: "Only appointments with Scheduled status can be rescheduled.",
        invalidRescheduleDate: "The new reschedule date is invalid.",
        distinctRescheduleDate: "Select a different date to register the reschedule.",
        rescheduled: "Appointment rescheduled successfully.",
        updated: "Appointment status updated.",
      }
    : {
        updateFailed: "No se pudo actualizar el estado de la cita.",
        onlyScheduled: "Solo puedes reprogramar citas con estado Agendada.",
        invalidRescheduleDate: "La nueva fecha de reprogramacion no es valida.",
        distinctRescheduleDate: "Selecciona una fecha distinta para registrar la reprogramacion.",
        rescheduled: "Cita reprogramada correctamente.",
        updated: "Estado de cita actualizado.",
      };

  const parsed = createAppointmentStatusUpdateSchema(locale).safeParse({
    appointmentId: formData.get("appointmentId"),
    status: formData.get("status"),
    redirectPath: formData.get("redirectPath"),
    rescheduledAt: formData.get("rescheduledAt"),
  });

  if (!parsed.success) {
    redirect(`/appointments${buildErrorSearch(copy.updateFailed)}`);
  }

  const existingAppointment = await getAppointmentOrRedirect(parsed.data.appointmentId, user.isDemo, parsed.data.redirectPath);

  if (parsed.data.status === AppointmentStatus.RESCHEDULED) {
    if (existingAppointment.status !== AppointmentStatus.SCHEDULED) {
      redirect(appendSearchMessage(parsed.data.redirectPath, "error", copy.onlyScheduled));
    }

    const newScheduledAt = new Date(parsed.data.rescheduledAt ?? "");

    if (Number.isNaN(newScheduledAt.getTime())) {
      redirect(appendSearchMessage(parsed.data.redirectPath, "error", copy.invalidRescheduleDate));
    }

    if (newScheduledAt.getTime() === existingAppointment.scheduledAt.getTime()) {
      redirect(
        appendSearchMessage(
          parsed.data.redirectPath,
          "error",
          copy.distinctRescheduleDate,
        ),
      );
    }

    const rescheduledAppointment = await prisma.appointment.update({
      where: { id: existingAppointment.id },
      data: {
        status: AppointmentStatus.RESCHEDULED,
        scheduledAt: newScheduledAt,
      },
      select: {
        id: true,
        patientId: true,
        treatmentId: true,
      },
    });

    await recordAudit({
      actorId: user.id,
      entityType: "appointment",
      entityId: rescheduledAppointment.id,
      action: "APPOINTMENT_STATUS_UPDATED",
      description: `Cita reprogramada para ${parsed.data.rescheduledAt}.`,
    });

    revalidateAppointmentPaths(rescheduledAppointment.patientId, rescheduledAppointment.treatmentId);

    redirect(appendSearchMessage(parsed.data.redirectPath, "success", copy.rescheduled));
  }

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

  redirect(appendSearchMessage(parsed.data.redirectPath, "success", copy.updated));
}

export async function markTodayAppointmentsAsAttendedAction(formData: FormData) {
  const locale = await getCurrentLocale();
  const user = await requireBaseRole(["ADMIN", "DENTIST", "ASSISTANT", "RECEPTIONIST"]);
  const copy = locale === "en"
    ? {
        bulkFailed: "Today's appointments could not be updated.",
        invalidDate: "The submitted date is invalid.",
        noPending: "There were no pending appointments today to mark.",
        result: (count: number) => `${count} appointment${count === 1 ? "" : "s"} from today marked as attended.`,
      }
    : {
        bulkFailed: "No se pudo actualizar las citas de hoy.",
        invalidDate: "La fecha enviada no es valida.",
        noPending: "No habia citas de hoy pendientes por marcar.",
        result: (count: number) => `${count} cita${count === 1 ? "" : "s"} de hoy marcada${count === 1 ? "" : "s"} como asistio.`,
      };

  const parsed = createAppointmentBulkStatusSchema(locale).safeParse({
    date: formData.get("date"),
    redirectPath: formData.get("redirectPath"),
  });

  if (!parsed.success) {
    redirect(`/appointments${buildErrorSearch(copy.bulkFailed)}`);
  }

  const normalizedDate = new Date(`${parsed.data.date}T00:00:00`);

  if (Number.isNaN(normalizedDate.getTime())) {
    redirect(appendSearchMessage(parsed.data.redirectPath, "error", copy.invalidDate));
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
    redirect(appendSearchMessage(parsed.data.redirectPath, "success", copy.noPending));
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
      copy.result(appointmentsToUpdate.length),
    ),
  );
}

export async function markTodayAppointmentsAsNoShowAction(formData: FormData) {
  const locale = await getCurrentLocale();
  const user = await requireBaseRole(["ADMIN", "DENTIST", "ASSISTANT", "RECEPTIONIST"]);
  const copy = locale === "en"
    ? {
        bulkFailed: "Today's appointments could not be updated.",
        invalidDate: "The submitted date is invalid.",
        noPending: "There were no pending appointments today to mark as no-show.",
        result: (count: number) => `${count} appointment${count === 1 ? "" : "s"} from today marked as no-show.`,
      }
    : {
        bulkFailed: "No se pudo actualizar las citas de hoy.",
        invalidDate: "La fecha enviada no es valida.",
        noPending: "No habia citas de hoy pendientes por marcar como no asistio.",
        result: (count: number) => `${count} cita${count === 1 ? "" : "s"} de hoy marcada${count === 1 ? "" : "s"} como no asistio.`,
      };

  const parsed = createAppointmentBulkStatusSchema(locale).safeParse({
    date: formData.get("date"),
    redirectPath: formData.get("redirectPath"),
  });

  if (!parsed.success) {
    redirect(`/appointments${buildErrorSearch(copy.bulkFailed)}`);
  }

  const normalizedDate = new Date(`${parsed.data.date}T00:00:00`);

  if (Number.isNaN(normalizedDate.getTime())) {
    redirect(appendSearchMessage(parsed.data.redirectPath, "error", copy.invalidDate));
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
    redirect(appendSearchMessage(parsed.data.redirectPath, "success", copy.noPending));
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
      copy.result(appointmentsToUpdate.length),
    ),
  );
}
