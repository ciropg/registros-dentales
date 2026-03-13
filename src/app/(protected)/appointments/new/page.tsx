import { AppointmentForm } from "@/components/appointments/new-appointment-form";
import { Topbar } from "@/components/layout/topbar";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getCurrentLocale } from "@/lib/i18n/server";
import { toSearchParam } from "@/lib/utils";
import { createAppointmentAction } from "@/modules/appointments/actions";
import { getAppointmentFormOptions } from "@/modules/appointments/queries";

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [user, locale] = await Promise.all([requireUser(), getCurrentLocale()]);
  const [params, options] = await Promise.all([searchParams, getAppointmentFormOptions(user.isDemo)]);
  const patientId = toSearchParam(params.patientId);
  const treatmentId = toSearchParam(params.treatmentId);
  const error = toSearchParam(params.error);
  const preselectedTreatment = options.treatments.find((treatment) => treatment.id === treatmentId);
  const derivedPatientId = patientId ?? preselectedTreatment?.patientId ?? "";
  const copy = locale === "en"
    ? {
        title: "New appointment",
        description: "Schedule an appointment linked to a patient and, if applicable, a specific treatment.",
        submit: "Save appointment",
        saving: "Saving...",
        confirmTitle: "Confirm appointment registration",
        confirmDescription: "The appointment will be registered with the entered data and will become available in the schedule.",
        confirmButton: "Yes, register",
      }
    : {
        title: "Nueva cita",
        description: "Agenda una cita asociada a un paciente y, si aplica, a un tratamiento especifico.",
        submit: "Guardar cita",
        saving: "Guardando...",
        confirmTitle: "Confirmar registro de cita",
        confirmDescription: "Se registrara la cita con los datos ingresados y quedara disponible en la agenda.",
        confirmButton: "Si, registrar",
      };

  return (
    <main className="space-y-6 py-4 lg:py-8">
      <Topbar
        title={copy.title}
        description={copy.description}
        locale={locale}
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
            submitLabel={copy.submit}
            pendingLabel={copy.saving}
            confirmation={{
              title: copy.confirmTitle,
              description: copy.confirmDescription,
              confirmButtonLabel: copy.confirmButton,
            }}
          />
        </>
      </Card>
    </main>
  );
}
