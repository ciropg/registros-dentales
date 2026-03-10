import Link from "next/link";
import { AppointmentStatus } from "@prisma/client";
import { Topbar } from "@/components/layout/topbar";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, selectClassName } from "@/components/ui/field";
import { appointmentStatusLabel, appointmentStatusTone, treatmentStatusLabel, treatmentStatusTone } from "@/lib/status";
import { formatDateTime } from "@/lib/date";
import { toSearchParam } from "@/lib/utils";
import { updateAppointmentStatusAction } from "@/modules/appointments/actions";
import { listAppointments } from "@/modules/appointments/queries";

const statusFilters: Array<AppointmentStatus | "ALL"> = ["ALL", ...Object.values(AppointmentStatus)];

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const selectedStatus = toSearchParam(params.status) ?? "ALL";
  const success = toSearchParam(params.success);
  const error = toSearchParam(params.error);
  const appointments = await listAppointments(selectedStatus === "ALL" ? undefined : selectedStatus);

  return (
    <main className="space-y-6 py-4 lg:py-8">
      <Topbar
        title="Agenda de citas"
        description="Controla la agenda del tratamiento y actualiza el estado de cada cita desde una sola vista."
        action={
          <Link href="/appointments/new" className={buttonStyles({})}>
            Nueva cita
          </Link>
        }
      />

      {success ? <Alert message={success} tone="success" /> : null}
      {error ? <Alert message={error} tone="danger" /> : null}

      <Card>
        <CardHeader
          eyebrow="Filtro"
          title="Estados de cita"
          description="Filtra la agenda por estado operativo."
        />

        <div className="mt-6 flex flex-wrap gap-3">
          {statusFilters.map((status) => {
            const href = status === "ALL" ? "/appointments" : `/appointments?status=${status}`;
            const active = selectedStatus === status;

            return (
              <Link
                key={status}
                href={href}
                className={buttonStyles({
                  variant: active ? "primary" : "secondary",
                  size: "sm",
                })}
              >
                {status === "ALL" ? "Todas" : appointmentStatusLabel(status)}
              </Link>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardHeader
          eyebrow="Agenda"
          title="Listado de citas"
          description="Actualiza el estado clinico-operativo y accede al paciente o tratamiento relacionado."
        />

        <div className="mt-6 space-y-4">
          {appointments.length ? (
            appointments.map((appointment) => (
              <div key={appointment.id} className="rounded-3xl border border-line bg-white/70 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={appointmentStatusTone(appointment.status)}>
                        {appointmentStatusLabel(appointment.status)}
                      </Badge>
                      {appointment.treatment ? (
                        <Badge tone={treatmentStatusTone(appointment.treatment.status)}>
                          {treatmentStatusLabel(appointment.treatment.status)}
                        </Badge>
                      ) : null}
                    </div>

                    <div>
                      <p className="text-lg text-foreground">
                        {appointment.patient.firstName} {appointment.patient.lastName}
                      </p>
                      <p className="mt-1 text-sm text-muted">{appointment.reason}</p>
                      <p className="mt-1 text-sm text-muted">{formatDateTime(appointment.scheduledAt)}</p>
                      <p className="mt-1 text-sm text-muted">
                        Tratamiento: {appointment.treatment?.title ?? "No asociado"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/patients/${appointment.patient.id}`}
                        className={buttonStyles({ variant: "secondary", size: "sm" })}
                      >
                        Ver paciente
                      </Link>
                      {appointment.treatment ? (
                        <Link
                          href={`/treatments/${appointment.treatment.id}`}
                          className={buttonStyles({ variant: "secondary", size: "sm" })}
                        >
                          Ver tratamiento
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  <form
                    action={updateAppointmentStatusAction}
                    className="grid gap-3 rounded-3xl border border-line bg-white/80 p-4 lg:min-w-[320px]"
                  >
                    <input type="hidden" name="appointmentId" value={appointment.id} />
                    <input type="hidden" name="redirectPath" value="/appointments" />
                    <Field label="Estado">
                      <select className={selectClassName} name="status" defaultValue={appointment.status}>
                        {Object.values(AppointmentStatus).map((status) => (
                          <option key={status} value={status}>
                            {appointmentStatusLabel(status)}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <button type="submit" className={buttonStyles({})}>
                      Guardar cambio
                    </button>
                  </form>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="Sin citas para este filtro"
              description="No existen citas que coincidan con el estado seleccionado."
              action={
                <Link href="/appointments/new" className={buttonStyles({})}>
                  Crear cita
                </Link>
              }
            />
          )}
        </div>
      </Card>
    </main>
  );
}
