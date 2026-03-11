import { AppointmentStatus, TreatmentStatus } from "@prisma/client";
import { endOfDay, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";

function getDateRange(date: string | undefined) {
  if (!date) {
    return undefined;
  }

  const normalizedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(normalizedDate.getTime())) {
    return undefined;
  }

  return {
    gte: startOfDay(normalizedDate),
    lte: endOfDay(normalizedDate),
  };
}

function compareAppointmentsByProximity(
  left: { scheduledAt: Date },
  right: { scheduledAt: Date },
  referenceTime: number,
) {
  const leftTime = left.scheduledAt.getTime();
  const rightTime = right.scheduledAt.getTime();
  const leftDistance = Math.abs(leftTime - referenceTime);
  const rightDistance = Math.abs(rightTime - referenceTime);

  if (leftDistance !== rightDistance) {
    return leftDistance - rightDistance;
  }

  const leftIsFuture = leftTime >= referenceTime;
  const rightIsFuture = rightTime >= referenceTime;

  if (leftIsFuture !== rightIsFuture) {
    return leftIsFuture ? -1 : 1;
  }

  return leftTime - rightTime;
}

export async function listAppointments(
  isDemo: boolean,
  status?: string,
  date?: string,
  sortByProximity = false,
) {
  const normalizedStatus = Object.values(AppointmentStatus).includes(status as AppointmentStatus)
    ? (status as AppointmentStatus)
    : undefined;
  const scheduledAt = getDateRange(date);

  const appointments = await prisma.appointment.findMany({
    where: {
      isDemo,
      ...(scheduledAt
        ? {
            scheduledAt,
          }
        : {}),
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

  if (!sortByProximity) {
    return appointments;
  }

  const referenceTime = Date.now();

  return [...appointments].sort((left, right) => compareAppointmentsByProximity(left, right, referenceTime));
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
