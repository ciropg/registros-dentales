"use client";

import { AppointmentStatus } from "@prisma/client";
import { format } from "date-fns";
import { useState } from "react";
import { ConfirmActionForm } from "@/components/ui/confirm-action-form";
import { Field, inputClassName, selectClassName } from "@/components/ui/field";
import { formatDateTime } from "@/lib/date";
import { appointmentStatusLabel } from "@/lib/status";

export function AppointmentStatusForm({
  action,
  appointmentId,
  redirectPath,
  patientName,
  currentStatus,
  scheduledAt,
  submitLabel,
  pendingLabel,
  className,
  submitClassName,
  fieldLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  appointmentId: string;
  redirectPath: string;
  patientName: string;
  currentStatus: AppointmentStatus;
  scheduledAt: Date | string;
  submitLabel: string;
  pendingLabel: string;
  className?: string;
  submitClassName?: string;
  fieldLabel: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [rescheduledAt, setRescheduledAt] = useState("");
  const requiresRescheduledAt = status === AppointmentStatus.RESCHEDULED && currentStatus !== AppointmentStatus.RESCHEDULED;
  const formattedRescheduledAt = rescheduledAt ? format(new Date(rescheduledAt), "dd/MM/yyyy HH:mm") : null;

  return (
    <ConfirmActionForm
      action={action}
      className={className}
      hiddenFields={[
        { name: "appointmentId", value: appointmentId },
        { name: "redirectPath", value: redirectPath },
      ]}
      submitLabel={submitLabel}
      pendingLabel={pendingLabel}
      submitClassName={submitClassName}
      confirmTitle={requiresRescheduledAt ? "Confirmar reprogramacion de cita" : "Confirmar cambio de estado"}
      confirmDescription={
        requiresRescheduledAt
          ? `La cita de ${patientName} quedara como reprogramada para ${formattedRescheduledAt ?? "la fecha seleccionada"}.`
          : `Se actualizara la cita de ${patientName} al estado ${appointmentStatusLabel(status).toLowerCase()}.`
      }
      confirmButtonLabel={requiresRescheduledAt ? "Si, reprogramar" : "Si, guardar"}
      confirmTone={requiresRescheduledAt ? "warning" : "neutral"}
      confirmButtonVariant={requiresRescheduledAt ? "warning" : "primary"}
    >
      <Field label={fieldLabel}>
        <select className={selectClassName} name="status" value={status} onChange={(event) => setStatus(event.target.value as AppointmentStatus)}>
          {Object.values(AppointmentStatus).map((option) => (
            <option key={option} value={option}>
              {appointmentStatusLabel(option)}
            </option>
          ))}
        </select>
      </Field>

      {requiresRescheduledAt ? (
        <Field
          label="Nueva fecha y hora"
          hint={`La cita actual es ${formatDateTime(scheduledAt)}. La misma cita se actualizara con la fecha que selecciones aqui.`}
        >
          <input
            className={inputClassName}
            type="datetime-local"
            name="rescheduledAt"
            value={rescheduledAt}
            onChange={(event) => setRescheduledAt(event.target.value)}
            min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
            required
          />
        </Field>
      ) : null}
    </ConfirmActionForm>
  );
}
