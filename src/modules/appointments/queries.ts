import { AppointmentStatus, TreatmentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function listAppointments(isDemo: boolean, status?: string) {
  const normalizedStatus = Object.values(AppointmentStatus).includes(status as AppointmentStatus)
    ? (status as AppointmentStatus)
    : undefined;

  return prisma.appointment.findMany({
    where: {
      isDemo,
      ...(normalizedStatus
        ? {
            status: normalizedStatus,
          }
        : {}),
    },
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      treatment: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
  });
}

export async function getAppointmentFormOptions(isDemo: boolean) {
  const [patients, treatments] = await Promise.all([
    prisma.patient.findMany({
      where: {
        isDemo,
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    }),
    prisma.treatment.findMany({
      where: {
        isDemo,
        status: {
          in: [TreatmentStatus.PLANNED, TreatmentStatus.IN_PROGRESS, TreatmentStatus.PAUSED],
        },
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  return {
    patients,
    treatments,
  };
}
