import { prisma } from "@/lib/prisma";
import { getConcreteRolesForBaseRoles } from "@/lib/roles";
import { treatmentDetailInclude, calculateTreatmentMetrics } from "@/modules/treatments/calculators";

export async function getTreatmentDetail(treatmentId: string) {
  const treatment = await prisma.treatment.findUnique({
    where: { id: treatmentId },
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
