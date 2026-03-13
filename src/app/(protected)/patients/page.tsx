import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { DeletePatientForm } from "@/components/patients/delete-patient-form";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { inputClassName } from "@/components/ui/field";
import { ProgressBar } from "@/components/ui/progress-bar";
import { requireUser } from "@/lib/auth";
import { daysLabel, formatDate } from "@/lib/date";
import { canCreateTreatments, canManagePatients } from "@/lib/roles";
import { treatmentStatusLabel, treatmentStatusTone } from "@/lib/status";
import { toSearchParam } from "@/lib/utils";
import { deletePatientAction } from "@/modules/patients/actions";
import { listPatients } from "@/modules/patients/queries";

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const user = await requireUser();
  const q = toSearchParam(params.q);
  const success = toSearchParam(params.success);
  const error = toSearchParam(params.error);
  const patients = await listPatients(user.isDemo, q);
  const showPatientManagementActions = canManagePatients(user.role);
  const showTreatmentCreateActions = canCreateTreatments(user.role);

  return (
    <main className="space-y-6 py-4 lg:py-8">
      <Topbar
        title="Pacientes"
        description="Busqueda rapida de pacientes con resumen de citas y estado del tratamiento activo."
        action={showPatientManagementActions ? (
          <Link href="/patients/new" className={buttonStyles({})}>
            Nuevo paciente
          </Link>
        ) : undefined}
      />

      {success ? <Alert message={success} tone="success" /> : null}
      {error ? <Alert message={error} tone="danger" /> : null}

      <Card>
        <CardHeader
          eyebrow="Filtro"
          title="Buscar paciente"
          description="Busca por nombre, apellido o documento."
        />

        <form className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            className={inputClassName}
            name="q"
            defaultValue={q}
            placeholder="Ejemplo: Mario o 70214488"
          />
          <button type="submit" className={buttonStyles({ variant: "secondary" })}>
            Buscar
          </button>
        </form>
      </Card>

      <section className="grid gap-4 xl:grid-cols-2">
        {patients.length ? (
          patients.map((patient) => (
            <Card key={patient.id} className="bg-white/80">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-2xl text-foreground">
                    {patient.firstName} {patient.lastName}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted">
                    <span>Doc: {patient.documentNumber ?? "--"}</span>
                    <span>Telefono: {patient.phone ?? "--"}</span>
                    <span>Nacimiento: {formatDate(patient.birthDate)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge tone="neutral">{patient._count.appointments} citas</Badge>
                  <Badge tone="brand">{patient.treatments.length} tratamientos</Badge>
                </div>
              </div>

              {patient.activeTreatment ? (
                <div className="mt-6 rounded-3xl border border-line bg-violet-50/80 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{patient.activeTreatment.title}</p>
                      <p className="mt-1 text-sm text-muted">
                        Tratamiento activo con seguimiento por fases
                      </p>
                    </div>
                    <Badge tone={treatmentStatusTone(patient.activeTreatment.status)}>
                      {treatmentStatusLabel(patient.activeTreatment.status)}
                    </Badge>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-sm text-muted">
                      <span>Avance</span>
                      <span>{patient.activeTreatment.progressPercent}%</span>
                    </div>
                    <ProgressBar value={patient.activeTreatment.progressPercent} />
                  </div>

                  <div className="mt-5 grid gap-3 text-sm text-muted md:grid-cols-2">
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="font-semibold text-foreground">
                        {patient.activeTreatment.daysElapsed} dias
                      </p>
                      <p>Tiempo transcurrido</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="font-semibold text-foreground">
                        {daysLabel(patient.activeTreatment.daysRemaining)}
                      </p>
                      <p>Tiempo restante</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-3xl border border-dashed border-line bg-white/70 p-5 text-sm text-muted">
                  Este paciente aun no tiene un tratamiento activo registrado.
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={`/patients/${patient.id}`} className={buttonStyles({})}>
                  Ver detalle
                </Link>
                {showPatientManagementActions ? (
                  <Link
                    href={`/patients/${patient.id}/edit`}
                    className={buttonStyles({ variant: "secondary" })}
                  >
                    Editar
                  </Link>
                ) : null}
                {showTreatmentCreateActions ? (
                  <Link
                    href={`/treatments/new?patientId=${patient.id}`}
                    className={buttonStyles({ variant: "ghost" })}
                  >
                    Nuevo tratamiento
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
              title="No hay pacientes"
              description="Todavia no existen pacientes que coincidan con la busqueda."
              action={showPatientManagementActions ? (
                <Link href="/patients/new" className={buttonStyles({})}>
                  Crear primer paciente
                </Link>
              ) : undefined}
            />
          </div>
        )}
      </section>
    </main>
  );
}
