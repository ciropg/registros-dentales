import { prisma } from "@/lib/prisma";
import { getConcreteRolesForBaseRoles } from "@/lib/roles";
import { treatmentDetailInclude, calculateTreatmentMetrics } from "@/modules/treatments/calculators";

export async function getTreatmentDetail(treatmentId: string, isDemo: boolean) {
  const treatment = await prisma.treatment.findFirst({
    where: {
      id: treatmentId,
      isDemo,
    },
    include: treatmentDetailInclude,
  });

  if (!treatment) {
    return null;
  }

  return {
    ...treatment,
    metrics: calculateTreatmentMetrics(treatment),
  };
}

export async function getTreatmentFormOptions(isDemo: boolean) {
  const [patients, dentists] = await Promise.all([
    prisma.patient.findMany({
      where: {
        isDemo,
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    }),
    prisma.user.findMany({
      where: {
        role: {
          in: getConcreteRolesForBaseRoles(["ADMIN", "DENTIST"]),
        },
        isDemo,
        active: true,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  return {
    patients,
    dentists,
  };
}

export async function getTreatmentFormDetail(treatmentId: string, isDemo: boolean) {
  return prisma.treatment.findFirst({
    where: {
      id: treatmentId,
      isDemo,
    },
    select: {
      id: true,
      patientId: true,
      title: true,
      diagnosis: true,
      startDate: true,
      estimatedEndDate: true,
      notes: true,
      dentistId: true,
      patient: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}
