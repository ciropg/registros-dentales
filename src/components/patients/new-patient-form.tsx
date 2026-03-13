"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { createPatientAction } from "@/modules/patients/actions";
import { PatientForm } from "@/components/patients/patient-form";

export function NewPatientForm() {
  const locale = useLocale();

  return <PatientForm action={createPatientAction} submitLabel={locale === "en" ? "Save patient" : "Guardar paciente"} />;
}
