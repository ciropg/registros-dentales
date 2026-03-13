"use client";

import { AppointmentStatus } from "@prisma/client";
import { format } from "date-fns";
import { useState } from "react";
import { useLocale } from "@/components/providers/locale-provider";
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
  const locale = useLocale();
  const copy = locale === "en"
    ? {
        rescheduleTitle: "Confirm appointment reschedule",
        statusTitle: "Confirm status change",
        rescheduleFallback: "the selected date",
        rescheduleButton: "Yes, reschedule",
        saveButton: "Yes, save",
        newDateTime: "New date and time",
        newDateTimeHint: (currentDate: string) =>
          `The current appointment is ${currentDate}. The same appointment will be updated with the date you select here.`,
        rescheduleDescription: (patientName: string, value: string) =>
          `The appointment for ${patientName} will be rescheduled to ${value}.`,
        statusDescription: (patientName: string, status: string) =>
          `The appointment for ${patientName} will be updated to ${status}.`,
      }
    : {
        rescheduleTitle: "Confirmar reprogramacion de cita",
        statusTitle: "Confirmar cambio de estado",
        rescheduleFallback: "la fecha seleccionada",
        rescheduleButton: "Si, reprogramar",
        saveButton: "Si, guardar",
        newDateTime: "Nueva fecha y hora",
        newDateTimeHint: (currentDate: string) =>
          `La cita actual es ${currentDate}. La misma cita se actualizara con la fecha que selecciones aqui.`,
        rescheduleDescription: (patientName: string, value: string) =>
          `La cita de ${patientName} quedara como reprogramada para ${value}.`,
        statusDescription: (patientName: string, status: string) =>
          `Se actualizara la cita de ${patientName} al estado ${status}.`,
      };
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
      confirmTitle={requiresRescheduledAt ? copy.rescheduleTitle : copy.statusTitle}
      confirmDescription={
        requiresRescheduledAt
          ? copy.rescheduleDescription(patientName, formattedRescheduledAt ?? copy.rescheduleFallback)
          : copy.statusDescription(patientName, appointmentStatusLabel(status, locale).toLowerCase())
      }
      confirmButtonLabel={requiresRescheduledAt ? copy.rescheduleButton : copy.saveButton}
      confirmTone={requiresRescheduledAt ? "warning" : "neutral"}
      confirmButtonVariant={requiresRescheduledAt ? "warning" : "primary"}
    >
      <Field label={fieldLabel}>
        <select className={selectClassName} name="status" value={status} onChange={(event) => setStatus(event.target.value as AppointmentStatus)}>
          {Object.values(AppointmentStatus).map((option) => (
            <option key={option} value={option}>
              {appointmentStatusLabel(option, locale)}
            </option>
          ))}
        </select>
      </Field>

      {requiresRescheduledAt ? (
        <Field
          label={copy.newDateTime}
          hint={copy.newDateTimeHint(formatDateTime(scheduledAt))}
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
