import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
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

export async function getTreatmentFormOptions() {
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
          in: [UserRole.DENTIST, UserRole.ADMIN],
        },
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
