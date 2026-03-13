import type { Locale } from "@/lib/i18n/config";
import { prisma } from "@/lib/prisma";
import {
  getEnvironmentLabel,
  getRoleLabel,
  getRoleDescription,
  getRoleSortOrder,
} from "@/lib/roles";
import { getManagedRoleScopeWhere, getManagedUserScopeWhere } from "@/modules/users/scope";

export async function listManagedUsers(actorIsDemo: boolean, locale: Locale = "es") {
  const scopeWhere = getManagedUserScopeWhere(actorIsDemo);

  const [users, totalCount, activeCount] = await Promise.all([
    prisma.user.findMany({
      where: scopeWhere,
      orderBy: [{ active: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isDemo: true,
        active: true,
        createdAt: true,
      },
    }),
    prisma.user.count({
      where: scopeWhere,
    }),
    prisma.user.count({
      where: {
        ...scopeWhere,
        active: true,
      },
    }),
  ]);

  return {
    stats: {
      totalCount,
      activeCount,
      inactiveCount: totalCount - activeCount,
    },
    users: users.map((user) => ({
      ...user,
      roleLabel: getRoleLabel(user.role, locale),
      environmentLabel: getEnvironmentLabel(user.isDemo, locale),
    })),
  };
}

export async function getManagedUserDetail(userId: string, actorIsDemo: boolean, locale: Locale = "es") {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      ...getManagedUserScopeWhere(actorIsDemo),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isDemo: true,
      active: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          treatments: true,
          auditLogs: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  return {
    ...user,
    roleLabel: getRoleLabel(user.role, locale),
    environmentLabel: getEnvironmentLabel(user.isDemo, locale),
  };
}

export async function getManagedRoleOptions(actorIsDemo: boolean, locale: Locale = "es") {
  const roles = await prisma.role.findMany({
    where: getManagedRoleScopeWhere(actorIsDemo),
    select: {
      code: true,
      isDemo: true,
    },
  });

  return roles.sort((left, right) => {
    const roleOrder = getRoleSortOrder(left.code) - getRoleSortOrder(right.code);

    if (roleOrder !== 0) {
      return roleOrder;
    }

    return Number(left.isDemo) - Number(right.isDemo);
  }).map((role) => ({
    ...role,
    name: getRoleLabel(role.code, locale),
    description: getRoleDescription(role.code, locale),
  }));
}
