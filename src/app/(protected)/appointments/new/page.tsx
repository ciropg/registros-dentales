import { AppointmentForm } from "@/components/appointments/new-appointment-form";
import { Topbar } from "@/components/layout/topbar";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { toSearchParam } from "@/lib/utils";
import { createAppointmentAction } from "@/modules/appointments/actions";
import { getAppointmentFormOptions } from "@/modules/appointments/queries";

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const [params, options] = await Promise.all([searchParams, getAppointmentFormOptions(user.isDemo)]);
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
        <>
          {error ? <Alert message={error} tone="danger" /> : null}
          <AppointmentForm
            patients={options.patients}
            treatments={options.treatments}
            defaults={{
              patientId: derivedPatientId,
              treatmentId: treatmentId ?? "",
            }}
            action={createAppointmentAction}
            submitLabel="Guardar cita"
          />
        </>
      </Card>
    </main>
  );
}
