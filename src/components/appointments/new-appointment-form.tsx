"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { format } from "date-fns";
import { useLocale } from "@/components/providers/locale-provider";
import { ConfirmActionForm } from "@/components/ui/confirm-action-form";
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

type AppointmentFormDefaults = {
  appointmentId?: string;
  patientId?: string;
  treatmentId?: string | null;
  scheduledAt?: Date | null;
  reason?: string | null;
  notes?: string | null;
  redirectPath?: string;
};

type AppointmentFormProps = {
  patients: AppointmentPatientOption[];
  treatments: AppointmentTreatmentOption[];
  defaults?: AppointmentFormDefaults;
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  pendingLabel?: string;
  confirmation?: {
    title: string;
    description?: React.ReactNode;
    confirmButtonLabel?: string;
    confirmTone?: "neutral" | "warning" | "danger";
  };
};

function getPatientLabel(patient: AppointmentPatientOption) {
  return `${patient.firstName} ${patient.lastName}`;
}

export function AppointmentForm({
  patients,
  treatments,
  defaults,
  action,
  submitLabel,
  pendingLabel,
  confirmation,
}: AppointmentFormProps) {
  const locale = useLocale();
  const copy = locale === "en"
    ? {
        saving: "Saving...",
        patient: "Patient",
        patientHint: "Type the name and choose a suggestion.",
        patientPlaceholder: "Example: Mario Quispe",
        treatment: "Linked treatment",
        optional: "Optional.",
        noTreatment: "No linked treatment",
        dateTime: "Date and time",
        reason: "Reason",
        reasonPlaceholder: "Monthly check, adjustment, cleaning...",
        notes: "Notes",
        notesPlaceholder: "Operational or clinical notes",
      }
    : {
        saving: "Guardando...",
        patient: "Paciente",
        patientHint: "Escribe el nombre y elige una sugerencia.",
        patientPlaceholder: "Ejemplo: Mario Quispe",
        treatment: "Tratamiento asociado",
        optional: "Opcional.",
        noTreatment: "Sin asociar",
        dateTime: "Fecha y hora",
        reason: "Motivo",
        reasonPlaceholder: "Control mensual, ajuste, limpieza...",
        notes: "Notas",
        notesPlaceholder: "Observaciones operativas o clinicas",
      };
  const resolvedPendingLabel = pendingLabel ?? copy.saving;
  const patientListId = useId();
  const defaultPatientId = defaults?.patientId ?? "";
  const defaultTreatmentId = defaults?.treatmentId ?? "";
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

  const hiddenFields = [
    ...(defaults?.appointmentId ? [{ name: "appointmentId", value: defaults.appointmentId }] : []),
    ...(defaults?.redirectPath ? [{ name: "redirectPath", value: defaults.redirectPath }] : []),
  ];

  const formFields = (
    <>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label={copy.patient} hint={copy.patientHint}>
          <>
            <input
              className={inputClassName}
              list={patientListId}
              value={patientSearch}
              onChange={(event) => handlePatientInput(event.target.value)}
              placeholder={copy.patientPlaceholder}
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

        <Field label={copy.treatment} hint={copy.optional}>
          <select
            className={selectClassName}
            name="treatmentId"
            value={selectedTreatmentId}
            onChange={(event) => setSelectedTreatmentId(event.target.value)}
          >
            <option value="">{copy.noTreatment}</option>
            {filteredTreatments.map((treatment) => (
              <option key={treatment.id} value={treatment.id}>
                {treatment.title} - {treatment.patient.firstName} {treatment.patient.lastName}
              </option>
            ))}
          </select>
        </Field>

        <Field label={copy.dateTime}>
          <input
            className={inputClassName}
            type="datetime-local"
            name="scheduledAt"
            defaultValue={defaults?.scheduledAt ? format(defaults.scheduledAt, "yyyy-MM-dd'T'HH:mm") : ""}
            required
          />
        </Field>

        <Field label={copy.reason} hint={copy.optional}>
          <input
            className={inputClassName}
            name="reason"
            defaultValue={defaults?.reason ?? ""}
            placeholder={copy.reasonPlaceholder}
          />
        </Field>
      </div>

      <Field label={copy.notes} hint={copy.optional}>
        <textarea
          className={textareaClassName}
          name="notes"
          defaultValue={defaults?.notes ?? ""}
          placeholder={copy.notesPlaceholder}
        />
      </Field>
    </>
  );

  if (confirmation) {
    return (
      <ConfirmActionForm
        action={action}
        className="space-y-5"
        hiddenFields={hiddenFields}
        submitLabel={submitLabel}
        pendingLabel={resolvedPendingLabel}
        confirmTitle={confirmation.title}
        confirmDescription={confirmation.description}
        confirmButtonLabel={confirmation.confirmButtonLabel}
        confirmTone={confirmation.confirmTone}
      >
        {formFields}
      </ConfirmActionForm>
    );
  }

  return (
    <form action={action} className="space-y-5">
      {hiddenFields.map((field) => (
        <input key={field.name} type="hidden" name={field.name} value={field.value} />
      ))}
      {formFields}
      <button type="submit" className={buttonStyles({})}>
        {submitLabel}
      </button>
    </form>
  );
}
