import { UserRole } from "@prisma/client";
import { getMessages } from "@/lib/i18n/messages";
import type { Locale } from "@/lib/i18n/config";

export type BaseUserRole = "ADMIN" | "DENTIST" | "ASSISTANT" | "RECEPTIONIST";

type RoleMetadata = {
  label: string;
  description: string;
  isDemo: boolean;
  baseRole: BaseUserRole;
};

const ROLE_METADATA: Record<UserRole, RoleMetadata> = {
  [UserRole.ADMIN]: {
    label: "Administrador",
    description: "Gestion total del entorno real.",
    isDemo: false,
    baseRole: "ADMIN",
  },
  [UserRole.DENTIST]: {
    label: "Dentista",
    description: "Gestion clinica de tratamientos y citas en el entorno real.",
    isDemo: false,
    baseRole: "DENTIST",
  },
  [UserRole.ASSISTANT]: {
    label: "Asistente",
    description: "Soporte operativo de pacientes, tratamientos y citas en el entorno real.",
    isDemo: false,
    baseRole: "ASSISTANT",
  },
  [UserRole.RECEPTIONIST]: {
    label: "Recepcionista",
    description: "Gestion operativa de pacientes y agenda en el entorno real.",
    isDemo: false,
    baseRole: "RECEPTIONIST",
  },
  [UserRole.DEMO_ADMIN]: {
    label: "Demo administrador",
    description: "Gestion total del entorno demo.",
    isDemo: true,
    baseRole: "ADMIN",
  },
  [UserRole.DEMO_DENTIST]: {
    label: "Demo dentista",
    description: "Gestion clinica de tratamientos y citas en el entorno demo.",
    isDemo: true,
    baseRole: "DENTIST",
  },
  [UserRole.DEMO_ASSISTANT]: {
    label: "Demo asistente",
    description: "Soporte operativo de pacientes, tratamientos y citas en el entorno demo.",
    isDemo: true,
    baseRole: "ASSISTANT",
  },
  [UserRole.DEMO_RECEPTIONIST]: {
    label: "Demo recepcionista",
    description: "Gestion operativa de pacientes y agenda en el entorno demo.",
    isDemo: true,
    baseRole: "RECEPTIONIST",
  },
};

const BASE_ROLE_ORDER: Record<BaseUserRole, number> = {
  ADMIN: 0,
  DENTIST: 1,
  ASSISTANT: 2,
  RECEPTIONIST: 3,
};

export function getAllUserRoles() {
  return Object.values(UserRole) as UserRole[];
}

export function getRoleMetadata(role: UserRole) {
  return ROLE_METADATA[role];
}

export function getRoleLabel(role: UserRole, locale: Locale = "es") {
  return getMessages(locale).roles[role].label;
}

export function getRoleDescription(role: UserRole, locale: Locale = "es") {
  return getMessages(locale).roles[role].description;
}

export function getBaseRole(role: UserRole) {
  return getRoleMetadata(role).baseRole;
}

export function isDemoRole(role: UserRole) {
  return getRoleMetadata(role).isDemo;
}

export function getEnvironmentLabel(isDemo: boolean, locale: Locale = "es") {
  const copy = getMessages(locale);
  return isDemo ? copy.environment.demo : copy.environment.real;
}

export function canManageUsers(role: UserRole) {
  return getBaseRole(role) === "ADMIN";
}

export function getConcreteRolesForBaseRoles(baseRoles: BaseUserRole[]) {
  return getAllUserRoles().filter((role) => baseRoles.includes(getBaseRole(role)));
}

export function getAssignableRolesForScope(isDemo: boolean) {
  return getAllUserRoles().filter((role) => isDemoRole(role) === isDemo);
}

export function isRoleAllowedForScope(role: UserRole, isDemo: boolean) {
  return isDemoRole(role) === isDemo;
}

export function getRoleSortOrder(role: UserRole) {
  return BASE_ROLE_ORDER[getBaseRole(role)];
}

export function hasBaseRole(role: UserRole, allowedRoles: BaseUserRole[]) {
  return allowedRoles.includes(getBaseRole(role));
}

export function canManagePatients(role: UserRole) {
  return hasBaseRole(role, ["ADMIN", "ASSISTANT", "RECEPTIONIST"]);
}

export function canCreateTreatments(role: UserRole) {
  return hasBaseRole(role, ["ADMIN", "DENTIST", "ASSISTANT", "RECEPTIONIST"]);
}

export function canUpdateTreatmentPhases(role: UserRole) {
  return hasBaseRole(role, ["ADMIN", "DENTIST", "ASSISTANT"]);
}
