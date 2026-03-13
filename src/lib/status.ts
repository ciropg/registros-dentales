import {
  AppointmentStatus,
  PhaseStatus,
  TreatmentStatus,
} from "@prisma/client";
import { getMessages } from "@/lib/i18n/messages";
import type { Locale } from "@/lib/i18n/config";

export function treatmentStatusLabel(status: TreatmentStatus, locale: Locale = "es") {
  return getMessages(locale).status.treatment[status];
}

export function phaseStatusLabel(status: PhaseStatus, locale: Locale = "es") {
  return getMessages(locale).status.phase[status];
}

export function appointmentStatusLabel(status: AppointmentStatus, locale: Locale = "es") {
  return getMessages(locale).status.appointment[status];
}

export function treatmentStatusTone(status: TreatmentStatus) {
  switch (status) {
    case TreatmentStatus.IN_PROGRESS:
      return "brand" as const;
    case TreatmentStatus.COMPLETED:
      return "success" as const;
    case TreatmentStatus.PAUSED:
      return "warning" as const;
    case TreatmentStatus.CANCELED:
      return "danger" as const;
    case TreatmentStatus.PLANNED:
    default:
      return "neutral" as const;
  }
}

export function phaseStatusTone(status: PhaseStatus) {
  switch (status) {
    case PhaseStatus.IN_PROGRESS:
      return "brand" as const;
    case PhaseStatus.COMPLETED:
      return "success" as const;
    case PhaseStatus.SKIPPED:
      return "warning" as const;
    case PhaseStatus.PENDING:
    default:
      return "neutral" as const;
  }
}

export function appointmentStatusTone(status: AppointmentStatus) {
  switch (status) {
    case AppointmentStatus.ATTENDED:
      return "success" as const;
    case AppointmentStatus.NO_SHOW:
      return "danger" as const;
    case AppointmentStatus.RESCHEDULED:
      return "warning" as const;
    case AppointmentStatus.CANCELED:
      return "neutral" as const;
    case AppointmentStatus.SCHEDULED:
    default:
      return "brand" as const;
  }
}
