import { Topbar } from "@/components/layout/topbar";
import { PhasePlanner } from "@/components/treatments/phase-planner";
import { Alert } from "@/components/ui/alert";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, inputClassName, selectClassName, textareaClassName } from "@/components/ui/field";
import { requireBaseRole } from "@/lib/auth";
import { toSearchParam } from "@/lib/utils";
import { createTreatmentAction } from "@/modules/treatments/actions";
import { getTreatmentFormOptions } from "@/modules/treatments/queries";

export default async function NewTreatmentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireBaseRole(["ADMIN", "DENTIST", "ASSISTANT", "RECEPTIONIST"]);
  const [params, options] = await Promise.all([searchParams, getTreatmentFormOptions(user.isDemo)]);
  const patientId = toSearchParam(params.patientId);
  const error = toSearchParam(params.error);

  return (
    <main className="space-y-6 py-4 lg:py-8">
      <Topbar
        title="Nuevo tratamiento"
        description="Configura el tratamiento, las fechas estimadas y las fases que alimentaran el porcentaje de avance."
      />

      <Card>
        <form action={createTreatmentAction} className="space-y-6">
          {error ? <Alert message={error} tone="danger" /> : null}

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Paciente">
              <select className={selectClassName} name="patientId" defaultValue={patientId ?? ""} required>
                <option value="">Selecciona un paciente</option>
                {options.patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.lastName}, {patient.firstName}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Responsable">
              <select className={selectClassName} name="dentistId" defaultValue="">
                <option value="">Sin asignar</option>
                {options.dentists.map((dentist) => (
                  <option key={dentist.id} value={dentist.id}>
                    {dentist.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Nombre del tratamiento">
              <input className={inputClassName} name="title" placeholder="Ejemplo: Ortodoncia integral" required />
            </Field>
            <Field label="Fecha de inicio">
              <input className={inputClassName} type="date" name="startDate" required />
            </Field>
            <Field label="Fecha estimada de fin">
              <input className={inputClassName} type="date" name="estimatedEndDate" required />
            </Field>
            <div />
          </div>

          <Field label="Diagnostico" hint="Opcional.">
            <textarea
              className={textareaClassName}
              name="diagnosis"
              placeholder="Diagnostico clinico resumido"
            />
          </Field>

          <Field label="Notas operativas" hint="Opcional.">
            <textarea
              className={textareaClassName}
              name="notes"
              placeholder="Frecuencia de control, recomendaciones o restricciones"
            />
          </Field>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Plan de fases</p>
              <p className="mt-1 text-sm text-muted">
                El porcentaje de avance se calcula en funcion de las fases completadas y su peso relativo.
              </p>
            </div>
            <PhasePlanner />
          </div>

          <button type="submit" className={buttonStyles({})}>
            Guardar tratamiento
          </button>
        </form>
      </Card>
    </main>
  );
}
