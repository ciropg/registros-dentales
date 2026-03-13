import Link from "next/link";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Alert } from "@/components/ui/alert";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, inputClassName, selectClassName, textareaClassName } from "@/components/ui/field";
import { requireBaseRole } from "@/lib/auth";
import { getCurrentLocale } from "@/lib/i18n/server";
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
  const [user, locale] = await Promise.all([
    requireBaseRole(["ADMIN", "DENTIST", "ASSISTANT", "RECEPTIONIST"]),
    getCurrentLocale(),
  ]);
  const [{ id }, query, options] = await Promise.all([params, searchParams, getTreatmentFormOptions(user.isDemo)]);
  const treatment = await getTreatmentFormDetail(id, user.isDemo);

  if (!treatment) {
    notFound();
  }

  const error = toSearchParam(query.error);
  const copy = locale === "en"
    ? {
        title: "Edit treatment",
        description: "Update treatment operational data without altering appointment or phase history.",
        patient: "Patient",
        patientHint: "Not editable to preserve consistency with linked appointments.",
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
        saveChanges: "Save changes",
        cancel: "Cancel",
      }
    : {
        title: "Editar tratamiento",
        description: "Actualiza los datos operativos del tratamiento sin alterar el historial de fases ni citas.",
        patient: "Paciente",
        patientHint: "No editable para mantener consistencia con las citas asociadas.",
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
        saveChanges: "Guardar cambios",
        cancel: "Cancelar",
      };

  return (
    <main className="space-y-6 py-4 lg:py-8">
      <Topbar title={copy.title} description={copy.description} locale={locale} />

      <Card>
        <form action={updateTreatmentAction} className="space-y-6">
          <input type="hidden" name="treatmentId" value={treatment.id} />
          {error ? <Alert message={error} tone="danger" /> : null}

          <div className="grid gap-5 md:grid-cols-2">
            <Field label={copy.patient} hint={copy.patientHint}>
              <div className={inputClassName}>
                {treatment.patient.lastName}, {treatment.patient.firstName}
              </div>
            </Field>
            <Field label={copy.responsible}>
              <select className={selectClassName} name="dentistId" defaultValue={treatment.dentistId ?? ""}>
                <option value="">{copy.unassigned}</option>
                {options.dentists.map((dentist) => (
                  <option key={dentist.id} value={dentist.id}>
                    {dentist.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={copy.treatmentName}>
              <input
                className={inputClassName}
                name="title"
                defaultValue={treatment.title}
                placeholder={copy.treatmentPlaceholder}
                required
              />
            </Field>
            <Field label={copy.startDate}>
              <input
                className={inputClassName}
                type="date"
                name="startDate"
                defaultValue={format(treatment.startDate, "yyyy-MM-dd")}
                required
              />
            </Field>
            <Field label={copy.estimatedEndDate}>
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

          <Field label={copy.diagnosis} hint={copy.optional}>
            <textarea
              className={textareaClassName}
              name="diagnosis"
              defaultValue={treatment.diagnosis}
              placeholder={copy.diagnosisPlaceholder}
            />
          </Field>

          <Field label={copy.notes} hint={copy.optional}>
            <textarea
              className={textareaClassName}
              name="notes"
              defaultValue={treatment.notes ?? ""}
              placeholder={copy.notesPlaceholder}
            />
          </Field>

          <div className="flex flex-wrap gap-3">
            <button type="submit" className={buttonStyles({})}>
              {copy.saveChanges}
            </button>
            <Link href={`/treatments/${treatment.id}`} className={buttonStyles({ variant: "secondary" })}>
              {copy.cancel}
            </Link>
          </div>
        </form>
      </Card>
    </main>
  );
}
