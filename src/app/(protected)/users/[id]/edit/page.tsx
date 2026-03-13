import Link from "next/link";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Alert } from "@/components/ui/alert";
import { buttonStyles } from "@/components/ui/button";
import { ConfirmActionForm } from "@/components/ui/confirm-action-form";
import { Card } from "@/components/ui/card";
import { Field, inputClassName, selectClassName } from "@/components/ui/field";
import { requireBaseRole } from "@/lib/auth";
import { getCurrentLocale } from "@/lib/i18n/server";
import { toSearchParam } from "@/lib/utils";
import { updateUserAction } from "@/modules/users/actions";
import { getManagedRoleOptions, getManagedUserDetail } from "@/modules/users/queries";

export default async function EditUserPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [actor, locale] = await Promise.all([requireBaseRole(["ADMIN"]), getCurrentLocale()]);
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const user = await getManagedUserDetail(id, actor.isDemo, locale);

  if (!user) {
    notFound();
  }

  const roles = await getManagedRoleOptions(user.isDemo, locale);

  const error = toSearchParam(query.error);
  const copy = locale === "en"
    ? {
        title: (name: string) => `Edit ${name}`,
        demoDescription: "Update user data without leaving the demo environment.",
        description: "Update user data inside your administrative scope without changing the environment.",
        back: "Back to details",
        saveChanges: "Save changes",
        saving: "Saving...",
        confirmTitle: "Confirm user update",
        confirmDescription: (name: string) => `Access and profile data for ${name} will be updated.`,
        confirmButton: "Yes, update",
        fullName: "Full name",
        email: "Email",
        role: "Role",
        password: "New password",
        passwordHint: "Leave empty to keep the current one.",
      }
    : {
        title: (name: string) => `Editar ${name}`,
        demoDescription: "Actualiza los datos del usuario sin salir del entorno demo.",
        description: "Actualiza los datos del usuario dentro de tu alcance administrativo sin cambiar su entorno.",
        back: "Volver al detalle",
        saveChanges: "Guardar cambios",
        saving: "Guardando...",
        confirmTitle: "Confirmar actualizacion del usuario",
        confirmDescription: (name: string) => `Se actualizaran los datos de acceso y perfil de ${name}.`,
        confirmButton: "Si, actualizar",
        fullName: "Nombre completo",
        email: "Email",
        role: "Rol",
        password: "Nueva contrasena",
        passwordHint: "Deja el campo vacio para conservar la actual.",
      };

  return (
    <main className="space-y-6 py-4 lg:py-8">
      <Topbar
        title={copy.title(user.name)}
        description={
          actor.isDemo
            ? copy.demoDescription
            : copy.description
        }
        locale={locale}
        action={
          <Link href={`/users/${user.id}`} className={buttonStyles({ variant: "secondary" })}>
            {copy.back}
          </Link>
        }
      />

      <Card>
        <ConfirmActionForm
          action={updateUserAction}
          className="space-y-5"
          hiddenFields={[{ name: "userId", value: user.id }]}
          submitLabel={copy.saveChanges}
          pendingLabel={copy.saving}
          confirmTitle={copy.confirmTitle}
          confirmDescription={copy.confirmDescription(user.name)}
          confirmButtonLabel={copy.confirmButton}
        >
          {error ? <Alert message={error} tone="danger" /> : null}

          <div className="grid gap-5 md:grid-cols-2">
            <Field label={copy.fullName}>
              <input className={inputClassName} name="name" defaultValue={user.name} required />
            </Field>

            <Field label={copy.email}>
              <input className={inputClassName} type="email" name="email" defaultValue={user.email} required />
            </Field>

            <Field label={copy.role}>
              <select className={selectClassName} name="role" defaultValue={user.role} required>
                {roles.map((role) => (
                  <option key={role.code} value={role.code}>
                    {role.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={copy.password} hint={copy.passwordHint}>
              <input className={inputClassName} type="password" name="password" />
            </Field>
          </div>
        </ConfirmActionForm>
      </Card>
    </main>
  );
}
