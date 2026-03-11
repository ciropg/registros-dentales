"use client";

import { PatientForm } from "@/components/patients/patient-form";
import { updatePatientAction } from "@/modules/patients/actions";
import { format } from "date-fns";

type EditPatientFormProps = {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    documentNumber: string | null;
    phone: string | null;
    email: string | null;
    birthDate: Date | null;
    notes: string | null;
  };
};

export function EditPatientForm({ patient }: EditPatientFormProps) {
  return (
    <PatientForm
      action={updatePatientAction}
      submitLabel="Guardar cambios"
      defaults={{
        patientId: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        documentNumber: patient.documentNumber,
        phone: patient.phone,
        email: patient.email,
        birthDate: patient.birthDate ? format(patient.birthDate, "yyyy-MM-dd") : "",
        notes: patient.notes,
      }}
    />
  );
}
