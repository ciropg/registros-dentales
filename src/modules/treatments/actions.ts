"use server";

import { PhaseStatus, TreatmentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBaseRole } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { getConcreteRolesForBaseRoles } from "@/lib/roles";
import { buildErrorSearch, buildSuccessSearch } from "@/lib/utils";
import {
  treatmentCreateSchema,
  treatmentUpdateSchema,
  treatmentPhaseUpdateSchema,
} from "@/modules/treatments/schemas";

export async function createTreatmentAction(formData: FormData) {
  const user = await requireBaseRole(["ADMIN", "DENTIST", "ASSISTANT", "RECEPTIONIST"]);

  let parsedPhases: unknown[] = [];

  try {
    parsedPhases = JSON.parse(String(formData.get("phases") ?? "[]"));
  } catch {
    redirect(`/treatments/new${buildErrorSearch("No se pudieron leer las fases del tratamiento.")}`);
  }

  const parsed = treatmentCreateSchema.safeParse({
    patientId: formData.get("patientId"),
    dentistId: formData.get("dentistId"),
    title: formData.get("title"),
    diagnosis: formData.get("diagnosis"),
    startDate: formData.get("startDate"),
    estimatedEndDate: formData.get("estimatedEndDate"),
    notes: formData.get("notes"),
    phases: parsedPhases,
  });

  if (!parsed.success) {
    redirect(`/treatments/new${buildErrorSearch(parsed.error.issues[0]?.message ?? "No se pudo crear el tratamiento.")}`);
  }

  const patient = await prisma.patient.findFirst({
    where: {
      id: parsed.data.patientId,
      isDemo: user.isDemo,
    },
    select: {
      id: true,
    },
  });

  if (!patient) {
    redirect(`/treatments/new${buildErrorSearch("El paciente no existe en tu entorno.")}`);
  }

  let dentistId: string | undefined;

  if (parsed.data.dentistId) {
    const dentist = await prisma.user.findFirst({
      where: {
        id: parsed.data.dentistId,
        isDemo: user.isDemo,
        active: true,
        role: {
          in: getConcreteRolesForBaseRoles(["ADMIN", "DENTIST"]),
        },
      },
      select: {
        id: true,
      },
    });

    if (!dentist) {
      redirect(`/treatments/new${buildErrorSearch("El responsable no existe en tu entorno.")}`);
    }

    dentistId = dentist.id;
  }

  const status =
    new Date(parsed.data.startDate) > new Date()
      ? TreatmentStatus.PLANNED
      : TreatmentStatus.IN_PROGRESS;

  const treatment = await prisma.treatment.create({
    data: {
      patientId: patient.id,
      dentistId,
      title: parsed.data.title,
      diagnosis: parsed.data.diagnosis ?? "",
      startDate: new Date(parsed.data.startDate),
      estimatedEndDate: new Date(parsed.data.estimatedEndDate),
      notes: parsed.data.notes,
      status,
      isDemo: user.isDemo,
      phases: {
        create: parsed.data.phases.map((phase, index) => ({
          name: phase.name,
          weight: phase.weight,
          phaseOrder: index + 1,
          plannedDate: phase.plannedDate ? new Date(phase.plannedDate) : undefined,
        })),
      },
    },
  });

  await recordAudit({
    actorId: user.id,
    entityType: "treatment",
    entityId: treatment.id,
    action: "TREATMENT_CREATED",
    description: `Se creo el tratamiento ${treatment.title}.`,
  });

  revalidatePath("/dashboard");
  revalidatePath("/patients");
  revalidatePath(`/patients/${parsed.data.patientId}`);
  redirect(`/treatments/${treatment.id}${buildSuccessSearch("Tratamiento creado correctamente.")}`);
}

