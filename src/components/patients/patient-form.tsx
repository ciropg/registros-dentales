"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useLocale } from "@/components/providers/locale-provider";
import { Alert } from "@/components/ui/alert";
import { buttonStyles } from "@/components/ui/button";
import { Field, inputClassName, textareaClassName } from "@/components/ui/field";
import { initialPatientCreateActionState, type PatientCreateActionState } from "@/modules/patients/create-patient-form-state";
import { cn } from "@/lib/utils";

type PatientFormDefaults = {
  patientId?: string;
  firstName?: string | null;
  lastName?: string | null;
  documentNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  birthDate?: string | null;
  notes?: string | null;
};

type PatientFormProps = {
  action: (
    previousState: PatientCreateActionState,
    formData: FormData,
  ) => Promise<PatientCreateActionState>;
  defaults?: PatientFormDefaults;
  submitLabel: string;
};

function getFieldClassName(hasError: boolean) {
  return cn(
    inputClassName,
    hasError ? "border-danger/50 focus:border-danger focus:ring-danger/20" : "",
  );
}

function FieldMessage({
  error,
  hint,
  id,
}: {
  error?: string;
  hint?: string;
  id: string;
}) {
  if (error) {
    return (
      <span id={id} className="block text-xs text-danger">
        {error}
      </span>
    );
  }

  if (hint) {
    return (
      <span id={id} className="block text-xs text-muted">
        {hint}
      </span>
    );
  }

  return null;
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={buttonStyles({})} disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}

export function PatientForm({
  action,
  defaults,
  submitLabel,
}: PatientFormProps) {
  const locale = useLocale();
  const copy = locale === "en"
    ? {
        saving: "Saving...",
        firstName: "First names",
        lastName: "Last names",
        document: "Document",
        phone: "Phone",
        email: "Email",
        birthDate: "Birth date",
        notes: "Clinical notes",
        documentHint: "Optional. If provided, it must contain 8 digits.",
        optional: "Optional.",
        notesPlaceholder: "Initial patient observations",
      }
    : {
        saving: "Guardando...",
        firstName: "Nombres",
        lastName: "Apellidos",
        document: "Documento",
        phone: "Telefono",
        email: "Email",
        birthDate: "Fecha de nacimiento",
        notes: "Notas clinicas",
        documentHint: "Opcional. Si lo ingresas, debe tener 8 digitos.",
        optional: "Opcional.",
        notesPlaceholder: "Observaciones iniciales del paciente",
      };
  const [state, formAction] = useActionState(action, initialPatientCreateActionState);

  return (
    <form action={formAction} className="space-y-5">
      {defaults?.patientId ? <input type="hidden" name="patientId" value={defaults.patientId} /> : null}
      {state.message ? <Alert message={state.message} tone="danger" /> : null}

      <div className="grid gap-5 md:grid-cols-2">
        <Field label={copy.firstName}>
          <>
            <input
              className={getFieldClassName(Boolean(state.fieldErrors.firstName))}
              name="firstName"
              defaultValue={defaults?.firstName ?? ""}
              required
              aria-invalid={Boolean(state.fieldErrors.firstName)}
              aria-describedby={state.fieldErrors.firstName ? "patient-first-name-error" : undefined}
            />
            <FieldMessage error={state.fieldErrors.firstName} id="patient-first-name-error" />
          </>
        </Field>

        <Field label={copy.lastName}>
          <>
            <input
              className={getFieldClassName(Boolean(state.fieldErrors.lastName))}
              name="lastName"
              defaultValue={defaults?.lastName ?? ""}
              required
              aria-invalid={Boolean(state.fieldErrors.lastName)}
              aria-describedby={state.fieldErrors.lastName ? "patient-last-name-error" : undefined}
            />
            <FieldMessage error={state.fieldErrors.lastName} id="patient-last-name-error" />
          </>
        </Field>

        <Field label={copy.document}>
          <>
            <input
              className={getFieldClassName(Boolean(state.fieldErrors.documentNumber))}
              name="documentNumber"
              defaultValue={defaults?.documentNumber ?? ""}
              inputMode="numeric"
              maxLength={8}
              pattern="[0-9]{8}"
              aria-invalid={Boolean(state.fieldErrors.documentNumber)}
              aria-describedby="patient-document-message"
            />
            <FieldMessage
              error={state.fieldErrors.documentNumber}
              hint={copy.documentHint}
              id="patient-document-message"
            />
          </>
        </Field>

        <Field label={copy.phone}>
          <>
            <input
              className={getFieldClassName(Boolean(state.fieldErrors.phone))}
              name="phone"
              defaultValue={defaults?.phone ?? ""}
              aria-invalid={Boolean(state.fieldErrors.phone)}
              aria-describedby="patient-phone-message"
            />
            <FieldMessage error={state.fieldErrors.phone} hint={copy.optional} id="patient-phone-message" />
          </>
        </Field>

        <Field label={copy.email}>
          <>
            <input
              className={getFieldClassName(Boolean(state.fieldErrors.email))}
              type="email"
              name="email"
              defaultValue={defaults?.email ?? ""}
              aria-invalid={Boolean(state.fieldErrors.email)}
              aria-describedby="patient-email-message"
            />
            <FieldMessage error={state.fieldErrors.email} hint={copy.optional} id="patient-email-message" />
          </>
        </Field>

        <Field label={copy.birthDate}>
          <>
            <input
              className={getFieldClassName(Boolean(state.fieldErrors.birthDate))}
              type="date"
              name="birthDate"
              defaultValue={defaults?.birthDate ?? ""}
              aria-invalid={Boolean(state.fieldErrors.birthDate)}
              aria-describedby="patient-birth-date-message"
            />
            <FieldMessage error={state.fieldErrors.birthDate} hint={copy.optional} id="patient-birth-date-message" />
          </>
        </Field>
      </div>

      <Field label={copy.notes}>
        <>
          <textarea
            className={cn(
              textareaClassName,
              state.fieldErrors.notes ? "border-danger/50 focus:border-danger focus:ring-danger/20" : "",
            )}
            name="notes"
            defaultValue={defaults?.notes ?? ""}
            placeholder={copy.notesPlaceholder}
            aria-invalid={Boolean(state.fieldErrors.notes)}
            aria-describedby="patient-notes-message"
          />
          <FieldMessage error={state.fieldErrors.notes} hint={copy.optional} id="patient-notes-message" />
        </>
      </Field>

      <SubmitButton label={submitLabel} pendingLabel={copy.saving} />
    </form>
  );
}
