import { Topbar } from "@/components/layout/topbar";
import { Alert } from "@/components/ui/alert";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, inputClassName, selectClassName } from "@/components/ui/field";
import { requireBaseRole } from "@/lib/auth";
import { toSearchParam } from "@/lib/utils";
import { createUserAction } from "@/modules/users/actions";
import { getManagedRoleOptions } from "@/modules/users/queries";

export default async function NewUserPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireBaseRole(["ADMIN"]);
  const [params, roles] = await Promise.all([searchParams, getManagedRoleOptions(actor.isDemo)]);
  const error = toSearchParam(params.error);
  const title = actor.isDemo ? "Nuevo usuario demo" : "Nuevo usuario real";
  const description = actor.isDemo
    ? "Crea una cuenta demo y asigna solo roles demo dentro de este entorno."
    : "Crea una cuenta real y asigna solo roles reales dentro de este entorno.";

  return (
    <main className="space-y-6 py-4 lg:py-8">
      <Topbar title={title} description={description} />

      <Card>
        <form action={createUserAction} className="space-y-5">
          {error ? <Alert message={error} tone="danger" /> : null}

          <div className="rounded-3xl border border-brand/15 bg-brand/5 p-4 text-sm text-foreground">
            Esta cuenta quedara creada en el entorno {actor.isDemo ? "demo" : "real"} y no podra
            cruzarse con usuarios del otro entorno.
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Nombre completo">
              <input className={inputClassName} name="name" required />
            </Field>

            <Field label="Email">
              <input className={inputClassName} type="email" name="email" required />
            </Field>

            <Field label="Rol">
              <select className={selectClassName} name="role" required defaultValue="">
                <option value="" disabled>
                  Selecciona un rol
                </option>
                {roles.map((role) => (
                  <option key={role.code} value={role.code}>
                    {role.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Contrasena" hint="Minimo 8 caracteres.">
              <input className={inputClassName} type="password" name="password" required />
            </Field>
          </div>

          <button type="submit" className={buttonStyles({})}>
            Guardar usuario
          </button>
        </form>
      </Card>
    </main>
  );
}
