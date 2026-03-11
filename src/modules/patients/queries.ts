import { prisma } from "@/lib/prisma";
import { calculateTreatmentMetrics } from "@/modules/treatments/calculators";

export async function listPatients(isDemo: boolean, search?: string) {
  const query = search?.trim();

  const patients = await prisma.patient.findMany({
    where: {
      isDemo,
      ...(query
        ? {
            OR: [
              { firstName: { contains: query } },
              { lastName: { contains: query } },
              { documentNumber: { contains: query } },
            ],
          }
        : {}),
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: {
      treatments: {
        where: {
          isDemo,
        },
        include: {
          phases: true,
        },
      },
      _count: {
        select: {
          appointments: {
            where: {
              isDemo,
            },
          },
          photos: {
            where: {
              isDemo,
            },
          },
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
    prisma.patient.findFirst({
      where: {
        id: patientId,
        isDemo,
      },
      include: {
        treatments: {
          where: {
            isDemo,
          },
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
              where: {
                isDemo,
              },
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
          where: {
            isDemo,
          },
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

export async function getPatientFormDetail(patientId: string, isDemo: boolean) {
  return prisma.patient.findFirst({
    where: {
      id: patientId,
      isDemo,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      documentNumber: true,
      phone: true,
      email: true,
      birthDate: true,
      notes: true,
    },
  });
}

export async function getPatientOptions(isDemo: boolean) {
  return prisma.patient.findMany({
    where: {
      isDemo,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  });
}
