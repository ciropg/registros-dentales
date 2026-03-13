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
import { getCurrentLocale } from "@/lib/i18n/server";
import { canCreateTreatments, canManagePatients } from "@/lib/roles";
import { getDashboardData } from "@/modules/dashboard/queries";

export default async function DashboardPage() {
  const [user, locale] = await Promise.all([requireUser(), getCurrentLocale()]);
  const data = await getDashboardData(user.isDemo, locale);
  const showNewPatientAction = canManagePatients(user.role);
  const showNewTreatmentAction = canCreateTreatments(user.role);
  const copy = locale === "en"
    ? {
        title: "Clinical dashboard",
        description: "Operational view to monitor active treatments, progress percentage, and daily schedule.",
        newPatient: "New patient",
        newTreatment: "New treatment",
        newAppointment: "New appointment",
        activeTreatments: "Active treatments",
        activeTreatmentsHelper: "Cases in progress or pending closure in your scope.",
        todayAppointments: "Today appointments",
        todayAppointmentsHelper: "Total appointments scheduled for today in your environment.",
        todayNoShows: "Today no-shows",
        todayNoShowsHelper: "Today appointments marked as no-show and requiring follow-up.",
        todayRescheduled: "Today rescheduled",
        todayRescheduledHelper: "Today appointments moved to another date during daily operations.",
        treatmentsEyebrow: "Treatments",
        treatmentsTitle: "Active tracking",
        treatmentsDescription: "Each card summarizes elapsed time, remaining time, and phase progress.",
        noActiveTitle: "No active treatments",
        noActiveDescription: "Create a treatment to start monitoring progress.",
        createTreatment: "Create treatment",
        agendaTitle: "Today schedule",
        agendaDescription: "Appointments scheduled for today with their current status.",
        alertsEyebrow: "Alerts",
        alertsTitle: "Treatments nearing deadline",
        alertsDescription: "Cases with an estimated end date within the next seven days.",
        progress: "Progress",
        remaining: "Remaining",
        estimatedDate: "Estimated date",
        openTreatment: "Open treatment",
        noAlertsTitle: "No immediate alerts",
        noAlertsDescription: "There are no treatments with an estimated closing date inside the current window.",
      }
    : {
        title: "Dashboard clinico",
        description: "Vista operativa para monitorear tratamientos activos, porcentaje de avance y agenda diaria.",
        newPatient: "Nuevo paciente",
        newTreatment: "Nuevo tratamiento",
        newAppointment: "Nueva cita",
        activeTreatments: "Tratamientos activos",
        activeTreatmentsHelper: "Casos visibles en curso o pendientes de cierre.",
        todayAppointments: "Citas de hoy",
        todayAppointmentsHelper: "Total de citas programadas para hoy en tu entorno.",
        todayNoShows: "No asistencias de hoy",
        todayNoShowsHelper: "Citas de hoy marcadas como no asistio y requieren seguimiento.",
        todayRescheduled: "Reprogramadas hoy",
        todayRescheduledHelper: "Citas de hoy movidas a otra fecha dentro de la operacion diaria.",
        treatmentsEyebrow: "Tratamientos",
        treatmentsTitle: "Seguimiento activo",
        treatmentsDescription: "Cada tarjeta resume tiempo transcurrido, tiempo restante y progreso por fases.",
        noActiveTitle: "Sin tratamientos activos",
        noActiveDescription: "Crea un tratamiento para empezar a monitorear su avance.",
        createTreatment: "Crear tratamiento",
        agendaTitle: "Agenda del dia",
        agendaDescription: "Citas agendadas para hoy con su estado actual.",
        alertsEyebrow: "Alertas",
        alertsTitle: "Tratamientos por vencer",
        alertsDescription: "Casos cuya fecha estimada de fin cae dentro de los proximos siete dias.",
        progress: "Avance",
        remaining: "Restante",
        estimatedDate: "Fecha estimada",
        openTreatment: "Abrir tratamiento",
        noAlertsTitle: "Sin alertas inmediatas",
        noAlertsDescription: "No hay tratamientos con fecha estimada de cierre dentro de la ventana actual.",
      };

  return (
    <main className="space-y-6 py-4 lg:py-8">
      <Topbar
        title={copy.title}
        description={copy.description}
        locale={locale}
        action={
          <div className="flex flex-wrap gap-3">
            {showNewPatientAction ? (
              <Link href="/patients/new" className={buttonStyles({ variant: "secondary" })}>
                {copy.newPatient}
              </Link>
            ) : null}
            {showNewTreatmentAction ? (
              <Link href="/treatments/new" className={buttonStyles({ variant: "secondary" })}>
                {copy.newTreatment}
              </Link>
            ) : null}
            <Link href="/appointments/new" className={buttonStyles({})}>
              {copy.newAppointment}
            </Link>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={copy.activeTreatments}
          value={data.stats.activeTreatments}
          helper={copy.activeTreatmentsHelper}
        />
        <MetricCard
          label={copy.todayAppointments}
          value={data.stats.todayAppointments}
          helper={copy.todayAppointmentsHelper}
        />
        <MetricCard
          label={copy.todayNoShows}
          value={data.stats.noShowAppointments}
          helper={copy.todayNoShowsHelper}
        />
        <MetricCard
          label={copy.todayRescheduled}
          value={data.stats.rescheduledAppointments}
          helper={copy.todayRescheduledHelper}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader
            eyebrow={copy.treatmentsEyebrow}
            title={copy.treatmentsTitle}
            description={copy.treatmentsDescription}
          />

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {data.activeTreatments.length ? (
              data.activeTreatments.map((treatment) => (
                <TreatmentOverviewCard key={treatment.id} treatment={treatment} locale={locale} />
              ))
            ) : (
              <div className="md:col-span-2">
                <EmptyState
                  title={copy.noActiveTitle}
                  description={copy.noActiveDescription}
                  action={showNewTreatmentAction ? (
                    <Link href="/treatments/new" className={buttonStyles({})}>
                      {copy.createTreatment}
                    </Link>
                  ) : undefined}
                />
              </div>
            )}
          </div>
        </Card>

        <AppointmentList
          title={copy.agendaTitle}
          description={copy.agendaDescription}
          appointments={data.todayAppointments}
          locale={locale}
        />
      </section>

      <Card>
        <CardHeader
          eyebrow={copy.alertsEyebrow}
          title={copy.alertsTitle}
          description={copy.alertsDescription}
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
                    <p className="text-muted">{copy.progress}</p>
                  </div>
                  <div className="rounded-2xl bg-violet-100/70 px-4 py-3">
                    <p className="font-semibold text-foreground">{daysLabel(treatment.daysRemaining, locale)}</p>
                    <p className="text-muted">{copy.remaining}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted">
                  {copy.estimatedDate}: {formatDate(new Date(Date.now() + treatment.daysRemaining * 86400000))}
                </p>
                <Link
                  href={`/treatments/${treatment.id}`}
                  className="mt-4 inline-flex text-sm font-semibold text-brand"
                >
                  {copy.openTreatment}
                </Link>
              </div>
            ))
          ) : (
            <div className="lg:col-span-3">
              <EmptyState
                title={copy.noAlertsTitle}
                description={copy.noAlertsDescription}
              />
            </div>
          )}
        </div>
      </Card>
    </main>
  );
}
