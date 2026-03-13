"use server";

import { Prisma, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { requireBaseRole } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { getCurrentLocale } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { buildErrorSearch, buildSuccessSearch } from "@/lib/utils";
import {
  createUserCreateSchema,
  createUserToggleActiveSchema,
  createUserUpdateSchema,
} from "@/modules/users/schemas";
import {
  canActorAssignRole,
  getManagedRoleScopeWhere,
  getManagedUserScopeWhere,
  getUserEnvironmentFromRole,
} from "@/modules/users/scope";

function revalidateUserPaths(userId?: string) {
  revalidatePath("/users");
  revalidatePath("/users/new");
  revalidatePath("/treatments/new");

  if (userId) {
    revalidatePath(`/users/${userId}`);
    revalidatePath(`/users/${userId}/edit`);
  }
}

function isDuplicateEmailError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function getManagedUserOrRedirect(userId: string, actorIsDemo: boolean, redirectPath: string) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      ...getManagedUserScopeWhere(actorIsDemo),
    },
    select: {
      id: true,
      name: true,
      active: true,
      isDemo: true,
    },
  });

  if (!user) {
    redirect(`${redirectPath}${buildErrorSearch("No tienes acceso a ese usuario.")}`);
  }

  return user;
}

async function getManagedRoleOrRedirect(role: UserRole, actorIsDemo: boolean, redirectPath: string) {
  const roleRecord = await prisma.role.findFirst({
    where: {
      code: role,
      ...getManagedRoleScopeWhere(actorIsDemo),
    },
    select: {
      id: true,
      code: true,
    },
  });

  if (!roleRecord) {
    redirect(`${redirectPath}${buildErrorSearch("El rol seleccionado ya no existe o no pertenece a tu entorno.")}`);
  }

  return roleRecord;
}

export async function createUserAction(formData: FormData) {
  const locale = await getCurrentLocale();
  const actor = await requireBaseRole(["ADMIN"]);
  const copy = locale === "en"
    ? {
        createFailed: "The user could not be created.",
        duplicateEmail: "The user could not be saved. Verify that the email is not duplicated.",
        demoOnly: "You can only assign demo roles from a demo account.",
        created: "User created successfully.",
      }
    : {
        createFailed: "No se pudo crear el usuario.",
        duplicateEmail: "No se pudo guardar el usuario. Verifica que el email no este duplicado.",
        demoOnly: "Solo puedes asignar roles demo desde una cuenta demo.",
        created: "Usuario creado correctamente.",
      };

  const parsed = createUserCreateSchema(locale).safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(`/users/new${buildErrorSearch(parsed.error.issues[0]?.message ?? copy.createFailed)}`);
  }

  if (!canActorAssignRole(actor.isDemo, parsed.data.role)) {
    redirect(`/users/new${buildErrorSearch(copy.demoOnly)}`);
  }

  const targetIsDemo = getUserEnvironmentFromRole(parsed.data.role);
  const roleRecord = await getManagedRoleOrRedirect(parsed.data.role, actor.isDemo, "/users/new");

  try {
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        roleId: roleRecord.id,
        role: parsed.data.role,
        isDemo: targetIsDemo,
        passwordHash: await bcrypt.hash(parsed.data.password, 10),
      },
    });

    await recordAudit({
      actorId: actor.id,
      entityType: "user",
      entityId: user.id,
      action: "USER_CREATED",
      description: `Se creo el usuario ${user.name}.`,
    });

    revalidateUserPaths(user.id);
    redirect(`/users/${user.id}${buildSuccessSearch(copy.created)}`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    if (isDuplicateEmailError(error)) {
      redirect(`/users/new${buildErrorSearch(copy.duplicateEmail)}`);
    }

    console.error("User create failed", error);
    redirect(`/users/new${buildErrorSearch(copy.createFailed)}`);
  }
}

