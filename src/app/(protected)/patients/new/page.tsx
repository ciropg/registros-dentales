import { Topbar } from "@/components/layout/topbar";
import { Alert } from "@/components/ui/alert";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, inputClassName, textareaClassName } from "@/components/ui/field";
import { toSearchParam } from "@/lib/utils";
import { createPatientAction } from "@/modules/patients/actions";

export default async function NewPatientPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = toSearchParam(params.error);

  return (
    <main className="space-y-6 py-4 lg:py-8">
      <Topbar
        title="Nuevo paciente"
        description="Registra la ficha basica del paciente para empezar a vincular citas y tratamientos."
      />

      <Card>
        <form action={createPatientAction} className="space-y-5">
          {error ? <Alert message={error} tone="danger" /> : null}

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Nombres">
              <input className={inputClassName} name="firstName" required />
            </Field>
            <Field label="Apellidos">
              <input className={inputClassName} name="lastName" required />
            </Field>
            <Field label="Documento">
              <input className={inputClassName} name="documentNumber" />
            </Field>
            <Field label="Telefono">
              <input className={inputClassName} name="phone" />
            </Field>
            <Field label="Email">
              <input className={inputClassName} type="email" name="email" />
            </Field>
            <Field label="Fecha de nacimiento">
              <input className={inputClassName} type="date" name="birthDate" />
            </Field>
          </div>

          <Field label="Notas clinicas">
            <textarea
              className={textareaClassName}
              name="notes"
              placeholder="Observaciones iniciales del paciente"
            />
          </Field>

          <button type="submit" className={buttonStyles({})}>
            Guardar paciente
          </button>
        </form>
      </Card>
    </main>
  );
}
