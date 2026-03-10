import { AppointmentStatus, TreatmentStatus } from "@prisma/client";
import { addDays, endOfDay, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import {
  appointmentStatusLabel,
  appointmentStatusTone,
  treatmentStatusLabel,
  treatmentStatusTone,
} from "@/lib/status";
import { calculateTreatmentMetrics } from "@/modules/treatments/calculators";

export async function getDashboardData() {
  const today = new Date();
  const startToday = startOfDay(today);
  const endToday = endOfDay(today);
  const upcomingWindow = addDays(today, 7);

  const [activeTreatments, appointmentCounts, todayAppointments, upcomingTreatments] =
    await Promise.all([
      prisma.treatment.findMany({
        where: {
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
          phases: true,
          appointments: true,
        },
        orderBy: {
          estimatedEndDate: "asc",
        },
        take: 6,
      }),
      prisma.appointment.groupBy({
        by: ["status"],
        _count: {
          _all: true,
        },
      }),
      prisma.appointment.findMany({
        where: {
          scheduledAt: {
            gte: startToday,
            lte: endToday,
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
          scheduledAt: "asc",
        },
      }),
      prisma.treatment.findMany({
        where: {
          estimatedEndDate: {
            gte: startToday,
            lte: upcomingWindow,
          },
          status: {
            notIn: [TreatmentStatus.COMPLETED, TreatmentStatus.CANCELED],
          },
        },
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          phases: true,
          appointments: true,
        },
        orderBy: {
          estimatedEndDate: "asc",
        },
      }),
    ]);

  const appointmentMap = new Map(appointmentCounts.map((item) => [item.status, item._count._all]));

  return {
    stats: {
      activeTreatments: activeTreatments.length,
      todayAppointments: todayAppointments.length,
      attendedAppointments: appointmentMap.get(AppointmentStatus.ATTENDED) ?? 0,
      noShowAppointments: appointmentMap.get(AppointmentStatus.NO_SHOW) ?? 0,
      rescheduledAppointments: appointmentMap.get(AppointmentStatus.RESCHEDULED) ?? 0,
      canceledAppointments: appointmentMap.get(AppointmentStatus.CANCELED) ?? 0,
    },
    activeTreatments: activeTreatments.map((treatment) => {
      const metrics = calculateTreatmentMetrics(treatment);

      return {
        id: treatment.id,
        title: treatment.title,
        patientName: `${treatment.patient.firstName} ${treatment.patient.lastName}`,
        progressPercent: metrics.progressPercent,
        daysElapsed: metrics.daysElapsed,
        daysRemaining: metrics.daysRemaining,
        statusLabel: treatmentStatusLabel(treatment.status),
        statusTone: treatmentStatusTone(treatment.status),
      };
    }),
    todayAppointments: todayAppointments.map((appointment) => ({
      id: appointment.id,
      patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
      reason: appointment.reason,
      statusLabel: appointmentStatusLabel(appointment.status),
      statusTone: appointmentStatusTone(appointment.status),
      scheduledAt: appointment.scheduledAt,
    })),
    dueSoonTreatments: upcomingTreatments.map((treatment) => ({
      id: treatment.id,
      title: treatment.title,
      patientName: `${treatment.patient.firstName} ${treatment.patient.lastName}`,
      ...calculateTreatmentMetrics(treatment),
      statusLabel: treatmentStatusLabel(treatment.status),
      statusTone: treatmentStatusTone(treatment.status),
    })),
  };
}
