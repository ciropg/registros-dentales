import Link from "next/link";
import { PhaseStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { AppointmentStatusForm } from "@/components/appointments/appointment-status-form";
import { Topbar } from "@/components/layout/topbar";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConfirmActionForm } from "@/components/ui/confirm-action-form";
import { Field, selectClassName } from "@/components/ui/field";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SearchParamFeedbackModal } from "@/components/ui/search-param-feedback-modal";
import { requireUser } from "@/lib/auth";
import { getCurrentLocale } from "@/lib/i18n/server";
import { canCreateTreatments, canUpdateTreatmentPhases } from "@/lib/roles";
import {
  appointmentStatusLabel,
  appointmentStatusTone,
  phaseStatusLabel,
  phaseStatusTone,
  treatmentStatusLabel,
  treatmentStatusTone,
} from "@/lib/status";
import { formatDate, formatDateTime } from "@/lib/date";
import { toSearchParam } from "@/lib/utils";
import { updateAppointmentStatusAction } from "@/modules/appointments/actions";
import { updatePhaseStatusAction } from "@/modules/treatments/actions";
import { getTreatmentDetail } from "@/modules/treatments/queries";

const phaseOptions = Object.values(PhaseStatus);

export default async function TreatmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [user, locale] = await Promise.all([requireUser(), getCurrentLocale()]);
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const treatment = await getTreatmentDetail(id, user.isDemo);
  const canEditTreatmentData = canCreateTreatments(user.role);
  const canEditPhases = canUpdateTreatmentPhases(user.role);

  if (!treatment) {
    notFound();
  }

  const success = toSearchParam(query.success);
  const error = toSearchParam(query.error);
  const copy = locale === "en"
    ? {
        detailDescription: "Treatment details with time metrics, phase progress, and linked appointments.",
        editTreatment: "Edit treatment",
        viewPatient: "View patient",
        newAppointment: "New appointment",
        updatedSuccess: "Appointment updated successfully.",
        updatedDescription: "The appointment linked to the treatment was updated successfully.",
        operationCompleted: "Operation completed",
        summary: "Summary",
        clinicalContext: "Clinical context",
        noDiagnosis: "No clinical diagnosis recorded.",
        responsible: "Responsible",
        unassigned: "Unassigned",
        start: "Start",
        estimatedEnd: "Estimated end",
        actualEnd: "Actual closing",
        notes: "Notes",
        noNotes: "No operational notes.",
        metrics: "Metrics",
        performance: "Treatment performance",
        metricsDescription: "Key indicators for clinical and operational follow-up.",
        progressPercent: "Progress percentage",
        elapsedTime: "Elapsed time",
        remainingTime: "Remaining time",
        attended: "Attended appointments",
        noShow: "No-shows",
        rescheduled: "Rescheduled",
        canceled: "Canceled",
        days: "days",
        phases: "Phases",
        updateProgress: "Update progress",
        editablePhases: "Each change automatically recalculates the overall treatment percentage.",
        readonlyPhases: "This profile can review phases, but cannot update their status.",
        phaseWeightDate: (weight: number, date: string) => `Weight ${weight} | Planned date ${date}`,
        phaseCompleted: (date: string) => `Completed ${date}`,
        updatePhase: "Update phase",
        updating: "Updating...",
        confirmPhaseTitle: "Confirm phase update",
        confirmPhaseDescription: (order: number, name: string) =>
          `Phase ${order}. ${name} will be updated to the selected status.`,
        confirmPhaseButton: "Yes, update",
        newStatus: "New status",
        appointments: "Appointments",
        schedule: "Treatment schedule",
        appointmentsDescription: "Mark attendances, no-shows, or cancellations without leaving the detail page.",
        noReason: "No reason recorded.",
        noAppointmentNotes: "No notes.",
        editAppointment: "Edit appointment",
        saveStatus: "Save status",
        saving: "Saving...",
        updateStatus: "Update status",
        noAppointments: "This treatment does not have linked appointments yet.",
      }
    : {
        detailDescription: "Detalle del tratamiento con metricas de tiempo, progreso por fases y citas asociadas.",
        editTreatment: "Editar tratamiento",
        viewPatient: "Ver paciente",
        newAppointment: "Nueva cita",
        updatedSuccess: "Cita actualizada correctamente.",
        updatedDescription: "La cita vinculada al tratamiento fue actualizada correctamente.",
        operationCompleted: "Operacion completada",
        summary: "Resumen",
        clinicalContext: "Contexto clinico",
        noDiagnosis: "Sin diagnostico clinico registrado.",
        responsible: "Responsable",
        unassigned: "Sin asignar",
        start: "Inicio",
        estimatedEnd: "Fin estimado",
        actualEnd: "Cierre real",
        notes: "Notas",
        noNotes: "Sin notas operativas.",
        metrics: "Metricas",
        performance: "Rendimiento del tratamiento",
        metricsDescription: "Indicadores clave para seguimiento clinico y operativo.",
        progressPercent: "Porcentaje de avance",
        elapsedTime: "Tiempo transcurrido",
        remainingTime: "Tiempo restante",
        attended: "Citas asistidas",
        noShow: "No asistidas",
        rescheduled: "Reprogramadas",
        canceled: "Canceladas",
        days: "dias",
        phases: "Fases",
        updateProgress: "Actualizar progreso",
        editablePhases: "Cada cambio recalcula automaticamente el porcentaje global del tratamiento.",
        readonlyPhases: "Este perfil puede consultar las fases, pero no actualizar su estado.",
        phaseWeightDate: (weight: number, date: string) => `Peso ${weight} | Fecha planificada ${date}`,
        phaseCompleted: (date: string) => `Finalizada ${date}`,
        updatePhase: "Actualizar fase",
        updating: "Actualizando...",
        confirmPhaseTitle: "Confirmar actualizacion de fase",
        confirmPhaseDescription: (order: number, name: string) =>
          `Se actualizara la fase ${order}. ${name} al estado seleccionado.`,
        confirmPhaseButton: "Si, actualizar",
        newStatus: "Nuevo estado",
        appointments: "Citas",
        schedule: "Agenda del tratamiento",
        appointmentsDescription: "Marca asistencias, no asistencias o cancelaciones sin salir del detalle.",
        noReason: "Sin motivo registrado.",
        noAppointmentNotes: "Sin notas.",
        editAppointment: "Editar cita",
        saveStatus: "Guardar estado",
        saving: "Guardando...",
        updateStatus: "Actualizar estado",
        noAppointments: "Este tratamiento aun no tiene citas asociadas.",
      };
  const appointmentUpdatedMessage = success === copy.updatedSuccess ? success : undefined;
  const successAlertMessage = success && success !== appointmentUpdatedMessage ? success : undefined;

  return (
    <main className="space-y-6 py-4 lg:py-8">
      <Topbar
        title={treatment.title}
        description={copy.detailDescription}
        locale={locale}
        action={
          <div className="flex flex-wrap gap-3">
            {canEditTreatmentData ? (
              <Link
                href={`/treatments/${treatment.id}/edit`}
                className={buttonStyles({ variant: "secondary" })}
              >
                {copy.editTreatment}
              </Link>
            ) : null}
            <Link
              href={`/patients/${treatment.patientId}`}
              className={buttonStyles({ variant: "secondary" })}
            >
              {copy.viewPatient}
            </Link>
            <Link
              href={`/appointments/new?patientId=${treatment.patientId}&treatmentId=${treatment.id}`}
              className={buttonStyles({})}
            >
              {copy.newAppointment}
            </Link>
          </div>
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

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader eyebrow={copy.summary} title={copy.clinicalContext} />

          <div className="mt-6 flex flex-wrap gap-3">
            <Badge tone={treatmentStatusTone(treatment.status)}>
              {treatmentStatusLabel(treatment.status)}
            </Badge>
            <Badge tone="brand">
              {treatment.patient.firstName} {treatment.patient.lastName}
            </Badge>
          </div>

          <p className="mt-6 text-sm leading-7 text-muted">
            {treatment.diagnosis || copy.noDiagnosis}
          </p>

          <dl className="mt-6 grid gap-3 text-sm">
            <div className="rounded-2xl bg-violet-50/80 px-4 py-4">
              <dt className="text-muted">{copy.responsible}</dt>
              <dd className="mt-1 font-semibold text-foreground">
                {treatment.dentist?.name ?? copy.unassigned}
              </dd>
            </div>
            <div className="rounded-2xl bg-violet-50/80 px-4 py-4">
              <dt className="text-muted">{copy.start}</dt>
              <dd className="mt-1 font-semibold text-foreground">{formatDate(treatment.startDate)}</dd>
            </div>
            <div className="rounded-2xl bg-violet-50/80 px-4 py-4">
              <dt className="text-muted">{copy.estimatedEnd}</dt>
              <dd className="mt-1 font-semibold text-foreground">
                {formatDate(treatment.estimatedEndDate)}
              </dd>
            </div>
            <div className="rounded-2xl bg-violet-50/80 px-4 py-4">
              <dt className="text-muted">{copy.actualEnd}</dt>
              <dd className="mt-1 font-semibold text-foreground">{formatDate(treatment.actualEndDate)}</dd>
            </div>
          </dl>

          <div className="mt-6 rounded-3xl border border-line bg-white/70 p-5">
            <p className="text-sm font-semibold text-foreground">{copy.notes}</p>
            <p className="mt-3 text-sm leading-6 text-muted">{treatment.notes ?? copy.noNotes}</p>
          </div>
        </Card>

        <Card>
          <CardHeader
            eyebrow={copy.metrics}
            title={copy.performance}
            description={copy.metricsDescription}
          />

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-sm text-muted">
              <span>{copy.progressPercent}</span>
              <span>{treatment.metrics.progressPercent}%</span>
            </div>
            <ProgressBar value={treatment.metrics.progressPercent} />
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-3xl bg-violet-50/80 p-5">
              <p className="text-sm text-muted">{copy.elapsedTime}</p>
              <p className="mt-2 text-3xl text-foreground">{treatment.metrics.daysElapsed}</p>
              <p className="text-sm text-muted">{copy.days}</p>
            </div>
            <div className="rounded-3xl bg-violet-50/80 p-5">
              <p className="text-sm text-muted">{copy.remainingTime}</p>
              <p className="mt-2 text-3xl text-foreground">{treatment.metrics.daysRemaining}</p>
              <p className="text-sm text-muted">{copy.days}</p>
            </div>
            <div className="rounded-3xl bg-violet-50/80 p-5">
              <p className="text-sm text-muted">{copy.attended}</p>
              <p className="mt-2 text-3xl text-foreground">{treatment.metrics.attendedCount}</p>
            </div>
            <div className="rounded-3xl bg-violet-50/80 p-5">
              <p className="text-sm text-muted">{copy.noShow}</p>
              <p className="mt-2 text-3xl text-foreground">{treatment.metrics.noShowCount}</p>
            </div>
            <div className="rounded-3xl bg-violet-50/80 p-5">
              <p className="text-sm text-muted">{copy.rescheduled}</p>
              <p className="mt-2 text-3xl text-foreground">{treatment.metrics.rescheduledCount}</p>
            </div>
            <div className="rounded-3xl bg-violet-50/80 p-5">
              <p className="text-sm text-muted">{copy.canceled}</p>
              <p className="mt-2 text-3xl text-foreground">{treatment.metrics.canceledCount}</p>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader
            eyebrow={copy.phases}
            title={copy.updateProgress}
            description={
              canEditPhases
                ? copy.editablePhases
                : copy.readonlyPhases
            }
          />

          <div className="mt-6 space-y-4">
            {treatment.phases.map((phase) => (
              <div key={phase.id} className="rounded-3xl border border-line bg-white/70 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold text-foreground">
                      {phase.phaseOrder}. {phase.name}
                    </p>
                    <p className="mt-2 text-sm text-muted">
                      {copy.phaseWeightDate(phase.weight, formatDate(phase.plannedDate))}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {copy.phaseCompleted(formatDate(phase.completedDate))}
                    </p>
                  </div>
                  <Badge tone={phaseStatusTone(phase.status)}>{phaseStatusLabel(phase.status, locale)}</Badge>
                </div>

                {canEditPhases ? (
                  <ConfirmActionForm
                    action={updatePhaseStatusAction}
                    className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]"
                    hiddenFields={[
                      { name: "treatmentId", value: treatment.id },
                      { name: "phaseId", value: phase.id },
                    ]}
                    submitLabel={copy.updatePhase}
                    pendingLabel={copy.updating}
                    submitClassName="self-end"
                    confirmTitle={copy.confirmPhaseTitle}
                    confirmDescription={copy.confirmPhaseDescription(phase.phaseOrder, phase.name)}
                    confirmButtonLabel={copy.confirmPhaseButton}
                  >
                    <Field label={copy.newStatus}>
                      <select className={selectClassName} name="status" defaultValue={phase.status}>
                        {phaseOptions.map((status) => (
                          <option key={status} value={status}>
                            {phaseStatusLabel(status, locale)}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </ConfirmActionForm>
                ) : null}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            eyebrow={copy.appointments}
            title={copy.schedule}
            description={copy.appointmentsDescription}
          />

          <div className="mt-6 space-y-4">
            {treatment.appointments.length ? (
              treatment.appointments.map((appointment) => (
                <div key={appointment.id} className="rounded-3xl border border-line bg-white/70 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{appointment.reason || copy.noReason}</p>
                    <p className="mt-1 text-sm text-muted">{formatDateTime(appointment.scheduledAt)}</p>
                    <p className="mt-1 text-sm text-muted">{appointment.notes ?? copy.noAppointmentNotes}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={appointmentStatusTone(appointment.status)}>
                      {appointmentStatusLabel(appointment.status, locale)}
                    </Badge>
                      <Link
                      href={`/appointments/${appointment.id}/edit?redirectPath=${encodeURIComponent(`/treatments/${treatment.id}`)}`}
                      className={buttonStyles({ variant: "secondary", size: "sm" })}
                    >
                        {copy.editAppointment}
                      </Link>
                    </div>
                  </div>

                  <AppointmentStatusForm
                    action={updateAppointmentStatusAction}
                    appointmentId={appointment.id}
                    redirectPath={`/treatments/${treatment.id}`}
                    patientName={`${treatment.patient.firstName} ${treatment.patient.lastName}`}
                    currentStatus={appointment.status}
                    scheduledAt={appointment.scheduledAt}
                    submitLabel={copy.saveStatus}
                    pendingLabel={copy.saving}
                    className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]"
                    submitClassName="self-end"
                    fieldLabel={copy.updateStatus}
                  />
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-line bg-white/70 p-6 text-sm text-muted">
                {copy.noAppointments}
              </div>
            )}
          </div>
        </Card>
      </section>
    </main>
  );
}
