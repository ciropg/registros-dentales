"use client";

import { createPatientAction } from "@/modules/patients/actions";
import { PatientForm } from "@/components/patients/patient-form";

export function NewPatientForm() {
  return <PatientForm action={createPatientAction} submitLabel="Guardar paciente" />;
}