export async function updatePhaseStatusAction(formData: FormData) {
  const user = await requireBaseRole(["ADMIN", "DENTIST", "ASSISTANT"]);

  const parsed = treatmentPhaseUpdateSchema.safeParse({
    treatmentId: formData.get("treatmentId"),
    phaseId: formData.get("phaseId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    redirect(`/dashboard${buildErrorSearch("No se pudo actualizar la fase.")}`);
  }

  const phase = await prisma.treatmentPhase.findFirst({
    where: {
      id: parsed.data.phaseId,
      treatmentId: parsed.data.treatmentId,
      treatment: {
        isDemo: user.isDemo,
      },
    },
    select: {
      id: true,
      treatmentId: true,
    },
  });

  if (!phase) {
    redirect(`/dashboard${buildErrorSearch("El tratamiento no existe en tu entorno.")}`);
  }

  await prisma.treatmentPhase.update({
    where: { id: phase.id },
    data: {
      status: parsed.data.status,
      completedDate: parsed.data.status === PhaseStatus.COMPLETED ? new Date() : null,
    },
  });

  const phases = await prisma.treatmentPhase.findMany({
    where: { treatmentId: phase.treatmentId },
    select: { status: true },
  });

  const allClosed = phases.every(
    (phase) => phase.status === PhaseStatus.COMPLETED || phase.status === PhaseStatus.SKIPPED,
  );

  await prisma.treatment.update({
    where: { id: phase.treatmentId },
    data: allClosed
      ? {
          status: TreatmentStatus.COMPLETED,
          actualEndDate: new Date(),
        }
      : {
          status: TreatmentStatus.IN_PROGRESS,
          actualEndDate: null,
        },
  });

  await recordAudit({
    actorId: user.id,
    entityType: "phase",
    entityId: parsed.data.phaseId,
    action: "PHASE_STATUS_UPDATED",
    description: `Fase actualizada a ${parsed.data.status}.`,
  });

  revalidatePath("/dashboard");
  revalidatePath(`/treatments/${phase.treatmentId}`);
  redirect(`/treatments/${phase.treatmentId}${buildSuccessSearch("Fase actualizada.")}`);
}

export async function updateTreatmentAction(formData: FormData) {
  const user = await requireBaseRole(["ADMIN", "DENTIST", "ASSISTANT", "RECEPTIONIST"]);
  const treatmentId = String(formData.get("treatmentId") ?? "");
  const editRedirectPath = treatmentId ? `/treatments/${treatmentId}/edit` : "/dashboard";

  const parsed = treatmentUpdateSchema.safeParse({
    treatmentId: formData.get("treatmentId"),
    dentistId: formData.get("dentistId"),
    title: formData.get("title"),
    diagnosis: formData.get("diagnosis"),
    startDate: formData.get("startDate"),
    estimatedEndDate: formData.get("estimatedEndDate"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    redirect(`${editRedirectPath}${buildErrorSearch(parsed.error.issues[0]?.message ?? "No se pudo actualizar el tratamiento.")}`);
  }

  const existingTreatment = await prisma.treatment.findFirst({
    where: {
      id: parsed.data.treatmentId,
      isDemo: user.isDemo,
    },
    select: {
      id: true,
      patientId: true,
    },
  });

  if (!existingTreatment) {
    redirect(`/dashboard${buildErrorSearch("El tratamiento no existe en tu entorno.")}`);
  }

  let dentistId: string | undefined;

  if (parsed.data.dentistId) {
    const dentist = await prisma.user.findFirst({
      where: {
        id: parsed.data.dentistId,
        isDemo: user.isDemo,
        active: true,
        role: {
          in: getConcreteRolesForBaseRoles(["ADMIN", "DENTIST"]),
        },
      },
      select: {
        id: true,
      },
    });

    if (!dentist) {
      redirect(`${editRedirectPath}${buildErrorSearch("El responsable no existe en tu entorno.")}`);
    }

    dentistId = dentist.id;
  }

  const treatment = await prisma.treatment.update({
    where: {
      id: existingTreatment.id,
    },
    data: {
      dentistId,
      title: parsed.data.title,
      diagnosis: parsed.data.diagnosis ?? "",
      startDate: new Date(parsed.data.startDate),
      estimatedEndDate: new Date(parsed.data.estimatedEndDate),
      notes: parsed.data.notes,
    },
  });

  await recordAudit({
    actorId: user.id,
    entityType: "treatment",
    entityId: treatment.id,
    action: "TREATMENT_UPDATED",
    description: `Se actualizo el tratamiento ${treatment.title}.`,
  });

  revalidatePath("/dashboard");
  revalidatePath("/patients");
  revalidatePath("/appointments");
  revalidatePath("/appointments/new");
  revalidatePath(`/patients/${existingTreatment.patientId}`);
  revalidatePath(`/treatments/${treatment.id}`);
  revalidatePath(`/treatments/${treatment.id}/edit`);

  redirect(`/treatments/${treatment.id}${buildSuccessSearch("Tratamiento actualizado correctamente.")}`);
}
