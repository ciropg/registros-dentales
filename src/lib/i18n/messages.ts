import { UserRole } from "@prisma/client";
import type { Locale } from "@/lib/i18n/config";

const messages = {
  es: {
    metadata: {
      title: "Registros Dentales",
      description: "Seguimiento clinico de pacientes, tratamientos y citas.",
    },
    topbar: {
      eyebrow: "Operacion clinica",
    },
    sidebar: {
      brandEyebrow: "Clinica dental",
      brandTitle: "Registros",
      brandDescription: "Control de tratamientos y citas en un solo flujo.",
      dashboard: "Dashboard",
      patients: "Pacientes",
      appointments: "Citas",
      users: "Usuarios",
      logout: "Cerrar sesion",
    },
    modal: {
      overlayClose: "Cerrar modal",
      badge: "Confirmacion",
      close: "Cerrar",
    },
    confirmAction: {
      confirm: "Confirmar",
      cancel: "Cancelar",
    },
    feedback: {
      close: "Entendido",
      operationCompleted: "Operacion completada",
    },
    pagination: {
      previous: "Anterior",
      next: "Siguiente",
      summary: ({
        start,
        end,
        totalCount,
        itemLabel,
        currentPage,
        totalPages,
      }: {
        start: number;
        end: number;
        totalCount: number;
        itemLabel: string;
        currentPage: number;
        totalPages: number;
      }) => `Mostrando ${start}-${end} de ${totalCount} ${itemLabel}. Pagina ${currentPage} de ${totalPages}.`,
    },
    loading: {
      eyebrow: "Registros dentales",
      title: "Cargando panel clinico...",
    },
    notFound: {
      title: "Vista no disponible",
      description: "La pantalla que buscas no existe o fue movida.",
      back: "Volver al dashboard",
    },
    roles: {
      [UserRole.ADMIN]: {
        label: "Administrador",
        description: "Gestion total del entorno real.",
      },
      [UserRole.DENTIST]: {
        label: "Dentista",
        description: "Gestion clinica de tratamientos y citas en el entorno real.",
      },
      [UserRole.ASSISTANT]: {
        label: "Asistente",
        description: "Soporte operativo de pacientes, tratamientos y citas en el entorno real.",
      },
      [UserRole.RECEPTIONIST]: {
        label: "Recepcionista",
        description: "Gestion operativa de pacientes y agenda en el entorno real.",
      },
      [UserRole.DEMO_ADMIN]: {
        label: "Demo administrador",
        description: "Gestion total del entorno demo.",
      },
      [UserRole.DEMO_DENTIST]: {
        label: "Demo dentista",
        description: "Gestion clinica de tratamientos y citas en el entorno demo.",
      },
      [UserRole.DEMO_ASSISTANT]: {
        label: "Demo asistente",
        description: "Soporte operativo de pacientes, tratamientos y citas en el entorno demo.",
      },
      [UserRole.DEMO_RECEPTIONIST]: {
        label: "Demo recepcionista",
        description: "Gestion operativa de pacientes y agenda en el entorno demo.",
      },
    },
    environment: {
      demo: "Demo",
      real: "Real",
    },
    status: {
      treatment: {
        PLANNED: "Planificado",
        IN_PROGRESS: "En curso",
        PAUSED: "Pausado",
        COMPLETED: "Completado",
        CANCELED: "Cancelado",
      },
      phase: {
        PENDING: "Pendiente",
        IN_PROGRESS: "En curso",
        COMPLETED: "Completada",
        SKIPPED: "Omitida",
      },
      appointment: {
        SCHEDULED: "Agendada",
        ATTENDED: "Asistio",
        NO_SHOW: "No asistio",
        RESCHEDULED: "Reprogramada",
        CANCELED: "Cancelada",
      },
    },
    date: {
      today: "Hoy",
      day: "dia",
      days: "dias",
      dueIn: (value: number, unit: string) => `Faltan ${value} ${unit}`,
      overdueBy: (value: number, unit: string) => `Vencido por ${value} ${unit}`,
    },
  },
  en: {
    metadata: {
      title: "Dental Records",
      description: "Clinical tracking for patients, treatments, and appointments.",
    },
    topbar: {
      eyebrow: "Clinical operations",
    },
    sidebar: {
      brandEyebrow: "Dental clinic",
      brandTitle: "Records",
      brandDescription: "Treatments and appointments managed in a single flow.",
      dashboard: "Dashboard",
      patients: "Patients",
      appointments: "Appointments",
      users: "Users",
      logout: "Log out",
    },
    modal: {
      overlayClose: "Close modal",
      badge: "Confirmation",
      close: "Close",
    },
    confirmAction: {
      confirm: "Confirm",
      cancel: "Cancel",
    },
    feedback: {
      close: "Understood",
      operationCompleted: "Operation completed",
    },
    pagination: {
      previous: "Previous",
      next: "Next",
      summary: ({
        start,
        end,
        totalCount,
        itemLabel,
        currentPage,
        totalPages,
      }: {
        start: number;
        end: number;
        totalCount: number;
        itemLabel: string;
        currentPage: number;
        totalPages: number;
      }) => `Showing ${start}-${end} of ${totalCount} ${itemLabel}. Page ${currentPage} of ${totalPages}.`,
    },
    loading: {
      eyebrow: "Dental records",
      title: "Loading clinical dashboard...",
    },
    notFound: {
      title: "View unavailable",
      description: "The page you are looking for does not exist or was moved.",
      back: "Back to dashboard",
    },
    roles: {
      [UserRole.ADMIN]: {
        label: "Administrator",
        description: "Full management of the live environment.",
      },
      [UserRole.DENTIST]: {
        label: "Dentist",
        description: "Clinical management of treatments and appointments in the live environment.",
      },
      [UserRole.ASSISTANT]: {
        label: "Assistant",
        description: "Operational support for patients, treatments, and appointments in the live environment.",
      },
      [UserRole.RECEPTIONIST]: {
        label: "Receptionist",
        description: "Operational management of patients and scheduling in the live environment.",
      },
      [UserRole.DEMO_ADMIN]: {
        label: "Demo administrator",
        description: "Full management of the demo environment.",
      },
      [UserRole.DEMO_DENTIST]: {
        label: "Demo dentist",
        description: "Clinical management of treatments and appointments in the demo environment.",
      },
      [UserRole.DEMO_ASSISTANT]: {
        label: "Demo assistant",
        description: "Operational support for patients, treatments, and appointments in the demo environment.",
      },
      [UserRole.DEMO_RECEPTIONIST]: {
        label: "Demo receptionist",
        description: "Operational management of patients and scheduling in the demo environment.",
      },
    },
    environment: {
      demo: "Demo",
      real: "Live",
    },
    status: {
      treatment: {
        PLANNED: "Planned",
        IN_PROGRESS: "In progress",
        PAUSED: "Paused",
        COMPLETED: "Completed",
        CANCELED: "Canceled",
      },
      phase: {
        PENDING: "Pending",
        IN_PROGRESS: "In progress",
        COMPLETED: "Completed",
        SKIPPED: "Skipped",
      },
      appointment: {
        SCHEDULED: "Scheduled",
        ATTENDED: "Attended",
        NO_SHOW: "No-show",
        RESCHEDULED: "Rescheduled",
        CANCELED: "Canceled",
      },
    },
    date: {
      today: "Today",
      day: "day",
      days: "days",
      dueIn: (value: number, unit: string) => `${value} ${unit} left`,
      overdueBy: (value: number, unit: string) => `${value} ${unit} overdue`,
    },
  },
};

export function getMessages(locale: Locale) {
  return messages[locale];
}
