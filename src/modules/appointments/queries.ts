import { AppointmentStatus, TreatmentStatus } from "@prisma/client";
import { endOfDay, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";

const APPOINTMENTS_PAGE_SIZE = 10;

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
  statuses?: AppointmentStatus[],
  date?: string,
  sortByProximity = false,
  page = 1,
) {
  const normalizedStatuses = (statuses ?? []).filter((status) => Object.values(AppointmentStatus).includes(status));
  const scheduledAt = getDateRange(date);
  const where = {
    isDemo,
    ...(scheduledAt
      ? {
          scheduledAt,
        }
      : {}),
    ...(normalizedStatuses.length
      ? {
          status: {
            in: normalizedStatuses,
          },
        }
      : {}),
  };

  if (!sortByProximity) {
    const totalCount = await prisma.appointment.count({ where });
    const totalPages = Math.max(1, Math.ceil(totalCount / APPOINTMENTS_PAGE_SIZE));
    const currentPage = Math.min(Math.max(1, page), totalPages);

    const appointments = await prisma.appointment.findMany({
      where,
      skip: (currentPage - 1) * APPOINTMENTS_PAGE_SIZE,
      take: APPOINTMENTS_PAGE_SIZE,
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

    return {
      items: appointments,
      page: currentPage,
      pageSize: APPOINTMENTS_PAGE_SIZE,
      totalCount,
      totalPages,
    };
  }

  const appointments = await prisma.appointment.findMany({
    where,
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
  const referenceTime = Date.now();
  const sortedAppointments = [...appointments].sort((left, right) =>
    compareAppointmentsByProximity(left, right, referenceTime),
  );
  const totalCount = sortedAppointments.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / APPOINTMENTS_PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const paginatedAppointments = sortedAppointments.slice(
    (currentPage - 1) * APPOINTMENTS_PAGE_SIZE,
    currentPage * APPOINTMENTS_PAGE_SIZE,
  );

  return {
    items: paginatedAppointments,
    page: currentPage,
    pageSize: APPOINTMENTS_PAGE_SIZE,
    totalCount,
    totalPages,
  };
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

export async function getAppointmentFormDetail(appointmentId: string, isDemo: boolean) {
  return prisma.appointment.findFirst({
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
    },
  });
}
