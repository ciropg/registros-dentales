"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, inputClassName } from "@/components/ui/field";

type PhaseDraft = {
  name: string;
  weight: number;
  plannedDate: string;
};

const initialPhases: PhaseDraft[] = [
  { name: "Diagnostico", weight: 2, plannedDate: "" },
  { name: "Ejecucion", weight: 4, plannedDate: "" },
  { name: "Control final", weight: 2, plannedDate: "" },
];

export function PhasePlanner() {
  const [phases, setPhases] = useState<PhaseDraft[]>(initialPhases);

  const serialized = useMemo(() => JSON.stringify(phases.filter((phase) => phase.name.trim())), [phases]);

  function updatePhase(index: number, field: keyof PhaseDraft, value: string) {
    setPhases((current) =>
      current.map((phase, phaseIndex) =>
        phaseIndex === index
          ? {
              ...phase,
              [field]: field === "weight" ? Number(value || "1") : value,
            }
          : phase,
      ),
    );
  }

  function addPhase() {
    setPhases((current) => [...current, { name: "", weight: 1, plannedDate: "" }]);
  }

  function removePhase(index: number) {
    setPhases((current) => current.filter((_, phaseIndex) => phaseIndex !== index));
  }

  return (
    <div className="space-y-4">
      <input type="hidden" name="phases" value={serialized} />

      {phases.map((phase, index) => (
        <div key={`${phase.name}-${index}`} className="rounded-3xl border border-line bg-white/70 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Fase {index + 1}</p>
              <p className="text-xs text-muted">Define nombre, peso e hito tentativo.</p>
            </div>
            {phases.length > 1 ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => removePhase(index)}>
                Quitar
              </Button>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-[1.7fr_0.7fr_1fr]">
            <Field label="Nombre de fase">
              <input
                className={inputClassName}
                value={phase.name}
                onChange={(event) => updatePhase(index, "name", event.target.value)}
                placeholder="Ejemplo: Alineacion"
              />
            </Field>
            <Field label="Peso">
              <input
                className={inputClassName}
                type="number"
                min={1}
                value={phase.weight}
                onChange={(event) => updatePhase(index, "weight", event.target.value)}
              />
            </Field>
            <Field label="Fecha planificada" hint="Opcional.">
              <input
                className={inputClassName}
                type="date"
                value={phase.plannedDate}
                onChange={(event) => updatePhase(index, "plannedDate", event.target.value)}
              />
            </Field>
          </div>
        </div>
      ))}

      <Button type="button" variant="secondary" onClick={addPhase}>
        Agregar fase
      </Button>
    </div>
  );
}
