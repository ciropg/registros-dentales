import { notFound } from "next/navigation";
import { AppointmentForm } from "@/components/appointments/new-appointment-form";
import { Topbar } from "@/components/layout/topbar";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getCurrentLocale } from "@/lib/i18n/server";
import { toSearchParam } from "@/lib/utils";
import { updateAppointmentAction } from "@/modules/appointments/actions";
import { getAppointmentFormDetail, getAppointmentFormOptions } from "@/modules/appointments/queries";

export default async function EditAppointmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [user, locale] = await Promise.all([requireUser(), getCurrentLocale()]);
  const [{ id }, query, options] = await Promise.all([params, searchParams, getAppointmentFormOptions(user.isDemo)]);
  const appointment = await getAppointmentFormDetail(id, user.isDemo);

  if (!appointment) {
    notFound();
  }

  const error = toSearchParam(query.error);
  const redirectPath = toSearchParam(query.redirectPath) ?? "/appointments";
  const copy = locale === "en"
    ? {
        title: "Edit appointment",
        description: "Update patient, treatment, date, or notes without losing the current appointment status.",
        submit: "Save changes",
        saving: "Saving...",
        confirmTitle: "Confirm appointment update",
        confirmDescription: "The appointment data will be updated with the entered information.",
        confirmButton: "Yes, update",
      }
    : {
        title: "Editar cita",
        description: "Actualiza paciente, tratamiento, fecha u observaciones sin perder el estado actual de la cita.",
        submit: "Guardar cambios",
        saving: "Guardando...",
        confirmTitle: "Confirmar actualizacion de cita",
        confirmDescription: "Se actualizaran los datos de la cita con la informacion ingresada.",
        confirmButton: "Si, actualizar",
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
              appointmentId: appointment.id,
              patientId: appointment.patientId,
              treatmentId: appointment.treatmentId,
              scheduledAt: appointment.scheduledAt,
              reason: appointment.reason,
              notes: appointment.notes,
              redirectPath,
            }}
            action={updateAppointmentAction}
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
