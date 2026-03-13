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
import { getCurrentLocale } from "@/lib/i18n/server";
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
  const [user, locale] = await Promise.all([requireUser(), getCurrentLocale()]);
  const today = format(new Date(), "yyyy-MM-dd");
  const selectedStatuses = getSelectedStatuses(params.status);
  const dateScope = toSearchParam(params.dateScope) === "all" ? "all" : "day";
  const selectedDate = toSearchParam(params.date) || today;
  const requestedPage = toPositiveIntSearchParam(params.page);
  const success = toSearchParam(params.success);
  const error = toSearchParam(params.error);
  const copy = locale === "en"
    ? {
        title: "Appointment schedule",
        description: "Control the treatment schedule and update each appointment status from one view.",
        newAppointment: "New appointment",
        updatedSuccess: "Appointment updated successfully.",
        updatedDescription:
          "The appointment was updated successfully and the schedule already shows the latest information.",
        filterEyebrow: "Filter",
        filterTitle: "Schedule filters",
        filterDescription:
          "Filter the schedule by operational status and date. By default, today is shown, but you can view all sorted by proximity.",
        today: "Today",
        allAppointments: "All appointments",
        markTodayAttended: "Mark today's appointments as attended",
        markTodayNoShow: "Mark today's appointments as no-show",
        pendingAttended: "Marking attended...",
        pendingNoShow: "Marking no-show...",
        confirmTodayAttended:
          "All today's appointments with Scheduled or Rescheduled status will be marked as attended. Review the schedule before continuing.",
        confirmTodayNoShow:
          "All today's appointments with Scheduled or Rescheduled status will be marked as no-show. This action can affect patient follow-up.",
        date: "Date",
        applyFilters: "Apply filters",
        statuses: "Statuses",
        statusesHint:
          "You can combine one or more statuses. If none are selected, Scheduled and Rescheduled will be shown.",
        allStatuses: "All statuses",
        resetDefault: "Reset to default",
        active: "Active",
        agendaEyebrow: "Schedule",
        agendaTitle: "Appointment list",
        agendaDescription: "Update clinical-operational status and access the related patient or treatment.",
        noReason: "No reason recorded.",
        treatment: "Treatment",
        notAssociated: "Not linked",
        editAppointment: "Edit appointment",
        viewPatient: "View patient",
        viewTreatment: "View treatment",
        saveChange: "Save change",
        saving: "Saving...",
        updateStatus: "Status",
        emptyTitle: "No appointments for this filter",
        emptyDescription: "There are no appointments matching the selected statuses and date.",
        createAppointment: "Create appointment",
        itemLabel: "appointments",
        operationCompleted: "Operation completed",
      }
    : {
        title: "Agenda de citas",
        description: "Controla la agenda del tratamiento y actualiza el estado de cada cita desde una sola vista.",
        newAppointment: "Nueva cita",
        updatedSuccess: "Cita actualizada correctamente.",
        updatedDescription:
          "La cita fue modificada correctamente y la agenda ya muestra la informacion actualizada.",
        filterEyebrow: "Filtro",
        filterTitle: "Filtros de agenda",
        filterDescription:
          "Filtra la agenda por estado operativo y fecha. Por defecto se muestra hoy, pero puedes ver todas ordenadas por cercania.",
        today: "Hoy",
        allAppointments: "Todas las citas",
        markTodayAttended: "Marcar citas de hoy como asistio",
        markTodayNoShow: "Marcar citas de hoy como no asistio",
        pendingAttended: "Marcando asistio...",
        pendingNoShow: "Marcando no asistio...",
        confirmTodayAttended:
          "Se marcaran como asistio todas las citas de hoy con estado Agendada o Reprogramada. Verifica la agenda antes de continuar.",
        confirmTodayNoShow:
          "Se marcaran como no asistio todas las citas de hoy con estado Agendada o Reprogramada. Esta accion puede afectar el seguimiento del paciente.",
        date: "Fecha",
        applyFilters: "Aplicar filtros",
        statuses: "Estados",
        statusesHint:
          "Puedes combinar uno o varios estados. Si no marcas ninguno, se mostraran Agendada y Reprogramada.",
        allStatuses: "Todos los estados",
        resetDefault: "Restablecer por defecto",
        active: "Activos",
        agendaEyebrow: "Agenda",
        agendaTitle: "Listado de citas",
        agendaDescription: "Actualiza el estado clinico-operativo y accede al paciente o tratamiento relacionado.",
        noReason: "Sin motivo registrado.",
        treatment: "Tratamiento",
        notAssociated: "No asociado",
        editAppointment: "Editar cita",
        viewPatient: "Ver paciente",
        viewTreatment: "Ver tratamiento",
        saveChange: "Guardar cambio",
        saving: "Guardando...",
        updateStatus: "Estado",
        emptyTitle: "Sin citas para este filtro",
        emptyDescription: "No existen citas que coincidan con los estados y fecha seleccionados.",
        createAppointment: "Crear cita",
        itemLabel: "citas",
        operationCompleted: "Operacion completada",
      };
  const appointmentUpdatedMessage = success === copy.updatedSuccess ? success : undefined;
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
        title={copy.title}
        description={copy.description}
        locale={locale}
        action={
          <Link href="/appointments/new" className={buttonStyles({})}>
            {copy.newAppointment}
          </Link>
        }
      />

      <SearchParamFeedbackModal
        message={appointmentUpdatedMessage}
        queryKey="success"
        title={appointmentUpdatedMessage ?? copy.operationCompleted}
        description={copy.updatedDescription}
      />
      {successAlertMessage ? <Alert message={successAlertMessage} tone="success" /> : null}
      {error ? <Alert message={error} tone="danger" /> : null}

      <Card>
        <CardHeader
          eyebrow={copy.filterEyebrow}
          title={copy.filterTitle}
          description={copy.filterDescription}
        />

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={buildAppointmentsFilterHref(selectedStatuses, today, "day")}
            className={buttonStyles({
              variant: dateScope === "day" && selectedDate === today ? "primary" : "secondary",
              size: "sm",
            })}
          >
            {copy.today}
          </Link>
          <Link
            href={buildAppointmentsFilterHref(selectedStatuses, selectedDate, "all")}
            className={buttonStyles({
              variant: dateScope === "all" ? "primary" : "secondary",
              size: "sm",
            })}
          >
            {copy.allAppointments}
          </Link>
          {showBulkTodayActions ? (
            <BulkStatusWarningForm
              date={selectedDate}
              redirectPath={redirectPath}
              buttonLabel={copy.markTodayAttended}
              pendingLabel={copy.pendingAttended}
              confirmMessage={copy.confirmTodayAttended}
              action={markTodayAppointmentsAsAttendedAction}
            />
          ) : null}
          {showBulkTodayActions ? (
            <BulkStatusWarningForm
              date={selectedDate}
              redirectPath={redirectPath}
              buttonLabel={copy.markTodayNoShow}
              pendingLabel={copy.pendingNoShow}
              confirmMessage={copy.confirmTodayNoShow}
              variant="warning"
              action={markTodayAppointmentsAsNoShowAction}
            />
          ) : null}
        </div>

        <form key={filtersFormKey} className="mt-6 space-y-4">
          <div className="grid gap-3 md:grid-cols-[220px_auto]">
            <Field label={copy.date}>
              <input className={inputClassName} type="date" name="date" defaultValue={selectedDate} />
            </Field>
            <div className="self-end">
              <button type="submit" className={buttonStyles({ variant: "secondary" })}>
                {copy.applyFilters}
              </button>
            </div>
          </div>
          <Field
            label={copy.statuses}
            hint={copy.statusesHint}
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
                  <span>{appointmentStatusLabel(status, locale)}</span>
                </label>
              ))}
            </div>
          </Field>
          <div className="flex flex-wrap gap-3">
            <Link
              href={buildAppointmentsFilterHref(statusFilters, selectedDate, dateScope)}
              className={buttonStyles({ variant: "secondary", size: "sm" })}
            >
              {copy.allStatuses}
            </Link>
            <Link
              href={buildAppointmentsFilterHref(defaultStatusFilters, today, "day")}
              className={buttonStyles({ variant: "secondary", size: "sm" })}
            >
              {copy.resetDefault}
            </Link>
          </div>
          <input type="hidden" name="dateScope" value={dateScope} />
        </form>

        <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted">
          <span>{copy.active}:</span>
          {selectedStatuses.map((status) => (
            <Badge key={status} tone={appointmentStatusTone(status)}>
              {appointmentStatusLabel(status, locale)}
            </Badge>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader
          eyebrow={copy.agendaEyebrow}
          title={copy.agendaTitle}
          description={copy.agendaDescription}
        />

        <div className="mt-6 space-y-4">
          {appointments.items.length ? (
            appointments.items.map((appointment) => (
              <div key={appointment.id} className="rounded-3xl border border-line bg-white/70 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={appointmentStatusTone(appointment.status)}>
                        {appointmentStatusLabel(appointment.status, locale)}
                      </Badge>
                      {appointment.treatment ? (
                        <Badge tone={treatmentStatusTone(appointment.treatment.status)}>
                          {treatmentStatusLabel(appointment.treatment.status, locale)}
                        </Badge>
                      ) : null}
                    </div>

                    <div>
                      <p className="text-lg text-foreground">
                        {appointment.patient.firstName} {appointment.patient.lastName}
                      </p>
                      <p className="mt-1 text-sm text-muted">{appointment.reason || copy.noReason}</p>
                      <p className="mt-1 text-sm text-muted">{formatDateTime(appointment.scheduledAt)}</p>
                      <p className="mt-1 text-sm text-muted">
                        {copy.treatment}: {appointment.treatment?.title ?? copy.notAssociated}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/appointments/${appointment.id}/edit?redirectPath=${encodeURIComponent(redirectPath)}`}
                        className={buttonStyles({ variant: "secondary", size: "sm" })}
                      >
                        {copy.editAppointment}
                      </Link>
                      <Link
                        href={`/patients/${appointment.patient.id}`}
                        className={buttonStyles({ variant: "secondary", size: "sm" })}
                      >
                        {copy.viewPatient}
                      </Link>
                      {appointment.treatment ? (
                        <Link
                          href={`/treatments/${appointment.treatment.id}`}
                          className={buttonStyles({ variant: "secondary", size: "sm" })}
                        >
                          {copy.viewTreatment}
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
                    submitLabel={copy.saveChange}
                    pendingLabel={copy.saving}
                    className="grid gap-3 rounded-3xl border border-line bg-white/80 p-4 lg:min-w-[320px]"
                    submitClassName="self-end"
                    fieldLabel={copy.updateStatus}
                  />
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title={copy.emptyTitle}
              description={copy.emptyDescription}
              action={
                <Link href="/appointments/new" className={buttonStyles({})}>
                  {copy.createAppointment}
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
          itemLabel={copy.itemLabel}
          locale={locale}
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
