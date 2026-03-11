"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { buttonStyles } from "@/components/ui/button";
import { Field, inputClassName, selectClassName, textareaClassName } from "@/components/ui/field";

type AppointmentPatientOption = {
  id: string;
  firstName: string;
  lastName: string;
};

type AppointmentTreatmentOption = {
  id: string;
  title: string;
  patientId: string;
  patient: {
    firstName: string;
    lastName: string;
  };
};

type NewAppointmentFormProps = {
  patients: AppointmentPatientOption[];
  treatments: AppointmentTreatmentOption[];
  defaultPatientId: string;
  defaultTreatmentId: string;
  action: (formData: FormData) => void | Promise<void>;
};

function getPatientLabel(patient: AppointmentPatientOption) {
  return `${patient.firstName} ${patient.lastName}`;
}

export function NewAppointmentForm({
  patients,
  treatments,
  defaultPatientId,
  defaultTreatmentId,
  action,
}: NewAppointmentFormProps) {
  const patientListId = useId();
  const initialPatient = patients.find((patient) => patient.id === defaultPatientId);
  const [patientSearch, setPatientSearch] = useState(initialPatient ? getPatientLabel(initialPatient) : "");
  const [selectedPatientId, setSelectedPatientId] = useState(defaultPatientId);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState(defaultTreatmentId);

  const filteredTreatments = useMemo(
    () => treatments.filter((treatment) => treatment.patientId === selectedPatientId),
    [selectedPatientId, treatments],
  );

  useEffect(() => {
    if (!selectedTreatmentId) {
      return;
    }

    const treatmentStillMatches = filteredTreatments.some((treatment) => treatment.id === selectedTreatmentId);

    if (!treatmentStillMatches) {
      setSelectedTreatmentId("");
    }
  }, [filteredTreatments, selectedTreatmentId]);

  function handlePatientInput(value: string) {
    setPatientSearch(value);

    const matchedPatient = patients.find((patient) => getPatientLabel(patient) === value);

    setSelectedPatientId(matchedPatient?.id ?? "");
  }

  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Paciente" hint="Escribe el nombre y elige una sugerencia.">
          <>
            <input
              className={inputClassName}
              list={patientListId}
              value={patientSearch}
              onChange={(event) => handlePatientInput(event.target.value)}
              placeholder="Ejemplo: Mario Quispe"
              required
            />
            <datalist id={patientListId}>
              {patients.map((patient) => (
                <option key={patient.id} value={getPatientLabel(patient)} />
              ))}
            </datalist>
            <input type="hidden" name="patientId" value={selectedPatientId} />
          </>
        </Field>

        <Field label="Tratamiento asociado" hint="Opcional.">
          <select
            className={selectClassName}
            name="treatmentId"
            value={selectedTreatmentId}
            onChange={(event) => setSelectedTreatmentId(event.target.value)}
          >
            <option value="">Sin asociar</option>
            {filteredTreatments.map((treatment) => (
              <option key={treatment.id} value={treatment.id}>
                {treatment.title} - {treatment.patient.firstName} {treatment.patient.lastName}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Fecha y hora">
          <input className={inputClassName} type="datetime-local" name="scheduledAt" required />
        </Field>

        <Field label="Motivo" hint="Opcional.">
          <input
            className={inputClassName}
            name="reason"
            placeholder="Control mensual, ajuste, limpieza..."
          />
        </Field>
      </div>

      <Field label="Notas" hint="Opcional.">
        <textarea className={textareaClassName} name="notes" placeholder="Observaciones operativas o clinicas" />
      </Field>

      <button type="submit" className={buttonStyles({})}>
        Guardar cita
      </button>
    </form>
  );
}
