import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { DeletePatientForm } from "@/components/patients/delete-patient-form";
import { PatientPhotoUploadForm } from "@/components/patients/patient-photo-upload-form";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConfirmActionForm } from "@/components/ui/confirm-action-form";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SearchParamFeedbackModal } from "@/components/ui/search-param-feedback-modal";
import { canCreateTreatments, canManagePatients } from "@/lib/roles";
import { appointmentStatusLabel, appointmentStatusTone, treatmentStatusLabel, treatmentStatusTone } from "@/lib/status";
import { formatDate, formatDateTime } from "@/lib/date";
import { toSearchParam } from "@/lib/utils";
import { deletePatientAction, deletePatientPhotoAction, uploadPatientPhotoAction } from "@/modules/patients/actions";
import { getPatientDetail } from "@/modules/patients/queries";

export default async function PatientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireUser();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const patient = await getPatientDetail(id, viewer.isDemo);

  if (!patient) {
    notFound();
  }

  const success = toSearchParam(query.success);
  const error = toSearchParam(query.error);
  const appointmentUpdatedMessage = success === "Cita actualizada correctamente." ? success : undefined;
  const successAlertMessage = success && success !== appointmentUpdatedMessage ? success : undefined;
  const showPatientManagementActions = canManagePatients(viewer.role);
  const showTreatmentCreateActions = canCreateTreatments(viewer.role);

  return (
    <main className="space-y-6 py-4 lg:py-8">
      <Topbar
        title={`${patient.firstName} ${patient.lastName}`}
        description="Ficha del paciente con tratamientos vinculados, avance por fases e historial de citas."
        action={
          <div className="flex flex-wrap gap-3">
            {showPatientManagementActions ? (
              <Link href={`/patients/${patient.id}/edit`} className={buttonStyles({ variant: "secondary" })}>
                Editar paciente
              </Link>
            ) : null}
            {showTreatmentCreateActions ? (
              <Link
                href={`/treatments/new?patientId=${patient.id}`}
                className={buttonStyles({ variant: "secondary" })}
              >
                Nuevo tratamiento
              </Link>
            ) : null}
            <Link href={`/appointments/new?patientId=${patient.id}`} className={buttonStyles({})}>
              Nueva cita
            </Link>
            {showPatientManagementActions ? (
              <DeletePatientForm
                patientId={patient.id}
                patientName={`${patient.firstName} ${patient.lastName}`}
                treatmentCount={patient.treatments.length}
                appointmentCount={patient.appointments.length}
                photoCount={patient.photos.length}
                action={deletePatientAction}
              />
            ) : null}
          </div>
        }
      />

      <SearchParamFeedbackModal
        message={appointmentUpdatedMessage}
        queryKey="success"
        title={appointmentUpdatedMessage ?? "Operacion completada"}
        description="La cita del paciente fue actualizada correctamente."
      />
      {successAlertMessage ? <Alert message={successAlertMessage} tone="success" /> : null}
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
                      <p className="mt-2 text-sm leading-6 text-muted">
                        {treatment.diagnosis || "Sin diagnostico clinico registrado."}
                      </p>
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
                action={showTreatmentCreateActions ? (
                  <Link href={`/treatments/new?patientId=${patient.id}`} className={buttonStyles({})}>
                    Crear tratamiento
                  </Link>
                ) : undefined}
              />
            )}
          </div>
        </Card>
      </section>

      <Card>
        <CardHeader
          eyebrow="Fotos"
          title="Adjuntos del paciente"
          description={
            viewer.isDemo
              ? `Espacio compartido demo: ${patient.photoUsageCount}/5 fotos en uso. Al subir una nueva, se elimina la foto demo mas antigua si el limite ya esta lleno.`
              : "Adjunta fotos clinicas del paciente y conservalas en el entorno real."
          }
          action={
            <PatientPhotoUploadForm patientId={patient.id} action={uploadPatientPhotoAction} />
          }
        />

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {patient.photos.length ? (
            patient.photos.map((photo) => (
              <div key={photo.id} className="overflow-hidden rounded-3xl border border-line bg-white/70">
                <div className="relative aspect-square">
                  <Image
                    src={photo.secureUrl}
                    alt={`Foto de ${patient.firstName} ${patient.lastName}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="space-y-2 p-4 text-sm">
                  <p className="font-semibold text-foreground">{photo.originalFilename ?? "Foto clinica"}</p>
                  <p className="text-muted">{photo.description ?? "Sin descripcion."}</p>
                  <p className="text-muted">Subida: {formatDateTime(photo.createdAt)}</p>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`/patients/${patient.id}/photos/${photo.id}/download`}
                      className={buttonStyles({ variant: "secondary", size: "sm" })}
                    >
                      Descargar
                    </a>
                    <a
                      href={photo.secureUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonStyles({ variant: "ghost", size: "sm" })}
                    >
                      Abrir original
                    </a>
                    <ConfirmActionForm
                      action={deletePatientPhotoAction}
                      hiddenFields={[
                        { name: "patientId", value: patient.id },
                        { name: "photoId", value: photo.id },
                      ]}
                      submitLabel="Eliminar"
                      pendingLabel="Eliminando..."
                      submitVariant="danger"
                      submitSize="sm"
                      confirmTitle="Eliminar foto"
                      confirmDescription="La foto se eliminara del sistema y del almacenamiento asociado."
                      confirmButtonLabel="Si, eliminar"
                      confirmButtonVariant="danger"
                      confirmTone="danger"
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="md:col-span-2 xl:col-span-3">
              <EmptyState
                title="Sin fotos adjuntas"
                description="Todavia no hay imagenes asociadas a este paciente en tu entorno."
              />
            </div>
          )}
        </div>
      </Card>

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
                    <p className="font-semibold text-foreground">{appointment.reason || "Sin motivo registrado."}</p>
                    <p className="mt-1 text-sm text-muted">{formatDateTime(appointment.scheduledAt)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={appointmentStatusTone(appointment.status)}>
                      {appointmentStatusLabel(appointment.status)}
                    </Badge>
                    <Link
                      href={`/appointments/${appointment.id}/edit?redirectPath=${encodeURIComponent(`/patients/${patient.id}`)}`}
                      className={buttonStyles({ variant: "secondary", size: "sm" })}
                    >
                      Editar cita
                    </Link>
                  </div>
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
