import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { DeletePatientForm } from "@/components/patients/delete-patient-form";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { inputClassName } from "@/components/ui/field";
import { Pagination } from "@/components/ui/pagination";
import { ProgressBar } from "@/components/ui/progress-bar";
import { requireUser } from "@/lib/auth";
import { daysLabel, formatDate } from "@/lib/date";
import { getCurrentLocale } from "@/lib/i18n/server";
import { canCreateTreatments, canManagePatients } from "@/lib/roles";
import { treatmentStatusLabel, treatmentStatusTone } from "@/lib/status";
import { toPositiveIntSearchParam, toSearchParam } from "@/lib/utils";
import { deletePatientAction } from "@/modules/patients/actions";
import { listPatients } from "@/modules/patients/queries";

function buildPatientsPageHref(search: string | undefined, page: number) {
  const params = new URLSearchParams();

  if (search) {
    params.set("q", search);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return query ? `/patients?${query}` : "/patients";
}

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const [user, locale] = await Promise.all([requireUser(), getCurrentLocale()]);
  const q = toSearchParam(params.q);
  const requestedPage = toPositiveIntSearchParam(params.page);
  const success = toSearchParam(params.success);
  const error = toSearchParam(params.error);
  const patients = await listPatients(user.isDemo, q, requestedPage);
  const showPatientManagementActions = canManagePatients(user.role);
  const showTreatmentCreateActions = canCreateTreatments(user.role);
  const copy = locale === "en"
    ? {
        title: "Patients",
        description: "Quick patient lookup with appointment summary and active treatment status.",
        newPatient: "New patient",
        filterEyebrow: "Filter",
        filterTitle: "Find patient",
        filterDescription: "Search by first name, last name, or document.",
        searchPlaceholder: "Example: Mario or 70214488",
        search: "Search",
        document: "ID",
        phone: "Phone",
        birthDate: "Birth date",
        appointments: "appointments",
        treatments: "treatments",
        activeTreatment: "Active treatment with phase-based tracking",
        progress: "Progress",
        elapsedTime: "Elapsed time",
        remainingTime: "Remaining time",
        days: "days",
        noActiveTreatment: "This patient does not have an active treatment yet.",
        viewDetails: "View details",
        edit: "Edit",
        newTreatment: "New treatment",
        emptyTitle: "No patients",
        emptyDescription: "There are no patients matching the current search yet.",
        createFirstPatient: "Create first patient",
        itemLabel: "patients",
      }
    : {
        title: "Pacientes",
        description: "Busqueda rapida de pacientes con resumen de citas y estado del tratamiento activo.",
        newPatient: "Nuevo paciente",
        filterEyebrow: "Filtro",
        filterTitle: "Buscar paciente",
        filterDescription: "Busca por nombre, apellido o documento.",
        searchPlaceholder: "Ejemplo: Mario o 70214488",
        search: "Buscar",
        document: "Doc",
        phone: "Telefono",
        birthDate: "Nacimiento",
        appointments: "citas",
        treatments: "tratamientos",
        activeTreatment: "Tratamiento activo con seguimiento por fases",
        progress: "Avance",
        elapsedTime: "Tiempo transcurrido",
        remainingTime: "Tiempo restante",
        days: "dias",
        noActiveTreatment: "Este paciente aun no tiene un tratamiento activo registrado.",
        viewDetails: "Ver detalle",
        edit: "Editar",
        newTreatment: "Nuevo tratamiento",
        emptyTitle: "No hay pacientes",
        emptyDescription: "Todavia no existen pacientes que coincidan con la busqueda.",
        createFirstPatient: "Crear primer paciente",
        itemLabel: "pacientes",
      };

  return (
    <main className="space-y-6 py-4 lg:py-8">
      <Topbar
        title={copy.title}
        description={copy.description}
        locale={locale}
        action={showPatientManagementActions ? (
          <Link href="/patients/new" className={buttonStyles({})}>
            {copy.newPatient}
          </Link>
        ) : undefined}
      />

      {success ? <Alert message={success} tone="success" /> : null}
      {error ? <Alert message={error} tone="danger" /> : null}

      <Card>
        <CardHeader
          eyebrow={copy.filterEyebrow}
          title={copy.filterTitle}
          description={copy.filterDescription}
        />

        <form className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            className={inputClassName}
            name="q"
            defaultValue={q}
            placeholder={copy.searchPlaceholder}
          />
          <button type="submit" className={buttonStyles({ variant: "secondary" })}>
            {copy.search}
          </button>
        </form>
      </Card>

      <section className="grid gap-4 xl:grid-cols-2">
        {patients.items.length ? (
          patients.items.map((patient) => (
            <Card key={patient.id} className="bg-white/80">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-2xl text-foreground">
                    {patient.firstName} {patient.lastName}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted">
                    <span>{copy.document}: {patient.documentNumber ?? "--"}</span>
                    <span>{copy.phone}: {patient.phone ?? "--"}</span>
                    <span>{copy.birthDate}: {formatDate(patient.birthDate)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge tone="neutral">{patient._count.appointments} {copy.appointments}</Badge>
                  <Badge tone="brand">{patient.treatments.length} {copy.treatments}</Badge>
                </div>
              </div>

              {patient.activeTreatment ? (
                <div className="mt-6 rounded-3xl border border-line bg-violet-50/80 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{patient.activeTreatment.title}</p>
                      <p className="mt-1 text-sm text-muted">
                        {copy.activeTreatment}
                      </p>
                    </div>
                    <Badge tone={treatmentStatusTone(patient.activeTreatment.status)}>
                      {treatmentStatusLabel(patient.activeTreatment.status, locale)}
                    </Badge>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-sm text-muted">
                      <span>{copy.progress}</span>
                      <span>{patient.activeTreatment.progressPercent}%</span>
                    </div>
                    <ProgressBar value={patient.activeTreatment.progressPercent} />
                  </div>

                  <div className="mt-5 grid gap-3 text-sm text-muted md:grid-cols-2">
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="font-semibold text-foreground">
                        {patient.activeTreatment.daysElapsed} {copy.days}
                      </p>
                      <p>{copy.elapsedTime}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="font-semibold text-foreground">
                        {daysLabel(patient.activeTreatment.daysRemaining, locale)}
                      </p>
                      <p>{copy.remainingTime}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-3xl border border-dashed border-line bg-white/70 p-5 text-sm text-muted">
                  {copy.noActiveTreatment}
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={`/patients/${patient.id}`} className={buttonStyles({})}>
                  {copy.viewDetails}
                </Link>
                {showPatientManagementActions ? (
                  <Link
                    href={`/patients/${patient.id}/edit`}
                    className={buttonStyles({ variant: "secondary" })}
                  >
                    {copy.edit}
                  </Link>
                ) : null}
                {showTreatmentCreateActions ? (
                  <Link
                    href={`/treatments/new?patientId=${patient.id}`}
                    className={buttonStyles({ variant: "ghost" })}
                  >
                    {copy.newTreatment}
                  </Link>
                ) : null}
                {showPatientManagementActions ? (
                  <DeletePatientForm
                    patientId={patient.id}
                    patientName={`${patient.firstName} ${patient.lastName}`}
                    treatmentCount={patient.treatments.length}
                    appointmentCount={patient._count.appointments}
                    photoCount={patient._count.photos}
                    action={deletePatientAction}
                  />
                ) : null}
              </div>
            </Card>
          ))
        ) : (
          <div className="xl:col-span-2">
            <EmptyState
              title={copy.emptyTitle}
              description={copy.emptyDescription}
              action={showPatientManagementActions ? (
                <Link href="/patients/new" className={buttonStyles({})}>
                  {copy.createFirstPatient}
                </Link>
              ) : undefined}
            />
          </div>
        )}
      </section>

      {patients.totalPages > 1 ? (
        <Pagination
          currentPage={patients.page}
          totalPages={patients.totalPages}
          totalCount={patients.totalCount}
          pageSize={patients.pageSize}
          currentCount={patients.items.length}
          itemLabel={copy.itemLabel}
          locale={locale}
          prevHref={patients.page > 1 ? buildPatientsPageHref(q, patients.page - 1) : undefined}
          nextHref={
            patients.page < patients.totalPages ? buildPatientsPageHref(q, patients.page + 1) : undefined
          }
        />
      ) : null}
    </main>
  );
}
