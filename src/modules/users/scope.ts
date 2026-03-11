import type { Prisma, UserRole } from "@prisma/client";
import { isDemoRole } from "@/lib/roles";

export function getManagedUserScopeWhere(actorIsDemo: boolean): Prisma.UserWhereInput {
  return actorIsDemo ? { isDemo: true } : {};
}

export function getManagedRoleScopeWhere(actorIsDemo: boolean): Prisma.RoleWhereInput {
  return actorIsDemo ? { isDemo: true } : {};
}

export function canActorAssignRole(actorIsDemo: boolean, role: UserRole) {
  return actorIsDemo ? isDemoRole(role) : true;
}

export function getUserEnvironmentFromRole(role: UserRole) {
  return isDemoRole(role);
}
