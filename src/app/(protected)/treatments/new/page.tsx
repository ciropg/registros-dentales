import { Topbar } from "@/components/layout/topbar";
import { PhasePlanner } from "@/components/treatments/phase-planner";
import { Alert } from "@/components/ui/alert";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, inputClassName, selectClassName, textareaClassName } from "@/components/ui/field";
import { requireBaseRole } from "@/lib/auth";
import { getCurrentLocale } from "@/lib/i18n/server";
import { toSearchParam } from "@/lib/utils";
import { createTreatmentAction } from "@/modules/treatments/actions";
import { getTreatmentFormOptions } from "@/modules/treatments/queries";

export default async function NewTreatmentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [user, locale] = await Promise.all([
    requireBaseRole(["ADMIN", "DENTIST", "ASSISTANT", "RECEPTIONIST"]),
    getCurrentLocale(),
  ]);
  const [params, options] = await Promise.all([searchParams, getTreatmentFormOptions(user.isDemo)]);
  const patientId = toSearchParam(params.patientId);
  const error = toSearchParam(params.error);
  const copy = locale === "en"
    ? {
        title: "New treatment",
        description: "Configure the treatment, estimated dates, and phases that will drive the progress percentage.",
        patient: "Patient",
        selectPatient: "Select a patient",
        responsible: "Responsible",
        unassigned: "Unassigned",
        treatmentName: "Treatment name",
        treatmentPlaceholder: "Example: Full orthodontics",
        startDate: "Start date",
        estimatedEndDate: "Estimated end date",
        diagnosis: "Diagnosis",
        optional: "Optional.",
        diagnosisPlaceholder: "Short clinical diagnosis",
        notes: "Operational notes",
        notesPlaceholder: "Checkup frequency, recommendations, or restrictions",
        phasePlan: "Phase plan",
        phaseDescription: "Progress percentage is calculated based on completed phases and their relative weight.",
        save: "Save treatment",
      }
    : {
        title: "Nuevo tratamiento",
        description: "Configura el tratamiento, las fechas estimadas y las fases que alimentaran el porcentaje de avance.",
        patient: "Paciente",
        selectPatient: "Selecciona un paciente",
        responsible: "Responsable",
        unassigned: "Sin asignar",
        treatmentName: "Nombre del tratamiento",
        treatmentPlaceholder: "Ejemplo: Ortodoncia integral",
        startDate: "Fecha de inicio",
        estimatedEndDate: "Fecha estimada de fin",
        diagnosis: "Diagnostico",
        optional: "Opcional.",
        diagnosisPlaceholder: "Diagnostico clinico resumido",
        notes: "Notas operativas",
        notesPlaceholder: "Frecuencia de control, recomendaciones o restricciones",
        phasePlan: "Plan de fases",
        phaseDescription: "El porcentaje de avance se calcula en funcion de las fases completadas y su peso relativo.",
        save: "Guardar tratamiento",
      };

  return (
    <main className="space-y-6 py-4 lg:py-8">
      <Topbar title={copy.title} description={copy.description} locale={locale} />

      <Card>
        <form action={createTreatmentAction} className="space-y-6">
          {error ? <Alert message={error} tone="danger" /> : null}

          <div className="grid gap-5 md:grid-cols-2">
            <Field label={copy.patient}>
              <select className={selectClassName} name="patientId" defaultValue={patientId ?? ""} required>
                <option value="">{copy.selectPatient}</option>
                {options.patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.lastName}, {patient.firstName}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={copy.responsible}>
              <select className={selectClassName} name="dentistId" defaultValue="">
                <option value="">{copy.unassigned}</option>
                {options.dentists.map((dentist) => (
                  <option key={dentist.id} value={dentist.id}>
                    {dentist.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={copy.treatmentName}>
              <input className={inputClassName} name="title" placeholder={copy.treatmentPlaceholder} required />
            </Field>
            <Field label={copy.startDate}>
              <input className={inputClassName} type="date" name="startDate" required />
            </Field>
            <Field label={copy.estimatedEndDate}>
              <input className={inputClassName} type="date" name="estimatedEndDate" required />
            </Field>
            <div />
          </div>

          <Field label={copy.diagnosis} hint={copy.optional}>
            <textarea
              className={textareaClassName}
              name="diagnosis"
              placeholder={copy.diagnosisPlaceholder}
            />
          </Field>

          <Field label={copy.notes} hint={copy.optional}>
            <textarea
              className={textareaClassName}
              name="notes"
              placeholder={copy.notesPlaceholder}
            />
          </Field>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-foreground">{copy.phasePlan}</p>
              <p className="mt-1 text-sm text-muted">{copy.phaseDescription}</p>
            </div>
            <PhasePlanner />
          </div>

          <button type="submit" className={buttonStyles({})}>
            {copy.save}
          </button>
        </form>
      </Card>
    </main>
  );
}
