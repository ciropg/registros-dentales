"use client";

import { useEffect, useId } from "react";
import { buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ModalTone = "neutral" | "warning" | "danger" | "success";

const toneStyles: Record<ModalTone, string> = {
  neutral: "bg-brand/10 text-foreground",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  success: "bg-success/10 text-success",
};

export function Modal({
  open,
  title,
  description,
  tone = "neutral",
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  tone?: ModalTone;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar modal"
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="shell-panel relative z-10 w-full max-w-lg rounded-[2rem] border border-line p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]", toneStyles[tone])}>
              Confirmacion
            </span>
            <h2 id={titleId} className="mt-4 text-2xl text-foreground">
              {title}
            </h2>
            {description ? (
              <div id={descriptionId} className="mt-3 text-sm leading-6 text-muted">
                {description}
              </div>
            ) : null}
          </div>

          <button type="button" className={buttonStyles({ variant: "ghost", size: "sm" })} onClick={onClose}>
            Cerrar
          </button>
        </div>

        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
