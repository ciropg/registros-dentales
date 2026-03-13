"use client";

import { ConfirmActionForm } from "@/components/ui/confirm-action-form";

type DeletePatientFormProps = {
  patientId: string;
  patientName: string;
  treatmentCount: number;
  appointmentCount: number;
  photoCount: number;
  action: (formData: FormData) => void | Promise<void>;
};

export function DeletePatientForm({
  patientId,
  patientName,
  treatmentCount,
  appointmentCount,
  photoCount,
  action,
}: DeletePatientFormProps) {
  const hasRelatedData = treatmentCount || appointmentCount || photoCount;
  const relationMessage = hasRelatedData
    ? `Esto tambien eliminara ${treatmentCount} tratamiento(s), ${appointmentCount} cita(s) y ${photoCount} foto(s) asociadas.`
    : "Esta accion eliminara el paciente de forma permanente.";

  return (
    <ConfirmActionForm
      action={action}
      hiddenFields={[{ name: "patientId", value: patientId }]}
      submitLabel="Eliminar paciente"
      pendingLabel="Eliminando..."
      submitVariant="danger"
      confirmTitle={`Eliminar a ${patientName}`}
      confirmDescription={relationMessage}
      confirmButtonLabel="Si, eliminar"
      confirmButtonVariant="danger"
      confirmTone="danger"
    />
  );
}
