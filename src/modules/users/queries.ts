import { prisma } from "@/lib/prisma";
import {
  getEnvironmentLabel,
  getRoleLabel,
  getRoleSortOrder,
} from "@/lib/roles";

export async function listManagedUsers(isDemo: boolean) {
  const [users, totalCount, activeCount] = await Promise.all([
    prisma.user.findMany({
      where: { isDemo },
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
      where: { isDemo },
    }),
    prisma.user.count({
      where: { isDemo, active: true },
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
      roleLabel: getRoleLabel(user.role),
      environmentLabel: getEnvironmentLabel(user.isDemo),
    })),
  };
}

export async function getManagedUserDetail(userId: string, isDemo: boolean) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      isDemo,
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
    roleLabel: getRoleLabel(user.role),
    environmentLabel: getEnvironmentLabel(user.isDemo),
  };
}

export async function getManagedRoleOptions(isDemo: boolean) {
  const roles = await prisma.role.findMany({
    where: { isDemo },
    select: {
      code: true,
      name: true,
      description: true,
    },
  });

  return roles.sort((left, right) => getRoleSortOrder(left.code) - getRoleSortOrder(right.code));
}
