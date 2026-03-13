"use client";

import { useFormStatus } from "react-dom";
import { buttonStyles } from "@/components/ui/button";

type BulkStatusWarningFormProps = {
  date: string;
  redirectPath: string;
  buttonLabel: string;
  pendingLabel: string;
  confirmMessage: string;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "warning";
  action: (formData: FormData) => void | Promise<void>;
};

function SubmitButton({
  buttonLabel,
  pendingLabel,
  variant,
}: {
  buttonLabel: string;
  pendingLabel: string;
  variant: BulkStatusWarningFormProps["variant"];
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={buttonStyles({ size: "sm", variant })} disabled={pending}>
      {pending ? pendingLabel : buttonLabel}
    </button>
  );
}

export function BulkStatusWarningForm({
  date,
  redirectPath,
  buttonLabel,
  pendingLabel,
  confirmMessage,
  variant = "warning",
  action,
}: BulkStatusWarningFormProps) {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!window.confirm(confirmMessage)) {
      event.preventDefault();
    }
  }

  return (
    <form action={action} onSubmit={handleSubmit}>
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="redirectPath" value={redirectPath} />
      <SubmitButton buttonLabel={buttonLabel} pendingLabel={pendingLabel} variant={variant} />
    </form>
  );
}
