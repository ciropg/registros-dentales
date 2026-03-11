"use client";

import { useFormStatus } from "react-dom";
import { buttonStyles } from "@/components/ui/button";

type DeletePatientFormProps = {
  patientId: string;
  patientName: string;
  treatmentCount: number;
  appointmentCount: number;
  photoCount: number;
  action: (formData: FormData) => void | Promise<void>;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={buttonStyles({ variant: "danger" })} disabled={pending}>
      {pending ? "Eliminando..." : "Eliminar paciente"}
    </button>
  );
}

export function DeletePatientForm({
  patientId,
  patientName,
  treatmentCount,
  appointmentCount,
  photoCount,
  action,
}: DeletePatientFormProps) {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const hasRelatedData = treatmentCount || appointmentCount || photoCount;
    const relationMessage = hasRelatedData
      ? ` Esto tambien eliminara ${treatmentCount} tratamiento(s), ${appointmentCount} cita(s) y ${photoCount} foto(s) asociadas.`
      : "";

    if (!window.confirm(`Se eliminara de forma permanente a ${patientName}.${relationMessage}`)) {
      event.preventDefault();
    }
  }

  return (
    <form action={action} onSubmit={handleSubmit}>
      <input type="hidden" name="patientId" value={patientId} />
      <SubmitButton />
    </form>
  );
}
