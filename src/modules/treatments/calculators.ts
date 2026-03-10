import { PhaseStatus, type Prisma, TreatmentStatus } from "@prisma/client";
import { differenceInCalendarDays } from "date-fns";

type TreatmentForMetrics = {
  startDate: Date;
  estimatedEndDate: Date;
  status: TreatmentStatus;
  phases: Array<{
    weight: number;
    status: PhaseStatus;
  }>;
};

export const treatmentDetailInclude = {
  patient: true,
  dentist: {
    select: {
      id: true,
      name: true,
      role: true,
    },
  },
  phases: {
    orderBy: {
      phaseOrder: "asc",
    },
  },
  appointments: {
    orderBy: {
      scheduledAt: "desc",
    },
  },
} satisfies Prisma.TreatmentInclude;

export function calculateTreatmentMetrics(treatment: TreatmentForMetrics) {
  const today = new Date();
  const daysElapsed = Math.max(0, differenceInCalendarDays(today, treatment.startDate));
  const daysRemaining = differenceInCalendarDays(treatment.estimatedEndDate, today);

  const totalWeight = treatment.phases.reduce((sum, phase) => sum + phase.weight, 0);
  const completedWeight = treatment.phases.reduce((sum, phase) => {
    return phase.status === PhaseStatus.COMPLETED ? sum + phase.weight : sum;
  }, 0);

  const progressPercent = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
  const attendedCount = treatmentStatusAppointmentCount(treatment, "ATTENDED");
  const noShowCount = treatmentStatusAppointmentCount(treatment, "NO_SHOW");
  const rescheduledCount = treatmentStatusAppointmentCount(treatment, "RESCHEDULED");
  const canceledCount = treatmentStatusAppointmentCount(treatment, "CANCELED");

  return {
    daysElapsed,
    daysRemaining,
    progressPercent,
    attendedCount,
    noShowCount,
    rescheduledCount,
    canceledCount,
  };
}

function treatmentStatusAppointmentCount(
  treatment: TreatmentForMetrics & {
    appointments?: Array<{ status: string }>;
  },
  status: string,
) {
  return treatment.appointments?.filter((appointment) => appointment.status === status).length ?? 0;
}
