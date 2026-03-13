"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { ConfirmActionForm } from "@/components/ui/confirm-action-form";
import { type ButtonVariant } from "@/components/ui/button";

type BulkStatusWarningFormProps = {
  date: string;
  redirectPath: string;
  buttonLabel: string;
  pendingLabel: string;
  confirmMessage: string;
  variant?: ButtonVariant;
  action: (formData: FormData) => void | Promise<void>;
};

export function BulkStatusWarningForm({
  date,
  redirectPath,
  buttonLabel,
  pendingLabel,
  confirmMessage,
  variant = "warning",
  action,
}: BulkStatusWarningFormProps) {
  const locale = useLocale();

  return (
    <ConfirmActionForm
      action={action}
      hiddenFields={[
        { name: "date", value: date },
        { name: "redirectPath", value: redirectPath },
      ]}
      submitLabel={buttonLabel}
      pendingLabel={pendingLabel}
      submitVariant={variant}
      submitSize="sm"
      confirmTitle={buttonLabel}
      confirmDescription={confirmMessage}
      confirmButtonLabel={locale === "en" ? "Yes, continue" : "Si, continuar"}
      confirmButtonVariant={variant}
      confirmTone={variant === "warning" ? "warning" : "neutral"}
    />
  );
}
