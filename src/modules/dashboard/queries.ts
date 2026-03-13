import { AppointmentStatus, TreatmentStatus } from "@prisma/client";
import { addDays, endOfDay, startOfDay } from "date-fns";
import type { Locale } from "@/lib/i18n/config";
import { prisma } from "@/lib/prisma";
import {
  appointmentStatusLabel,
  appointmentStatusTone,
  treatmentStatusLabel,
  treatmentStatusTone,
} from "@/lib/status";
import { calculateTreatmentMetrics } from "@/modules/treatments/calculators";

export async function getDashboardData(isDemo: boolean, locale: Locale = "es") {
  const today = new Date();
  const startToday = startOfDay(today);
  const endToday = endOfDay(today);
  const upcomingWindow = addDays(today, 7);
  const activeStatuses = [TreatmentStatus.PLANNED, TreatmentStatus.IN_PROGRESS, TreatmentStatus.PAUSED];
  const activeTreatmentsWhere = {
    isDemo,
    status: {
      in: activeStatuses,
    },
  };

  const [activeTreatmentsCount, activeTreatments, todayAppointments, upcomingTreatments] =
    await Promise.all([
      prisma.treatment.count({
        where: activeTreatmentsWhere,
      }),
      prisma.treatment.findMany({
        where: activeTreatmentsWhere,
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
      prisma.appointment.findMany({
        where: {
          isDemo,
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
          isDemo,
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

  const todayAppointmentMap = new Map<AppointmentStatus, number>();

  for (const appointment of todayAppointments) {
    todayAppointmentMap.set(appointment.status, (todayAppointmentMap.get(appointment.status) ?? 0) + 1);
  }

  return {
    stats: {
      activeTreatments: activeTreatmentsCount,
      todayAppointments: todayAppointments.length,
      attendedAppointments: todayAppointmentMap.get(AppointmentStatus.ATTENDED) ?? 0,
      noShowAppointments: todayAppointmentMap.get(AppointmentStatus.NO_SHOW) ?? 0,
      rescheduledAppointments: todayAppointmentMap.get(AppointmentStatus.RESCHEDULED) ?? 0,
      canceledAppointments: todayAppointmentMap.get(AppointmentStatus.CANCELED) ?? 0,
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
        statusLabel: treatmentStatusLabel(treatment.status, locale),
        statusTone: treatmentStatusTone(treatment.status),
      };
    }),
    todayAppointments: todayAppointments.map((appointment) => ({
      id: appointment.id,
      patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
      reason: appointment.reason,
      statusLabel: appointmentStatusLabel(appointment.status, locale),
      statusTone: appointmentStatusTone(appointment.status),
      scheduledAt: appointment.scheduledAt,
    })),
    dueSoonTreatments: upcomingTreatments.map((treatment) => ({
      id: treatment.id,
      title: treatment.title,
      patientName: `${treatment.patient.firstName} ${treatment.patient.lastName}`,
      ...calculateTreatmentMetrics(treatment),
      statusLabel: treatmentStatusLabel(treatment.status, locale),
      statusTone: treatmentStatusTone(treatment.status),
    })),
  };
}
