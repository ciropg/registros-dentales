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
  const user = await requireUser();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const treatment = await getTreatmentDetail(id, user.isDemo);
  const canEditTreatmentData = canCreateTreatments(user.role);
  const canEditPhases = canUpdateTreatmentPhases(user.role);

  if (!treatment) {
    notFound();
  }

  const success = toSearchParam(query.success);
  const error = toSearchParam(query.error);
  const appointmentUpdatedMessage = success === "Cita actualizada correctamente." ? success : undefined;
  const successAlertMessage = success && success !== appointmentUpdatedMessage ? success : undefined;

  return (
    <main className="space-y-6 py-4 lg:py-8">
      <Topbar
        title={treatment.title}
        description="Detalle del tratamiento con metricas de tiempo, progreso por fases y citas asociadas."
        action={
          <div className="flex flex-wrap gap-3">
            {canEditTreatmentData ? (
              <Link
                href={`/treatments/${treatment.id}/edit`}
                className={buttonStyles({ variant: "secondary" })}
              >
                Editar tratamiento
              </Link>
            ) : null}
            <Link
              href={`/patients/${treatment.patientId}`}
              className={buttonStyles({ variant: "secondary" })}
            >
              Ver paciente
            </Link>
            <Link
              href={`/appointments/new?patientId=${treatment.patientId}&treatmentId=${treatment.id}`}
              className={buttonStyles({})}
            >
              Nueva cita
            </Link>
          </div>
        }
      />

      <SearchParamFeedbackModal
        message={appointmentUpdatedMessage}
        queryKey="success"
        title={appointmentUpdatedMessage ?? "Operacion completada"}
        description="La cita vinculada al tratamiento fue actualizada correctamente."
      />
      {successAlertMessage ? <Alert message={successAlertMessage} tone="success" /> : null}
      {error ? <Alert message={error} tone="danger" /> : null}

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader eyebrow="Resumen" title="Contexto clinico" />

          <div className="mt-6 flex flex-wrap gap-3">
            <Badge tone={treatmentStatusTone(treatment.status)}>
              {treatmentStatusLabel(treatment.status)}
            </Badge>
            <Badge tone="brand">
              {treatment.patient.firstName} {treatment.patient.lastName}
            </Badge>
          </div>

          <p className="mt-6 text-sm leading-7 text-muted">
            {treatment.diagnosis || "Sin diagnostico clinico registrado."}
          </p>

          <dl className="mt-6 grid gap-3 text-sm">
            <div className="rounded-2xl bg-violet-50/80 px-4 py-4">
              <dt className="text-muted">Responsable</dt>
              <dd className="mt-1 font-semibold text-foreground">
                {treatment.dentist?.name ?? "Sin asignar"}
              </dd>
            </div>
            <div className="rounded-2xl bg-violet-50/80 px-4 py-4">
              <dt className="text-muted">Inicio</dt>
              <dd className="mt-1 font-semibold text-foreground">{formatDate(treatment.startDate)}</dd>
            </div>
            <div className="rounded-2xl bg-violet-50/80 px-4 py-4">
              <dt className="text-muted">Fin estimado</dt>
              <dd className="mt-1 font-semibold text-foreground">
                {formatDate(treatment.estimatedEndDate)}
              </dd>
            </div>
            <div className="rounded-2xl bg-violet-50/80 px-4 py-4">
              <dt className="text-muted">Cierre real</dt>
              <dd className="mt-1 font-semibold text-foreground">{formatDate(treatment.actualEndDate)}</dd>
            </div>
          </dl>

          <div className="mt-6 rounded-3xl border border-line bg-white/70 p-5">
            <p className="text-sm font-semibold text-foreground">Notas</p>
            <p className="mt-3 text-sm leading-6 text-muted">{treatment.notes ?? "Sin notas operativas."}</p>
          </div>
        </Card>

        <Card>
          <CardHeader
            eyebrow="Metricas"
            title="Rendimiento del tratamiento"
            description="Indicadores clave para seguimiento clinico y operativo."
          />

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-sm text-muted">
              <span>Porcentaje de avance</span>
              <span>{treatment.metrics.progressPercent}%</span>
            </div>
            <ProgressBar value={treatment.metrics.progressPercent} />
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-3xl bg-violet-50/80 p-5">
              <p className="text-sm text-muted">Tiempo transcurrido</p>
              <p className="mt-2 text-3xl text-foreground">{treatment.metrics.daysElapsed}</p>
              <p className="text-sm text-muted">dias</p>
            </div>
            <div className="rounded-3xl bg-violet-50/80 p-5">
              <p className="text-sm text-muted">Tiempo restante</p>
              <p className="mt-2 text-3xl text-foreground">{treatment.metrics.daysRemaining}</p>
              <p className="text-sm text-muted">dias</p>
            </div>
            <div className="rounded-3xl bg-violet-50/80 p-5">
              <p className="text-sm text-muted">Citas asistidas</p>
              <p className="mt-2 text-3xl text-foreground">{treatment.metrics.attendedCount}</p>
            </div>
            <div className="rounded-3xl bg-violet-50/80 p-5">
              <p className="text-sm text-muted">No asistidas</p>
              <p className="mt-2 text-3xl text-foreground">{treatment.metrics.noShowCount}</p>
            </div>
            <div className="rounded-3xl bg-violet-50/80 p-5">
              <p className="text-sm text-muted">Reprogramadas</p>
              <p className="mt-2 text-3xl text-foreground">{treatment.metrics.rescheduledCount}</p>
            </div>
            <div className="rounded-3xl bg-violet-50/80 p-5">
              <p className="text-sm text-muted">Canceladas</p>
              <p className="mt-2 text-3xl text-foreground">{treatment.metrics.canceledCount}</p>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader
            eyebrow="Fases"
            title="Actualizar progreso"
            description={
              canEditPhases
                ? "Cada cambio recalcula automaticamente el porcentaje global del tratamiento."
                : "Este perfil puede consultar las fases, pero no actualizar su estado."
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
                      Peso {phase.weight} | Fecha planificada {formatDate(phase.plannedDate)}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Finalizada {formatDate(phase.completedDate)}
                    </p>
                  </div>
                  <Badge tone={phaseStatusTone(phase.status)}>{phaseStatusLabel(phase.status)}</Badge>
                </div>

                {canEditPhases ? (
                  <ConfirmActionForm
                    action={updatePhaseStatusAction}
                    className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]"
                    hiddenFields={[
                      { name: "treatmentId", value: treatment.id },
                      { name: "phaseId", value: phase.id },
                    ]}
                    submitLabel="Actualizar fase"
                    pendingLabel="Actualizando..."
                    submitClassName="self-end"
                    confirmTitle="Confirmar actualizacion de fase"
                    confirmDescription={`Se actualizara la fase ${phase.phaseOrder}. ${phase.name} al estado seleccionado.`}
                    confirmButtonLabel="Si, actualizar"
                  >
                    <Field label="Nuevo estado">
                      <select className={selectClassName} name="status" defaultValue={phase.status}>
                        {phaseOptions.map((status) => (
                          <option key={status} value={status}>
                            {phaseStatusLabel(status)}
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
            eyebrow="Citas"
            title="Agenda del tratamiento"
            description="Marca asistencias, no asistencias o cancelaciones sin salir del detalle."
          />

          <div className="mt-6 space-y-4">
            {treatment.appointments.length ? (
              treatment.appointments.map((appointment) => (
                <div key={appointment.id} className="rounded-3xl border border-line bg-white/70 p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{appointment.reason || "Sin motivo registrado."}</p>
                      <p className="mt-1 text-sm text-muted">{formatDateTime(appointment.scheduledAt)}</p>
                      <p className="mt-1 text-sm text-muted">{appointment.notes ?? "Sin notas."}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={appointmentStatusTone(appointment.status)}>
                        {appointmentStatusLabel(appointment.status)}
                      </Badge>
                      <Link
                        href={`/appointments/${appointment.id}/edit?redirectPath=${encodeURIComponent(`/treatments/${treatment.id}`)}`}
                        className={buttonStyles({ variant: "secondary", size: "sm" })}
                      >
                        Editar cita
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
                    submitLabel="Guardar estado"
                    pendingLabel="Guardando..."
                    className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]"
                    submitClassName="self-end"
                    fieldLabel="Actualizar estado"
                  />
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-line bg-white/70 p-6 text-sm text-muted">
                Este tratamiento aun no tiene citas asociadas.
              </div>
            )}
          </div>
        </Card>
      </section>
    </main>
  );
}
