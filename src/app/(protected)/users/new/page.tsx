import { Topbar } from "@/components/layout/topbar";
import { Alert } from "@/components/ui/alert";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, inputClassName, selectClassName } from "@/components/ui/field";
import { requireBaseRole } from "@/lib/auth";
import { getCurrentLocale } from "@/lib/i18n/server";
import { toSearchParam } from "@/lib/utils";
import { createUserAction } from "@/modules/users/actions";
import { getManagedRoleOptions } from "@/modules/users/queries";

export default async function NewUserPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [actor, locale] = await Promise.all([requireBaseRole(["ADMIN"]), getCurrentLocale()]);
  const [params, roles] = await Promise.all([searchParams, getManagedRoleOptions(actor.isDemo, locale)]);
  const error = toSearchParam(params.error);
  const copy = locale === "en"
    ? {
        demoTitle: "New demo user",
        title: "New user",
        demoDescription: "Create a demo account and assign only demo roles inside this environment.",
        description: "Create a live or demo account. The environment is defined by the selected role.",
        demoNotice: "This account will be created in the demo environment and can only use demo roles.",
        notice:
          "As a live administrator you can create live or demo accounts. The selected role defines the final environment.",
        fullName: "Full name",
        email: "Email",
        role: "Role",
        selectRole: "Select a role",
        password: "Password",
        passwordHint: "Minimum 8 characters.",
        saveUser: "Save user",
      }
    : {
        demoTitle: "Nuevo usuario demo",
        title: "Nuevo usuario",
        demoDescription: "Crea una cuenta demo y asigna solo roles demo dentro de este entorno.",
        description: "Crea una cuenta real o demo. El entorno se define por el rol seleccionado.",
        demoNotice: "Esta cuenta quedara creada en el entorno demo y solo puede usar roles demo.",
        notice:
          "Como administrador real puedes crear cuentas reales o demo. El rol elegido define el entorno final.",
        fullName: "Nombre completo",
        email: "Email",
        role: "Rol",
        selectRole: "Selecciona un rol",
        password: "Contrasena",
        passwordHint: "Minimo 8 caracteres.",
        saveUser: "Guardar usuario",
      };
  const title = actor.isDemo ? copy.demoTitle : copy.title;
  const description = actor.isDemo ? copy.demoDescription : copy.description;

  return (
    <main className="space-y-6 py-4 lg:py-8">
      <Topbar title={title} description={description} locale={locale} />

      <Card>
        <form action={createUserAction} className="space-y-5">
          {error ? <Alert message={error} tone="danger" /> : null}

          <div className="rounded-3xl border border-brand/15 bg-brand/5 p-4 text-sm text-foreground">
            {actor.isDemo
              ? copy.demoNotice
              : copy.notice}
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label={copy.fullName}>
              <input className={inputClassName} name="name" required />
            </Field>

            <Field label={copy.email}>
              <input className={inputClassName} type="email" name="email" required />
            </Field>

            <Field label={copy.role}>
              <select className={selectClassName} name="role" required defaultValue="">
                <option value="" disabled>
                  {copy.selectRole}
                </option>
                {roles.map((role) => (
                  <option key={role.code} value={role.code}>
                    {role.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={copy.password} hint={copy.passwordHint}>
              <input className={inputClassName} type="password" name="password" required />
            </Field>
          </div>

          <button type="submit" className={buttonStyles({})}>
            {copy.saveUser}
          </button>
        </form>
      </Card>
    </main>
  );
}
