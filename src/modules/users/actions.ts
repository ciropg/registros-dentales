"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBaseRole } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { isRoleAllowedForScope } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { buildErrorSearch, buildSuccessSearch } from "@/lib/utils";
import {
  userCreateSchema,
  userToggleActiveSchema,
  userUpdateSchema,
} from "@/modules/users/schemas";

function revalidateUserPaths(userId?: string) {
  revalidatePath("/users");
  revalidatePath("/users/new");
  revalidatePath("/treatments/new");

  if (userId) {
    revalidatePath(`/users/${userId}`);
    revalidatePath(`/users/${userId}/edit`);
  }
}

async function getManagedUserOrRedirect(userId: string, isDemo: boolean, redirectPath: string) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      isDemo,
    },
    select: {
      id: true,
      name: true,
      active: true,
    },
  });

  if (!user) {
    redirect(`${redirectPath}${buildErrorSearch("Ese usuario no existe en tu entorno.")}`);
  }

  return user;
}

export async function createUserAction(formData: FormData) {
  const actor = await requireBaseRole(["ADMIN"]);

  const parsed = userCreateSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(`/users/new${buildErrorSearch(parsed.error.issues[0]?.message ?? "No se pudo crear el usuario.")}`);
  }

  if (!isRoleAllowedForScope(parsed.data.role, actor.isDemo)) {
    redirect(`/users/new${buildErrorSearch("Solo puedes asignar roles de tu entorno.")}`);
  }

  try {
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role,
        isDemo: actor.isDemo,
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
    redirect(`/users/${user.id}${buildSuccessSearch("Usuario creado correctamente.")}`);
  } catch {
    redirect(`/users/new${buildErrorSearch("No se pudo guardar el usuario. Verifica que el email no este duplicado.")}`);
  }
}

export async function updateUserAction(formData: FormData) {
  const actor = await requireBaseRole(["ADMIN"]);

  const parsed = userUpdateSchema.safeParse({
    userId: formData.get("userId"),
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(`/users${buildErrorSearch(parsed.error.issues[0]?.message ?? "No se pudo actualizar el usuario.")}`);
  }

  if (!isRoleAllowedForScope(parsed.data.role, actor.isDemo)) {
    redirect(`/users/${parsed.data.userId}/edit${buildErrorSearch("Solo puedes asignar roles de tu entorno.")}`);
  }

  await getManagedUserOrRedirect(parsed.data.userId, actor.isDemo, "/users");

  try {
    const user = await prisma.user.update({
      where: { id: parsed.data.userId },
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role,
        isDemo: actor.isDemo,
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
    redirect(`/users/${user.id}${buildSuccessSearch("Usuario actualizado correctamente.")}`);
  } catch {
    redirect(
      `/users/${parsed.data.userId}/edit${buildErrorSearch("No se pudo guardar el usuario. Verifica que el email no este duplicado.")}`,
    );
  }
}

export async function toggleUserActiveAction(formData: FormData) {
  const actor = await requireBaseRole(["ADMIN"]);

  const parsed = userToggleActiveSchema.safeParse({
    userId: formData.get("userId"),
    redirectPath: formData.get("redirectPath"),
  });

  if (!parsed.success) {
    redirect(`/users${buildErrorSearch("No se pudo actualizar el estado del usuario.")}`);
  }

  const managedUser = await getManagedUserOrRedirect(parsed.data.userId, actor.isDemo, "/users");

  if (managedUser.id === actor.id && managedUser.active) {
    redirect(`${parsed.data.redirectPath}${buildErrorSearch("No puedes desactivar tu propia cuenta.")}`);
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
      updatedUser.active ? "Usuario reactivado correctamente." : "Usuario desactivado correctamente.",
    )}`,
  );
}
