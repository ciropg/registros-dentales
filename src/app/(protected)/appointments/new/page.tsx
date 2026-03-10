import { Topbar } from "@/components/layout/topbar";
import { Alert } from "@/components/ui/alert";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, inputClassName, selectClassName, textareaClassName } from "@/components/ui/field";
import { toSearchParam } from "@/lib/utils";
import { createAppointmentAction } from "@/modules/appointments/actions";
import { getAppointmentFormOptions } from "@/modules/appointments/queries";

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, options] = await Promise.all([searchParams, getAppointmentFormOptions()]);
  const patientId = toSearchParam(params.patientId);
  const treatmentId = toSearchParam(params.treatmentId);
  const error = toSearchParam(params.error);
  const preselectedTreatment = options.treatments.find((treatment) => treatment.id === treatmentId);
  const derivedPatientId = patientId ?? preselectedTreatment?.patientId ?? "";

  return (
    <main className="space-y-6 py-4 lg:py-8">
      <Topbar
        title="Nueva cita"
        description="Agenda una cita asociada a un paciente y, si aplica, a un tratamiento especifico."
      />

      <Card>
        <form action={createAppointmentAction} className="space-y-5">
          {error ? <Alert message={error} tone="danger" /> : null}

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Paciente">
              <select className={selectClassName} name="patientId" defaultValue={derivedPatientId} required>
                <option value="">Selecciona un paciente</option>
                {options.patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.lastName}, {patient.firstName}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tratamiento asociado">
              <select className={selectClassName} name="treatmentId" defaultValue={treatmentId ?? ""}>
                <option value="">Sin asociar</option>
                {options.treatments.map((treatment) => (
                  <option key={treatment.id} value={treatment.id}>
                    {treatment.title} - {treatment.patient.lastName}, {treatment.patient.firstName}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Fecha y hora">
              <input className={inputClassName} type="datetime-local" name="scheduledAt" required />
            </Field>
            <Field label="Motivo">
              <input
                className={inputClassName}
                name="reason"
                placeholder="Control mensual, ajuste, limpieza..."
                required
              />
            </Field>
          </div>

          <Field label="Notas">
            <textarea className={textareaClassName} name="notes" placeholder="Observaciones operativas o clinicas" />
          </Field>

          <button type="submit" className={buttonStyles({})}>
            Guardar cita
          </button>
        </form>
      </Card>
    </main>
  );
}
