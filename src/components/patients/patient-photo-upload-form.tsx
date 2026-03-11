"use client";

import { useId, useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from "react";
import { buttonStyles } from "@/components/ui/button";
import { Field, inputClassName, textareaClassName } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type PatientPhotoUploadFormProps = {
  patientId: string;
  action: (formData: FormData) => void | Promise<void>;
};

export function PatientPhotoUploadForm({
  patientId,
  action,
}: PatientPhotoUploadFormProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");

  function updateSelectedFile(files: FileList | null) {
    const file = files?.[0];

    setSelectedFileName(file?.name ?? "");
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    updateSelectedFile(event.target.files);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();

    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }

    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    const files = event.dataTransfer.files;

    if (!files.length || !inputRef.current) {
      return;
    }

    const transfer = new DataTransfer();
    transfer.items.add(files[0]);
    inputRef.current.files = transfer.files;
    updateSelectedFile(transfer.files);
  }

  function openPicker() {
    inputRef.current?.click();
  }

  function handleKeyboardOpen(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    openPicker();
  }

  return (
    <form action={action} className="grid gap-4 md:grid-cols-[1.1fr_1fr_auto]">
      <input type="hidden" name="patientId" value={patientId} />

      <div className="space-y-2">
        <span className="text-sm font-semibold text-foreground">Nueva foto</span>
        <div
          role="button"
          tabIndex={0}
          onClick={openPicker}
          onKeyDown={handleKeyboardOpen}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "rounded-3xl border border-dashed bg-white/80 px-4 py-5 text-left transition outline-none",
            "focus:border-brand focus:ring-2 focus:ring-brand/20",
            isDragging
              ? "border-brand bg-violet-50"
              : "border-line hover:border-brand/60 hover:bg-violet-50/60",
          )}
        >
          <p className="text-sm font-semibold text-foreground">
            Arrastra una imagen aqui o haz clic para seleccionarla.
          </p>
          <p className="mt-1 text-xs text-muted">
            {selectedFileName ? `Archivo seleccionado: ${selectedFileName}` : "PNG, JPG, WEBP y similares. Maximo 10 MB."}
          </p>

          <input
            id={inputId}
            ref={inputRef}
            className={cn(inputClassName, "mt-4")}
            type="file"
            name="photo"
            accept="image/*"
            required
            onClick={(event) => event.stopPropagation()}
            onChange={handleInputChange}
          />
        </div>
      </div>

      <Field label="Descripcion" hint="Opcional. Ayuda a identificar la foto en la ficha del paciente.">
        <textarea
          className={textareaClassName}
          name="description"
          rows={3}
          maxLength={500}
          placeholder="Ejemplo: Radiografia inicial o control postoperatorio"
        />
      </Field>

      <button type="submit" className={buttonStyles({ className: "self-end" })}>
        Subir foto
      </button>
    </form>
  );
}
