import {
  AppointmentStatus,
  PhaseStatus,
  TreatmentStatus,
} from "@prisma/client";

export function treatmentStatusLabel(status: TreatmentStatus) {
  switch (status) {
    case TreatmentStatus.PLANNED:
      return "Planificado";
    case TreatmentStatus.IN_PROGRESS:
      return "En curso";
    case TreatmentStatus.PAUSED:
      return "Pausado";
    case TreatmentStatus.COMPLETED:
      return "Completado";
    case TreatmentStatus.CANCELED:
      return "Cancelado";
  }
}

export function phaseStatusLabel(status: PhaseStatus) {
  switch (status) {
    case PhaseStatus.PENDING:
      return "Pendiente";
    case PhaseStatus.IN_PROGRESS:
      return "En curso";
    case PhaseStatus.COMPLETED:
      return "Completada";
    case PhaseStatus.SKIPPED:
      return "Omitida";
  }
}

export function appointmentStatusLabel(status: AppointmentStatus) {
  switch (status) {
    case AppointmentStatus.SCHEDULED:
      return "Agendada";
    case AppointmentStatus.ATTENDED:
      return "Asistio";
    case AppointmentStatus.NO_SHOW:
      return "No asistio";
    case AppointmentStatus.RESCHEDULED:
      return "Reprogramada";
    case AppointmentStatus.CANCELED:
      return "Cancelada";
  }
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
