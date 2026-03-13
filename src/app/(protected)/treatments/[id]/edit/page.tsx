import Link from "next/link";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Alert } from "@/components/ui/alert";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, inputClassName, selectClassName, textareaClassName } from "@/components/ui/field";
import { requireBaseRole } from "@/lib/auth";
import { toSearchParam } from "@/lib/utils";
import { updateTreatmentAction } from "@/modules/treatments/actions";
import { getTreatmentFormDetail, getTreatmentFormOptions } from "@/modules/treatments/queries";

export default async function EditTreatmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireBaseRole(["ADMIN", "DENTIST", "ASSISTANT", "RECEPTIONIST"]);
  const [{ id }, query, options] = await Promise.all([params, searchParams, getTreatmentFormOptions(user.isDemo)]);
  const treatment = await getTreatmentFormDetail(id, user.isDemo);

  if (!treatment) {
    notFound();
  }

  const error = toSearchParam(query.error);

  return (
    <main className="space-y-6 py-4 lg:py-8">
      <Topbar
        title="Editar tratamiento"
        description="Actualiza los datos operativos del tratamiento sin alterar el historial de fases ni citas."
      />

      <Card>
        <form action={updateTreatmentAction} className="space-y-6">
          <input type="hidden" name="treatmentId" value={treatment.id} />
          {error ? <Alert message={error} tone="danger" /> : null}

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Paciente" hint="No editable para mantener consistencia con las citas asociadas.">
              <div className={inputClassName}>
                {treatment.patient.lastName}, {treatment.patient.firstName}
              </div>
            </Field>
            <Field label="Responsable">
              <select className={selectClassName} name="dentistId" defaultValue={treatment.dentistId ?? ""}>
                <option value="">Sin asignar</option>
                {options.dentists.map((dentist) => (
                  <option key={dentist.id} value={dentist.id}>
                    {dentist.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Nombre del tratamiento">
              <input
                className={inputClassName}
                name="title"
                defaultValue={treatment.title}
                placeholder="Ejemplo: Ortodoncia integral"
                required
              />
            </Field>
            <Field label="Fecha de inicio">
              <input
                className={inputClassName}
                type="date"
                name="startDate"
                defaultValue={format(treatment.startDate, "yyyy-MM-dd")}
                required
              />
            </Field>
            <Field label="Fecha estimada de fin">
              <input
                className={inputClassName}
                type="date"
                name="estimatedEndDate"
                defaultValue={format(treatment.estimatedEndDate, "yyyy-MM-dd")}
                required
              />
            </Field>
            <div />
          </div>

          <Field label="Diagnostico" hint="Opcional.">
            <textarea
              className={textareaClassName}
              name="diagnosis"
              defaultValue={treatment.diagnosis}
              placeholder="Diagnostico clinico resumido"
            />
          </Field>

          <Field label="Notas operativas" hint="Opcional.">
            <textarea
              className={textareaClassName}
              name="notes"
              defaultValue={treatment.notes ?? ""}
              placeholder="Frecuencia de control, recomendaciones o restricciones"
            />
          </Field>

          <div className="flex flex-wrap gap-3">
            <button type="submit" className={buttonStyles({})}>
              Guardar cambios
            </button>
            <Link href={`/treatments/${treatment.id}`} className={buttonStyles({ variant: "secondary" })}>
              Cancelar
            </Link>
          </div>
        </form>
      </Card>
    </main>
  );
}
