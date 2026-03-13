"use client";

import { useLocale } from "@/components/providers/locale-provider";
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
  const locale = useLocale();
  const hasRelatedData = treatmentCount || appointmentCount || photoCount;
  const relationMessage = hasRelatedData
    ? locale === "en"
      ? `This will also delete ${treatmentCount} treatment(s), ${appointmentCount} appointment(s), and ${photoCount} linked photo(s).`
      : `Esto tambien eliminara ${treatmentCount} tratamiento(s), ${appointmentCount} cita(s) y ${photoCount} foto(s) asociadas.`
    : locale === "en"
      ? "This action will permanently delete the patient."
      : "Esta accion eliminara el paciente de forma permanente.";

  return (
    <ConfirmActionForm
      action={action}
      hiddenFields={[{ name: "patientId", value: patientId }]}
      submitLabel={locale === "en" ? "Delete patient" : "Eliminar paciente"}
      pendingLabel={locale === "en" ? "Deleting..." : "Eliminando..."}
      submitVariant="danger"
      confirmTitle={locale === "en" ? `Delete ${patientName}` : `Eliminar a ${patientName}`}
      confirmDescription={relationMessage}
      confirmButtonLabel={locale === "en" ? "Yes, delete" : "Si, eliminar"}
      confirmButtonVariant="danger"
      confirmTone="danger"
    />
  );
}
