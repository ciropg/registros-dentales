import { prisma } from "@/lib/prisma";
import { calculateTreatmentMetrics } from "@/modules/treatments/calculators";

export async function listPatients(search?: string) {
  const query = search?.trim();

  const patients = await prisma.patient.findMany({
    where: query
      ? {
          OR: [
            { firstName: { contains: query } },
            { lastName: { contains: query } },
            { documentNumber: { contains: query } },
          ],
        }
      : undefined,
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: {
      treatments: {
        include: {
          phases: true,
        },
      },
      _count: {
        select: {
          appointments: true,
        },
      },
    },
  });

  return patients.map((patient) => {
    const activeTreatment = patient.treatments.find((treatment) => treatment.status !== "COMPLETED");

    return {
      ...patient,
      activeTreatment: activeTreatment
        ? {
            id: activeTreatment.id,
            title: activeTreatment.title,
            status: activeTreatment.status,
            ...calculateTreatmentMetrics(activeTreatment),
          }
        : null,
    };
  });
}

export async function getPatientDetail(patientId: string, isDemo: boolean) {
  const [patient, photoUsageCount] = await Promise.all([
    prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        treatments: {
          include: {
            dentist: {
              select: {
                id: true,
                name: true,
              },
            },
            phases: {
              orderBy: {
                phaseOrder: "asc",
              },
            },
            appointments: {
              orderBy: {
                scheduledAt: "desc",
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        appointments: {
          orderBy: {
            scheduledAt: "desc",
          },
        },
        photos: {
          where: {
            isDemo,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    }),
    prisma.patientPhoto.count({
      where: {
        isDemo,
      },
    }),
  ]);

  if (!patient) {
    return null;
  }

  return {
    ...patient,
    photoUsageCount,
    treatments: patient.treatments.map((treatment) => ({
      ...treatment,
      metrics: calculateTreatmentMetrics(treatment),
    })),
  };
}

export async function getPatientOptions() {
  return prisma.patient.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  });
}
