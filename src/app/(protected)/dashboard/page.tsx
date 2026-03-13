import Link from "next/link";
import { AppointmentList } from "@/components/dashboard/appointment-list";
import { MetricCard } from "@/components/dashboard/metric-card";
import { TreatmentOverviewCard } from "@/components/dashboard/treatment-overview-card";
import { Topbar } from "@/components/layout/topbar";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { daysLabel, formatDate } from "@/lib/date";
import { requireUser } from "@/lib/auth";
import { canCreateTreatments, canManagePatients } from "@/lib/roles";
import { getDashboardData } from "@/modules/dashboard/queries";

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboardData(user.isDemo);
  const showNewPatientAction = canManagePatients(user.role);
  const showNewTreatmentAction = canCreateTreatments(user.role);

  return (
    <main className="space-y-6 py-4 lg:py-8">
      <Topbar
        title="Dashboard clinico"
        description="Vista operativa para monitorear tratamientos activos, porcentaje de avance y agenda diaria."
        action={
          <div className="flex flex-wrap gap-3">
            {showNewPatientAction ? (
              <Link href="/patients/new" className={buttonStyles({ variant: "secondary" })}>
                Nuevo paciente
              </Link>
            ) : null}
            {showNewTreatmentAction ? (
              <Link href="/treatments/new" className={buttonStyles({ variant: "secondary" })}>
                Nuevo tratamiento
              </Link>
            ) : null}
            <Link href="/appointments/new" className={buttonStyles({})}>
              Nueva cita
            </Link>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Tratamientos activos"
          value={data.stats.activeTreatments}
          helper="Casos visibles en curso o pendientes de cierre."
        />
        <MetricCard
          label="Citas de hoy"
          value={data.stats.todayAppointments}
          helper="Total de citas programadas para hoy en tu entorno."
        />
        <MetricCard
          label="No asistencias de hoy"
          value={data.stats.noShowAppointments}
          helper="Citas de hoy marcadas como no asistio y requieren seguimiento."
        />
        <MetricCard
          label="Reprogramadas hoy"
          value={data.stats.rescheduledAppointments}
          helper="Citas de hoy movidas a otra fecha dentro de la operacion diaria."
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader
            eyebrow="Tratamientos"
            title="Seguimiento activo"
            description="Cada tarjeta resume tiempo transcurrido, tiempo restante y progreso por fases."
          />

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {data.activeTreatments.length ? (
              data.activeTreatments.map((treatment) => (
                <TreatmentOverviewCard key={treatment.id} treatment={treatment} />
              ))
            ) : (
              <div className="md:col-span-2">
                <EmptyState
                  title="Sin tratamientos activos"
                  description="Crea un tratamiento para empezar a monitorear su avance."
                  action={showNewTreatmentAction ? (
                    <Link href="/treatments/new" className={buttonStyles({})}>
                      Crear tratamiento
                    </Link>
                  ) : undefined}
                />
              </div>
            )}
          </div>
        </Card>

        <AppointmentList
          title="Agenda del dia"
          description="Citas agendadas para hoy con su estado actual."
          appointments={data.todayAppointments}
        />
      </section>

      <Card>
        <CardHeader
          eyebrow="Alertas"
          title="Tratamientos por vencer"
          description="Casos cuya fecha estimada de fin cae dentro de los proximos siete dias."
        />

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {data.dueSoonTreatments.length ? (
            data.dueSoonTreatments.map((treatment) => (
              <div key={treatment.id} className="rounded-3xl border border-line bg-white/70 p-5">
                <p className="text-sm font-semibold text-foreground">{treatment.title}</p>
                <p className="mt-1 text-sm text-muted">{treatment.patientName}</p>
                <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
                  <div className="rounded-2xl bg-violet-100/70 px-4 py-3">
                    <p className="font-semibold text-foreground">{treatment.progressPercent}%</p>
                    <p className="text-muted">Avance</p>
                  </div>
                  <div className="rounded-2xl bg-violet-100/70 px-4 py-3">
                    <p className="font-semibold text-foreground">{daysLabel(treatment.daysRemaining)}</p>
                    <p className="text-muted">Restante</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted">
                  Fecha estimada: {formatDate(new Date(Date.now() + treatment.daysRemaining * 86400000))}
                </p>
                <Link
                  href={`/treatments/${treatment.id}`}
                  className="mt-4 inline-flex text-sm font-semibold text-brand"
                >
                  Abrir tratamiento
                </Link>
              </div>
            ))
          ) : (
            <div className="lg:col-span-3">
              <EmptyState
                title="Sin alertas inmediatas"
                description="No hay tratamientos con fecha estimada de cierre dentro de la ventana actual."
              />
            </div>
          )}
        </div>
      </Card>
    </main>
  );
}
