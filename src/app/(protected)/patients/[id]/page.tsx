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
import { getCurrentLocale } from "@/lib/i18n/server";
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
  const [viewer, locale] = await Promise.all([requireUser(), getCurrentLocale()]);
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const patient = await getPatientDetail(id, viewer.isDemo);

  if (!patient) {
    notFound();
  }

  const success = toSearchParam(query.success);
  const error = toSearchParam(query.error);
  const copy = locale === "en"
    ? {
        detailDescription: "Patient record with linked treatments, phase progress, and appointment history.",
        editPatient: "Edit patient",
        newTreatment: "New treatment",
        newAppointment: "New appointment",
        updatedSuccess: "Appointment updated successfully.",
        updatedDescription: "The patient appointment was updated successfully.",
        operationCompleted: "Operation completed",
        record: "Record",
        patientData: "Patient information",
        document: "Document",
        phone: "Phone",
        email: "Email",
        birthDate: "Birth date",
        notes: "Notes",
        noNotes: "No clinical notes recorded.",
        treatmentsEyebrow: "Treatments",
        treatmentsTitle: "Patient cases",
        treatmentsDescription: "Treatment tracking with progress, dates, and assigned owner.",
        noDiagnosis: "No clinical diagnosis recorded.",
        responsible: "Responsible",
        unassigned: "Unassigned",
        progress: "Progress",
        elapsed: "Elapsed",
        remaining: "Remaining",
        days: "days",
        relatedAppointments: "Related appointments",
        viewTreatment: "View treatment",
        registerAppointment: "Register appointment",
        emptyTreatmentsTitle: "No treatments recorded",
        emptyTreatmentsDescription: "Create a treatment to start measuring timelines and progress.",
        createTreatment: "Create treatment",
        photosEyebrow: "Photos",
        photosTitle: "Patient attachments",
        demoPhotosDescription: `Shared demo space: ${patient?.photoUsageCount ?? 0}/5 photos in use. When you upload a new one, the oldest demo photo is removed if the limit is already full.`,
        realPhotosDescription: "Attach clinical patient photos and keep them in the live environment.",
        defaultPhotoName: "Clinical photo",
        noPhotoDescription: "No description.",
        uploadedAt: "Uploaded",
        download: "Download",
        openOriginal: "Open original",
        delete: "Delete",
        deleting: "Deleting...",
        deletePhotoTitle: "Delete photo",
        deletePhotoDescription: "The photo will be removed from the system and linked storage.",
        confirmDelete: "Yes, delete",
        emptyPhotosTitle: "No attached photos",
        emptyPhotosDescription: "There are no images linked to this patient in your environment yet.",
        appointmentsEyebrow: "Appointments",
        appointmentsTitle: "Recent history",
        appointmentsDescription: "Latest appointments linked to the patient and their status.",
        noReason: "No reason recorded.",
        editAppointment: "Edit appointment",
        emptyAppointmentsTitle: "No appointments recorded",
        emptyAppointmentsDescription: "This patient schedule does not have events yet.",
        createAppointment: "Create appointment",
      }
    : {
        detailDescription: "Ficha del paciente con tratamientos vinculados, avance por fases e historial de citas.",
        editPatient: "Editar paciente",
        newTreatment: "Nuevo tratamiento",
        newAppointment: "Nueva cita",
        updatedSuccess: "Cita actualizada correctamente.",
        updatedDescription: "La cita del paciente fue actualizada correctamente.",
        operationCompleted: "Operacion completada",
        record: "Ficha",
        patientData: "Datos del paciente",
        document: "Documento",
        phone: "Telefono",
        email: "Email",
        birthDate: "Nacimiento",
        notes: "Notas",
        noNotes: "Sin notas clinicas registradas.",
        treatmentsEyebrow: "Tratamientos",
        treatmentsTitle: "Casos del paciente",
        treatmentsDescription: "Seguimiento por tratamiento con progreso, fechas y responsable.",
        noDiagnosis: "Sin diagnostico clinico registrado.",
        responsible: "Responsable",
        unassigned: "Sin asignar",
        progress: "Avance",
        elapsed: "Transcurridos",
        remaining: "Restantes",
        days: "dias",
        relatedAppointments: "Citas asociadas",
        viewTreatment: "Ver tratamiento",
        registerAppointment: "Registrar cita",
        emptyTreatmentsTitle: "Sin tratamientos registrados",
        emptyTreatmentsDescription: "Crea un tratamiento para empezar a medir tiempos y progreso.",
        createTreatment: "Crear tratamiento",
        photosEyebrow: "Fotos",
        photosTitle: "Adjuntos del paciente",
        demoPhotosDescription: `Espacio compartido demo: ${patient?.photoUsageCount ?? 0}/5 fotos en uso. Al subir una nueva, se elimina la foto demo mas antigua si el limite ya esta lleno.`,
        realPhotosDescription: "Adjunta fotos clinicas del paciente y conservalas en el entorno real.",
        defaultPhotoName: "Foto clinica",
        noPhotoDescription: "Sin descripcion.",
        uploadedAt: "Subida",
        download: "Descargar",
        openOriginal: "Abrir original",
        delete: "Eliminar",
        deleting: "Eliminando...",
        deletePhotoTitle: "Eliminar foto",
        deletePhotoDescription: "La foto se eliminara del sistema y del almacenamiento asociado.",
        confirmDelete: "Si, eliminar",
        emptyPhotosTitle: "Sin fotos adjuntas",
        emptyPhotosDescription: "Todavia no hay imagenes asociadas a este paciente en tu entorno.",
        appointmentsEyebrow: "Citas",
        appointmentsTitle: "Historial reciente",
        appointmentsDescription: "Ultimas citas asociadas al paciente y su estado.",
        noReason: "Sin motivo registrado.",
        editAppointment: "Editar cita",
        emptyAppointmentsTitle: "Sin citas registradas",
        emptyAppointmentsDescription: "La agenda del paciente aun no tiene eventos.",
        createAppointment: "Crear cita",
      };
  const appointmentUpdatedMessage = success === copy.updatedSuccess ? success : undefined;
  const successAlertMessage = success && success !== appointmentUpdatedMessage ? success : undefined;
  const showPatientManagementActions = canManagePatients(viewer.role);
  const showTreatmentCreateActions = canCreateTreatments(viewer.role);

  return (
    <main className="space-y-6 py-4 lg:py-8">
      <Topbar
        title={`${patient.firstName} ${patient.lastName}`}
        description={copy.detailDescription}
        locale={locale}
        action={
          <div className="flex flex-wrap gap-3">
            {showPatientManagementActions ? (
              <Link href={`/patients/${patient.id}/edit`} className={buttonStyles({ variant: "secondary" })}>
                {copy.editPatient}
              </Link>
            ) : null}
            {showTreatmentCreateActions ? (
              <Link
                href={`/treatments/new?patientId=${patient.id}`}
                className={buttonStyles({ variant: "secondary" })}
              >
                {copy.newTreatment}
              </Link>
            ) : null}
            <Link href={`/appointments/new?patientId=${patient.id}`} className={buttonStyles({})}>
              {copy.newAppointment}
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
        title={appointmentUpdatedMessage ?? copy.operationCompleted}
        description={copy.updatedDescription}
      />
      {successAlertMessage ? <Alert message={successAlertMessage} tone="success" /> : null}
      {error ? <Alert message={error} tone="danger" /> : null}

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader eyebrow={copy.record} title={copy.patientData} />
          <dl className="mt-6 grid gap-4 text-sm">
            <div className="rounded-2xl bg-violet-50/80 px-4 py-4">
              <dt className="text-muted">{copy.document}</dt>
              <dd className="mt-1 font-semibold text-foreground">{patient.documentNumber ?? "--"}</dd>
            </div>
            <div className="rounded-2xl bg-violet-50/80 px-4 py-4">
              <dt className="text-muted">{copy.phone}</dt>
              <dd className="mt-1 font-semibold text-foreground">{patient.phone ?? "--"}</dd>
            </div>
            <div className="rounded-2xl bg-violet-50/80 px-4 py-4">
              <dt className="text-muted">{copy.email}</dt>
              <dd className="mt-1 font-semibold text-foreground">{patient.email ?? "--"}</dd>
            </div>
            <div className="rounded-2xl bg-violet-50/80 px-4 py-4">
              <dt className="text-muted">{copy.birthDate}</dt>
              <dd className="mt-1 font-semibold text-foreground">{formatDate(patient.birthDate)}</dd>
            </div>
          </dl>

          <div className="mt-6 rounded-3xl border border-line bg-white/70 p-5">
            <p className="text-sm font-semibold text-foreground">{copy.notes}</p>
            <p className="mt-3 text-sm leading-6 text-muted">
              {patient.notes ?? copy.noNotes}
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader
            eyebrow={copy.treatmentsEyebrow}
            title={copy.treatmentsTitle}
            description={copy.treatmentsDescription}
          />

          <div className="mt-6 space-y-4">
            {patient.treatments.length ? (
              patient.treatments.map((treatment) => (
                <div key={treatment.id} className="rounded-3xl border border-line bg-white/70 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xl text-foreground">{treatment.title}</p>
                      <p className="mt-2 text-sm leading-6 text-muted">
                        {treatment.diagnosis || copy.noDiagnosis}
                      </p>
                      <p className="mt-2 text-sm text-muted">
                        {copy.responsible}: {treatment.dentist?.name ?? copy.unassigned}
                      </p>
                    </div>
                    <Badge tone={treatmentStatusTone(treatment.status)}>
                      {treatmentStatusLabel(treatment.status, locale)}
                    </Badge>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-sm text-muted">
                      <span>{copy.progress}</span>
                      <span>{treatment.metrics.progressPercent}%</span>
                    </div>
                    <ProgressBar value={treatment.metrics.progressPercent} />
                  </div>

                  <div className="mt-5 grid gap-3 text-sm md:grid-cols-3">
                    <div className="rounded-2xl bg-violet-100/70 px-4 py-3">
                      <p className="font-semibold text-foreground">{treatment.metrics.daysElapsed} {copy.days}</p>
                      <p className="text-muted">{copy.elapsed}</p>
                    </div>
                    <div className="rounded-2xl bg-violet-100/70 px-4 py-3">
                      <p className="font-semibold text-foreground">{treatment.metrics.daysRemaining} {copy.days}</p>
                      <p className="text-muted">{copy.remaining}</p>
                    </div>
                    <div className="rounded-2xl bg-violet-100/70 px-4 py-3">
                      <p className="font-semibold text-foreground">{treatment.appointments.length}</p>
                      <p className="text-muted">{copy.relatedAppointments}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link href={`/treatments/${treatment.id}`} className={buttonStyles({})}>
                      {copy.viewTreatment}
                    </Link>
                    <Link
                      href={`/appointments/new?patientId=${patient.id}&treatmentId=${treatment.id}`}
                      className={buttonStyles({ variant: "secondary" })}
                    >
                      {copy.registerAppointment}
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title={copy.emptyTreatmentsTitle}
                description={copy.emptyTreatmentsDescription}
                action={showTreatmentCreateActions ? (
                  <Link href={`/treatments/new?patientId=${patient.id}`} className={buttonStyles({})}>
                    {copy.createTreatment}
                  </Link>
                ) : undefined}
              />
            )}
          </div>
        </Card>
      </section>

      <Card>
        <CardHeader
          eyebrow={copy.photosEyebrow}
          title={copy.photosTitle}
          description={
            viewer.isDemo
              ? copy.demoPhotosDescription
              : copy.realPhotosDescription
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
                    alt={locale === "en" ? `Photo of ${patient.firstName} ${patient.lastName}` : `Foto de ${patient.firstName} ${patient.lastName}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="space-y-2 p-4 text-sm">
                  <p className="font-semibold text-foreground">{photo.originalFilename ?? copy.defaultPhotoName}</p>
                  <p className="text-muted">{photo.description ?? copy.noPhotoDescription}</p>
                  <p className="text-muted">{copy.uploadedAt}: {formatDateTime(photo.createdAt)}</p>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`/patients/${patient.id}/photos/${photo.id}/download`}
                      className={buttonStyles({ variant: "secondary", size: "sm" })}
                    >
                      {copy.download}
                    </a>
                    <a
                      href={photo.secureUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonStyles({ variant: "ghost", size: "sm" })}
                    >
                      {copy.openOriginal}
                    </a>
                    <ConfirmActionForm
                      action={deletePatientPhotoAction}
                      hiddenFields={[
                        { name: "patientId", value: patient.id },
                        { name: "photoId", value: photo.id },
                      ]}
                      submitLabel={copy.delete}
                      pendingLabel={copy.deleting}
                      submitVariant="danger"
                      submitSize="sm"
                      confirmTitle={copy.deletePhotoTitle}
                      confirmDescription={copy.deletePhotoDescription}
                      confirmButtonLabel={copy.confirmDelete}
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
                title={copy.emptyPhotosTitle}
                description={copy.emptyPhotosDescription}
              />
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader
          eyebrow={copy.appointmentsEyebrow}
          title={copy.appointmentsTitle}
          description={copy.appointmentsDescription}
        />

        <div className="mt-6 space-y-3">
          {patient.appointments.length ? (
            patient.appointments.map((appointment) => (
              <div key={appointment.id} className="rounded-2xl border border-line bg-white/70 px-4 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{appointment.reason || copy.noReason}</p>
                    <p className="mt-1 text-sm text-muted">{formatDateTime(appointment.scheduledAt)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={appointmentStatusTone(appointment.status)}>
                      {appointmentStatusLabel(appointment.status, locale)}
                    </Badge>
                    <Link
                      href={`/appointments/${appointment.id}/edit?redirectPath=${encodeURIComponent(`/patients/${patient.id}`)}`}
                      className={buttonStyles({ variant: "secondary", size: "sm" })}
                    >
                      {copy.editAppointment}
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title={copy.emptyAppointmentsTitle}
              description={copy.emptyAppointmentsDescription}
              action={
                <Link href={`/appointments/new?patientId=${patient.id}`} className={buttonStyles({})}>
                  {copy.createAppointment}
                </Link>
              }
            />
          )}
        </div>
      </Card>
    </main>
  );
}
