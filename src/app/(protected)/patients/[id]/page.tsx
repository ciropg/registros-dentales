import Link from "next/link";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress-bar";
import { appointmentStatusLabel, appointmentStatusTone, treatmentStatusLabel, treatmentStatusTone } from "@/lib/status";
import { formatDate, formatDateTime } from "@/lib/date";
import { toSearchParam } from "@/lib/utils";
import { getPatientDetail } from "@/modules/patients/queries";

export default async function PatientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const patient = await getPatientDetail(id);

  if (!patient) {
    notFound();
  }

  const success = toSearchParam(query.success);
  const error = toSearchParam(query.error);

  return (
    <main className="space-y-6 py-4 lg:py-8">
      <Topbar
        title={`${patient.firstName} ${patient.lastName}`}
        description="Ficha del paciente con tratamientos vinculados, avance por fases e historial de citas."
        action={
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/treatments/new?patientId=${patient.id}`}
              className={buttonStyles({ variant: "secondary" })}
            >
              Nuevo tratamiento
            </Link>
            <Link href={`/appointments/new?patientId=${patient.id}`} className={buttonStyles({})}>
              Nueva cita
            </Link>
          </div>
        }
      />

      {success ? <Alert message={success} tone="success" /> : null}
      {error ? <Alert message={error} tone="danger" /> : null}

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader eyebrow="Ficha" title="Datos del paciente" />
          <dl className="mt-6 grid gap-4 text-sm">
            <div className="rounded-2xl bg-violet-50/80 px-4 py-4">
              <dt className="text-muted">Documento</dt>
              <dd className="mt-1 font-semibold text-foreground">{patient.documentNumber ?? "--"}</dd>
            </div>
            <div className="rounded-2xl bg-violet-50/80 px-4 py-4">
              <dt className="text-muted">Telefono</dt>
              <dd className="mt-1 font-semibold text-foreground">{patient.phone ?? "--"}</dd>
            </div>
            <div className="rounded-2xl bg-violet-50/80 px-4 py-4">
              <dt className="text-muted">Email</dt>
              <dd className="mt-1 font-semibold text-foreground">{patient.email ?? "--"}</dd>
            </div>
            <div className="rounded-2xl bg-violet-50/80 px-4 py-4">
              <dt className="text-muted">Nacimiento</dt>
              <dd className="mt-1 font-semibold text-foreground">{formatDate(patient.birthDate)}</dd>
            </div>
          </dl>

          <div className="mt-6 rounded-3xl border border-line bg-white/70 p-5">
            <p className="text-sm font-semibold text-foreground">Notas</p>
            <p className="mt-3 text-sm leading-6 text-muted">
              {patient.notes ?? "Sin notas clinicas registradas."}
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader
            eyebrow="Tratamientos"
            title="Casos del paciente"
            description="Seguimiento por tratamiento con progreso, fechas y responsable."
          />

          <div className="mt-6 space-y-4">
            {patient.treatments.length ? (
              patient.treatments.map((treatment) => (
                <div key={treatment.id} className="rounded-3xl border border-line bg-white/70 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xl text-foreground">{treatment.title}</p>
                      <p className="mt-2 text-sm leading-6 text-muted">{treatment.diagnosis}</p>
                      <p className="mt-2 text-sm text-muted">
                        Responsable: {treatment.dentist?.name ?? "Sin asignar"}
                      </p>
                    </div>
                    <Badge tone={treatmentStatusTone(treatment.status)}>
                      {treatmentStatusLabel(treatment.status)}
                    </Badge>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-sm text-muted">
                      <span>Avance</span>
                      <span>{treatment.metrics.progressPercent}%</span>
                    </div>
                    <ProgressBar value={treatment.metrics.progressPercent} />
                  </div>

                  <div className="mt-5 grid gap-3 text-sm md:grid-cols-3">
                    <div className="rounded-2xl bg-violet-100/70 px-4 py-3">
                      <p className="font-semibold text-foreground">{treatment.metrics.daysElapsed} dias</p>
                      <p className="text-muted">Transcurridos</p>
                    </div>
                    <div className="rounded-2xl bg-violet-100/70 px-4 py-3">
                      <p className="font-semibold text-foreground">{treatment.metrics.daysRemaining} dias</p>
                      <p className="text-muted">Restantes</p>
                    </div>
                    <div className="rounded-2xl bg-violet-100/70 px-4 py-3">
                      <p className="font-semibold text-foreground">{treatment.appointments.length}</p>
                      <p className="text-muted">Citas asociadas</p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link href={`/treatments/${treatment.id}`} className={buttonStyles({})}>
                      Ver tratamiento
                    </Link>
                    <Link
                      href={`/appointments/new?patientId=${patient.id}&treatmentId=${treatment.id}`}
                      className={buttonStyles({ variant: "secondary" })}
                    >
                      Registrar cita
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="Sin tratamientos registrados"
                description="Crea un tratamiento para empezar a medir tiempos y progreso."
                action={
                  <Link href={`/treatments/new?patientId=${patient.id}`} className={buttonStyles({})}>
                    Crear tratamiento
                  </Link>
                }
              />
            )}
          </div>
        </Card>
      </section>

      <Card>
        <CardHeader
          eyebrow="Citas"
          title="Historial reciente"
          description="Ultimas citas asociadas al paciente y su estado."
        />

        <div className="mt-6 space-y-3">
          {patient.appointments.length ? (
            patient.appointments.map((appointment) => (
              <div key={appointment.id} className="rounded-2xl border border-line bg-white/70 px-4 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{appointment.reason}</p>
                    <p className="mt-1 text-sm text-muted">{formatDateTime(appointment.scheduledAt)}</p>
                  </div>
                  <Badge tone={appointmentStatusTone(appointment.status)}>
                    {appointmentStatusLabel(appointment.status)}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="Sin citas registradas"
              description="La agenda del paciente aun no tiene eventos."
              action={
                <Link href={`/appointments/new?patientId=${patient.id}`} className={buttonStyles({})}>
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
