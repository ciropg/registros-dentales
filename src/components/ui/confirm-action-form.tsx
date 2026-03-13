"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { type ButtonSize, type ButtonVariant, buttonStyles } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

type HiddenField = {
  name: string;
  value: string;
};

function SubmitButton({
  label,
  pendingLabel,
  variant,
  size,
  className,
}: {
  label: string;
  pendingLabel: string;
  variant: ButtonVariant;
  size: ButtonSize;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={buttonStyles({ variant, size, className })} disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}

export function ConfirmActionForm({
  action,
  hiddenFields = [],
  className,
  children,
  submitLabel,
  pendingLabel,
  submitVariant = "primary",
  submitSize = "md",
  submitClassName,
  confirmTitle,
  confirmDescription,
  confirmButtonLabel = "Confirmar",
  cancelButtonLabel = "Cancelar",
  confirmButtonVariant = "primary",
  confirmTone = "neutral",
}: {
  action: (formData: FormData) => void | Promise<void>;
  hiddenFields?: HiddenField[];
  className?: string;
  children?: React.ReactNode;
  submitLabel: string;
  pendingLabel: string;
  submitVariant?: ButtonVariant;
  submitSize?: ButtonSize;
  submitClassName?: string;
  confirmTitle: string;
  confirmDescription?: React.ReactNode;
  confirmButtonLabel?: string;
  cancelButtonLabel?: string;
  confirmButtonVariant?: ButtonVariant;
  confirmTone?: "neutral" | "warning" | "danger";
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const shouldSubmitRef = useRef(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (shouldSubmitRef.current) {
      shouldSubmitRef.current = false;
      return;
    }

    event.preventDefault();
    setIsModalOpen(true);
  }

  function handleConfirm() {
    shouldSubmitRef.current = true;
    setIsModalOpen(false);
    formRef.current?.requestSubmit();
  }

  return (
    <>
      <form ref={formRef} action={action} onSubmit={handleSubmit} className={className}>
        {hiddenFields.map((field) => (
          <input key={field.name} type="hidden" name={field.name} value={field.value} />
        ))}
        {children}
        <SubmitButton
          label={submitLabel}
          pendingLabel={pendingLabel}
          variant={submitVariant}
          size={submitSize}
          className={submitClassName}
        />
      </form>

      <Modal
        open={isModalOpen}
        title={confirmTitle}
        description={confirmDescription}
        tone={confirmTone}
        onClose={() => setIsModalOpen(false)}
      >
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className={buttonStyles({ variant: confirmButtonVariant })}
            onClick={handleConfirm}
          >
            {confirmButtonLabel}
          </button>
          <button
            type="button"
            className={buttonStyles({ variant: "secondary" })}
            onClick={() => setIsModalOpen(false)}
          >
            {cancelButtonLabel}
          </button>
        </div>
      </Modal>
    </>
  );
}
