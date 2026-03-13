import Link from "next/link";
import { AppointmentStatus } from "@prisma/client";
import { format } from "date-fns";
import { AppointmentStatusForm } from "@/components/appointments/appointment-status-form";
import { BulkStatusWarningForm } from "@/components/appointments/bulk-status-warning-form";
import { Topbar } from "@/components/layout/topbar";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, inputClassName } from "@/components/ui/field";
import { Pagination } from "@/components/ui/pagination";
import { SearchParamFeedbackModal } from "@/components/ui/search-param-feedback-modal";
import { requireUser } from "@/lib/auth";
import { appointmentStatusLabel, appointmentStatusTone, treatmentStatusLabel, treatmentStatusTone } from "@/lib/status";
import { formatDateTime } from "@/lib/date";
import { toPositiveIntSearchParam, toSearchParam } from "@/lib/utils";
import {
  markTodayAppointmentsAsAttendedAction,
  markTodayAppointmentsAsNoShowAction,
  updateAppointmentStatusAction,
} from "@/modules/appointments/actions";
import { listAppointments } from "@/modules/appointments/queries";

const statusFilters = Object.values(AppointmentStatus);
const defaultStatusFilters = [AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED];

function buildAppointmentsFilterHref(
  statuses: AppointmentStatus[],
  date: string,
  dateScope: "day" | "all",
  page = 1,
) {
  const params = new URLSearchParams();

  for (const status of statuses) {
    params.append("status", status);
  }

  if (dateScope === "all") {
    params.set("dateScope", "all");
  } else {
    params.set("date", date);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return query ? `/appointments?${query}` : "/appointments";
}

function getSelectedStatuses(statusParam: string | string[] | undefined) {
  const rawValues = Array.isArray(statusParam) ? statusParam : statusParam ? [statusParam] : [];
  const normalizedStatuses = rawValues
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter((value): value is AppointmentStatus => statusFilters.includes(value as AppointmentStatus));
  const uniqueStatuses = [...new Set(normalizedStatuses)];

  return uniqueStatuses.length ? uniqueStatuses : defaultStatusFilters;
}

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const user = await requireUser();
  const today = format(new Date(), "yyyy-MM-dd");
  const selectedStatuses = getSelectedStatuses(params.status);
  const dateScope = toSearchParam(params.dateScope) === "all" ? "all" : "day";
  const selectedDate = toSearchParam(params.date) || today;
  const requestedPage = toPositiveIntSearchParam(params.page);
  const success = toSearchParam(params.success);
  const error = toSearchParam(params.error);
  const appointmentUpdatedMessage = success === "Cita actualizada correctamente." ? success : undefined;
  const successAlertMessage = success && success !== appointmentUpdatedMessage ? success : undefined;
  const appointments = await listAppointments(
    user.isDemo,
    selectedStatuses,
    dateScope === "all" ? undefined : selectedDate,
    dateScope === "all",
    requestedPage,
  );
  const redirectPath = buildAppointmentsFilterHref(selectedStatuses, selectedDate, dateScope, appointments.page);
  const showBulkTodayActions = dateScope === "day" && selectedDate === today;
  const filtersFormKey = `${dateScope}:${selectedDate}:${selectedStatuses.join(",")}`;

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

      <SearchParamFeedbackModal
        message={appointmentUpdatedMessage}
        queryKey="success"
        title={appointmentUpdatedMessage ?? "Operacion completada"}
        description="La cita fue modificada correctamente y la agenda ya muestra la informacion actualizada."
      />
      {successAlertMessage ? <Alert message={successAlertMessage} tone="success" /> : null}
      {error ? <Alert message={error} tone="danger" /> : null}

      <Card>
        <CardHeader
          eyebrow="Filtro"
          title="Filtros de agenda"
          description="Filtra la agenda por estado operativo y fecha. Por defecto se muestra hoy, pero puedes ver todas ordenadas por cercania."
        />

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={buildAppointmentsFilterHref(selectedStatuses, today, "day")}
            className={buttonStyles({
              variant: dateScope === "day" && selectedDate === today ? "primary" : "secondary",
              size: "sm",
            })}
          >
            Hoy
          </Link>
          <Link
            href={buildAppointmentsFilterHref(selectedStatuses, selectedDate, "all")}
            className={buttonStyles({
              variant: dateScope === "all" ? "primary" : "secondary",
              size: "sm",
            })}
          >
            Todas las citas
          </Link>
          {showBulkTodayActions ? (
            <BulkStatusWarningForm
              date={selectedDate}
              redirectPath={redirectPath}
              buttonLabel="Marcar citas de hoy como asistio"
              pendingLabel="Marcando asistio..."
              confirmMessage="Se marcaran como asistio todas las citas de hoy con estado Agendada o Reprogramada. Verifica la agenda antes de continuar."
              action={markTodayAppointmentsAsAttendedAction}
            />
          ) : null}
          {showBulkTodayActions ? (
            <BulkStatusWarningForm
              date={selectedDate}
              redirectPath={redirectPath}
              buttonLabel="Marcar citas de hoy como no asistio"
              pendingLabel="Marcando no asistio..."
              confirmMessage="Se marcaran como no asistio todas las citas de hoy con estado Agendada o Reprogramada. Esta accion puede afectar el seguimiento del paciente."
              variant="warning"
              action={markTodayAppointmentsAsNoShowAction}
            />
          ) : null}
        </div>

        <form key={filtersFormKey} className="mt-6 space-y-4">
          <div className="grid gap-3 md:grid-cols-[220px_auto]">
            <Field label="Fecha">
              <input className={inputClassName} type="date" name="date" defaultValue={selectedDate} />
            </Field>
            <div className="self-end">
              <button type="submit" className={buttonStyles({ variant: "secondary" })}>
                Aplicar filtros
              </button>
            </div>
          </div>
          <Field
            label="Estados"
            hint="Puedes combinar uno o varios estados. Si no marcas ninguno, se mostraran Agendada y Reprogramada."
          >
            <div className="flex flex-wrap gap-3">
              {statusFilters.map((status) => (
                <label
                  key={status}
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm text-foreground"
                >
                  <input
                    type="checkbox"
                    name="status"
                    value={status}
                    defaultChecked={selectedStatuses.includes(status)}
                  />
                  <span>{appointmentStatusLabel(status)}</span>
                </label>
              ))}
            </div>
          </Field>
          <div className="flex flex-wrap gap-3">
            <Link
              href={buildAppointmentsFilterHref(statusFilters, selectedDate, dateScope)}
              className={buttonStyles({ variant: "secondary", size: "sm" })}
            >
              Todos los estados
            </Link>
            <Link
              href={buildAppointmentsFilterHref(defaultStatusFilters, today, "day")}
              className={buttonStyles({ variant: "secondary", size: "sm" })}
            >
              Restablecer por defecto
            </Link>
          </div>
          <input type="hidden" name="dateScope" value={dateScope} />
        </form>

        <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted">
          <span>Activos:</span>
          {selectedStatuses.map((status) => (
            <Badge key={status} tone={appointmentStatusTone(status)}>
              {appointmentStatusLabel(status)}
            </Badge>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader
          eyebrow="Agenda"
          title="Listado de citas"
          description="Actualiza el estado clinico-operativo y accede al paciente o tratamiento relacionado."
        />

        <div className="mt-6 space-y-4">
          {appointments.items.length ? (
            appointments.items.map((appointment) => (
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
                      <p className="mt-1 text-sm text-muted">{appointment.reason || "Sin motivo registrado."}</p>
                      <p className="mt-1 text-sm text-muted">{formatDateTime(appointment.scheduledAt)}</p>
                      <p className="mt-1 text-sm text-muted">
                        Tratamiento: {appointment.treatment?.title ?? "No asociado"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/appointments/${appointment.id}/edit?redirectPath=${encodeURIComponent(redirectPath)}`}
                        className={buttonStyles({ variant: "secondary", size: "sm" })}
                      >
                        Editar cita
                      </Link>
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

                  <AppointmentStatusForm
                    action={updateAppointmentStatusAction}
                    appointmentId={appointment.id}
                    redirectPath={redirectPath}
                    patientName={`${appointment.patient.firstName} ${appointment.patient.lastName}`}
                    currentStatus={appointment.status}
                    scheduledAt={appointment.scheduledAt}
                    submitLabel="Guardar cambio"
                    pendingLabel="Guardando..."
                    className="grid gap-3 rounded-3xl border border-line bg-white/80 p-4 lg:min-w-[320px]"
                    submitClassName="self-end"
                    fieldLabel="Estado"
                  />
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="Sin citas para este filtro"
              description="No existen citas que coincidan con los estados y fecha seleccionados."
              action={
                <Link href="/appointments/new" className={buttonStyles({})}>
                  Crear cita
                </Link>
              }
            />
          )}
        </div>
      </Card>

      {appointments.totalPages > 1 ? (
        <Pagination
          currentPage={appointments.page}
          totalPages={appointments.totalPages}
          totalCount={appointments.totalCount}
          pageSize={appointments.pageSize}
          currentCount={appointments.items.length}
          itemLabel="citas"
          prevHref={
            appointments.page > 1
              ? buildAppointmentsFilterHref(selectedStatuses, selectedDate, dateScope, appointments.page - 1)
              : undefined
          }
          nextHref={
            appointments.page < appointments.totalPages
              ? buildAppointmentsFilterHref(selectedStatuses, selectedDate, dateScope, appointments.page + 1)
              : undefined
          }
        />
      ) : null}
    </main>
  );
}
