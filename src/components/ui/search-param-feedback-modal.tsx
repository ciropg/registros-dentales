"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/components/providers/locale-provider";
import { buttonStyles } from "@/components/ui/button";
import { Modal, type ModalTone } from "@/components/ui/modal";
import { getMessages } from "@/lib/i18n/messages";

export function SearchParamFeedbackModal({
  message,
  queryKey,
  title,
  description,
  tone = "success",
  closeLabel,
}: {
  message?: string;
  queryKey: string;
  title: string;
  description?: React.ReactNode;
  tone?: ModalTone;
  closeLabel?: string;
}) {
  const locale = useLocale();
  const copy = getMessages(locale);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(Boolean(message));

  useEffect(() => {
    setOpen(Boolean(message));
  }, [message]);

  if (!message) {
    return null;
  }

  function handleClose() {
    setOpen(false);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete(queryKey);

    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }

  return (
    <Modal open={open} title={title} description={description ?? message} tone={tone} onClose={handleClose}>
      <button type="button" className={buttonStyles({})} onClick={handleClose}>
        {closeLabel ?? copy.feedback.close}
      </button>
    </Modal>
  );
}
