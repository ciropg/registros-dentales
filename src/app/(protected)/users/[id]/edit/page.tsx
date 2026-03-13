import Link from "next/link";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Alert } from "@/components/ui/alert";
import { buttonStyles } from "@/components/ui/button";
import { ConfirmActionForm } from "@/components/ui/confirm-action-form";
import { Card } from "@/components/ui/card";
import { Field, inputClassName, selectClassName } from "@/components/ui/field";
import { requireBaseRole } from "@/lib/auth";
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
  const actor = await requireBaseRole(["ADMIN"]);
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const user = await getManagedUserDetail(id, actor.isDemo);

  if (!user) {
    notFound();
  }

  const roles = await getManagedRoleOptions(user.isDemo);

  const error = toSearchParam(query.error);

  return (
    <main className="space-y-6 py-4 lg:py-8">
      <Topbar
        title={`Editar ${user.name}`}
        description={
          actor.isDemo
            ? "Actualiza los datos del usuario sin salir del entorno demo."
            : "Actualiza los datos del usuario dentro de tu alcance administrativo sin cambiar su entorno."
        }
        action={
          <Link href={`/users/${user.id}`} className={buttonStyles({ variant: "secondary" })}>
            Volver al detalle
          </Link>
        }
      />

      <Card>
        <ConfirmActionForm
          action={updateUserAction}
          className="space-y-5"
          hiddenFields={[{ name: "userId", value: user.id }]}
          submitLabel="Guardar cambios"
          pendingLabel="Guardando..."
          confirmTitle="Confirmar actualizacion del usuario"
          confirmDescription={`Se actualizaran los datos de acceso y perfil de ${user.name}.`}
          confirmButtonLabel="Si, actualizar"
        >
          {error ? <Alert message={error} tone="danger" /> : null}

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Nombre completo">
              <input className={inputClassName} name="name" defaultValue={user.name} required />
            </Field>

            <Field label="Email">
              <input className={inputClassName} type="email" name="email" defaultValue={user.email} required />
            </Field>

            <Field label="Rol">
              <select className={selectClassName} name="role" defaultValue={user.role} required>
                {roles.map((role) => (
                  <option key={role.code} value={role.code}>
                    {role.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Nueva contrasena" hint="Deja el campo vacio para conservar la actual.">
              <input className={inputClassName} type="password" name="password" />
            </Field>
          </div>
        </ConfirmActionForm>
      </Card>
    </main>
  );
}