export async function updateUserAction(formData: FormData) {
  const locale = await getCurrentLocale();
  const actor = await requireBaseRole(["ADMIN"]);
  const userId = String(formData.get("userId") ?? "");
  const copy = locale === "en"
    ? {
        updateFailed: "The user could not be updated.",
        duplicateEmail: "The user could not be saved. Verify that the email is not duplicated.",
        demoOnly: "You can only assign demo roles from a demo account.",
        cannotChangeEnvironment: "An existing user's environment cannot be changed.",
        updated: "User updated successfully.",
      }
    : {
        updateFailed: "No se pudo actualizar el usuario.",
        duplicateEmail: "No se pudo guardar el usuario. Verifica que el email no este duplicado.",
        demoOnly: "Solo puedes asignar roles demo desde una cuenta demo.",
        cannotChangeEnvironment: "No se puede cambiar el entorno de un usuario existente.",
        updated: "Usuario actualizado correctamente.",
      };

  const parsed = createUserUpdateSchema(locale).safeParse({
    userId: userId,
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const redirectPath = userId ? `/users/${userId}/edit` : "/users";
    redirect(`${redirectPath}${buildErrorSearch(parsed.error.issues[0]?.message ?? copy.updateFailed)}`);
  }

  if (!canActorAssignRole(actor.isDemo, parsed.data.role)) {
    redirect(`/users/${parsed.data.userId}/edit${buildErrorSearch(copy.demoOnly)}`);
  }

  const managedUser = await getManagedUserOrRedirect(parsed.data.userId, actor.isDemo, "/users");

  const targetIsDemo = getUserEnvironmentFromRole(parsed.data.role);
  const roleRecord = await getManagedRoleOrRedirect(parsed.data.role, actor.isDemo, `/users/${parsed.data.userId}/edit`);

  if (managedUser.isDemo !== targetIsDemo) {
    redirect(`/users/${parsed.data.userId}/edit${buildErrorSearch(copy.cannotChangeEnvironment)}`);
  }

  try {
    const user = await prisma.user.update({
      where: { id: parsed.data.userId },
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        roleId: roleRecord.id,
        role: parsed.data.role,
        isDemo: targetIsDemo,
        ...(parsed.data.password
          ? {
              passwordHash: await bcrypt.hash(parsed.data.password, 10),
            }
          : {}),
      },
    });

    await recordAudit({
      actorId: actor.id,
      entityType: "user",
      entityId: user.id,
      action: "USER_UPDATED",
      description: `Se actualizo el usuario ${user.name}.`,
    });

    revalidateUserPaths(user.id);
    redirect(`/users/${user.id}${buildSuccessSearch(copy.updated)}`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    if (isDuplicateEmailError(error)) {
      redirect(
        `/users/${parsed.data.userId}/edit${buildErrorSearch(copy.duplicateEmail)}`,
      );
    }

    console.error("User update failed", error);
    redirect(`/users/${parsed.data.userId}/edit${buildErrorSearch(copy.updateFailed)}`);
  }
}

export async function toggleUserActiveAction(formData: FormData) {
  const locale = await getCurrentLocale();
  const actor = await requireBaseRole(["ADMIN"]);
  const copy = locale === "en"
    ? {
        statusFailed: "The user status could not be updated.",
        cannotDeactivateSelf: "You cannot deactivate your own account.",
        reactivated: "User reactivated successfully.",
        deactivated: "User deactivated successfully.",
      }
    : {
        statusFailed: "No se pudo actualizar el estado del usuario.",
        cannotDeactivateSelf: "No puedes desactivar tu propia cuenta.",
        reactivated: "Usuario reactivado correctamente.",
        deactivated: "Usuario desactivado correctamente.",
      };

  const parsed = createUserToggleActiveSchema().safeParse({
    userId: formData.get("userId"),
    redirectPath: formData.get("redirectPath"),
  });

  if (!parsed.success) {
    redirect(`/users${buildErrorSearch(copy.statusFailed)}`);
  }

  const managedUser = await getManagedUserOrRedirect(parsed.data.userId, actor.isDemo, "/users");

  if (managedUser.id === actor.id && managedUser.active) {
    redirect(`${parsed.data.redirectPath}${buildErrorSearch(copy.cannotDeactivateSelf)}`);
  }

  const updatedUser = await prisma.user.update({
    where: { id: managedUser.id },
    data: {
      active: !managedUser.active,
    },
    select: {
      id: true,
      name: true,
      active: true,
    },
  });

  await recordAudit({
    actorId: actor.id,
    entityType: "user",
    entityId: updatedUser.id,
    action: updatedUser.active ? "USER_REACTIVATED" : "USER_DEACTIVATED",
    description: updatedUser.active
      ? `Se reactivo el usuario ${updatedUser.name}.`
      : `Se desactivo el usuario ${updatedUser.name}.`,
  });

  revalidateUserPaths(updatedUser.id);
  redirect(
    `${parsed.data.redirectPath}${buildSuccessSearch(
      updatedUser.active ? copy.reactivated : copy.deactivated,
    )}`,
  );
}
