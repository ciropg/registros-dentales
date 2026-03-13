import { loadEnvConfig } from "@next/env";
import { AppointmentStatus, PhaseStatus, PrismaClient, TreatmentStatus, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, subDays } from "date-fns";
import {
  getAllUserRoles,
  getRoleDescription,
  getRoleLabel,
  isDemoRole,
} from "../src/lib/roles";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

function readRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Falta la variable de entorno requerida: ${name}`);
  }

  return value;
}

async function main() {
  await prisma.appointment.deleteMany();
  await prisma.treatmentPhase.deleteMany();
  await prisma.treatment.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  await prisma.role.createMany({
    data: getAllUserRoles().map((role) => ({
      code: role,
      name: getRoleLabel(role),
      description: getRoleDescription(role),
      isDemo: isDemoRole(role),
    })),
  });

  const roles = await prisma.role.findMany({
    select: {
      id: true,
      code: true,
    },
  });
  const roleIdByCode = new Map(roles.map((role) => [role.code, role.id]));

  const userSeeds = [
    {
      name: "Administrador",
      email: readRequiredEnv("REAL_ADMIN_EMAIL"),
      password: readRequiredEnv("REAL_ADMIN_PASSWORD"),
      role: UserRole.ADMIN,
      isDemo: false,
    },
    {
      name: "Dra. Camila Torres",
      email: readRequiredEnv("REAL_DENTIST_EMAIL"),
      password: readRequiredEnv("REAL_DENTIST_PASSWORD"),
      role: UserRole.DENTIST,
      isDemo: false,
    },
    {
      name: "Lucia Ramos",
      email: readRequiredEnv("REAL_ASSISTANT_EMAIL"),
      password: readRequiredEnv("REAL_ASSISTANT_PASSWORD"),
      role: UserRole.ASSISTANT,
      isDemo: false,
    },
    {
      name: "Mariela Soto",
      email: readRequiredEnv("REAL_RECEPTIONIST_EMAIL"),
      password: readRequiredEnv("REAL_RECEPTIONIST_PASSWORD"),
      role: UserRole.RECEPTIONIST,
      isDemo: false,
    },
    {
      name: "Demo Administrador",
      email: "demo.admin@clinic.local",
      password: "DemoAdmin123!",
      role: UserRole.DEMO_ADMIN,
      isDemo: true,
    },
    {
      name: "Demo Dra. Carla Vega",
      email: "demo.dentista@clinic.local",
      password: "DemoDentista123!",
      role: UserRole.DEMO_DENTIST,
      isDemo: true,
    },
    {
      name: "Demo Paula Rios",
      email: "demo.asistente@clinic.local",
      password: "DemoAsistente123!",
      role: UserRole.DEMO_ASSISTANT,
      isDemo: true,
    },
    {
      name: "Demo Ana Perez",
      email: "demo.recepcion@clinic.local",
      password: "DemoRecepcion123!",
      role: UserRole.DEMO_RECEPTIONIST,
      isDemo: true,
    },
  ];

  const createdUsers = await Promise.all(
    userSeeds.map(async (user) => {
      const roleId = roleIdByCode.get(user.role);

      if (!roleId) {
        throw new Error(`No se encontro el rol ${user.role} durante el seed.`);
      }

      return prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          passwordHash: await bcrypt.hash(user.password, 10),
          roleId,
          role: user.role,
          isDemo: user.isDemo,
        },
      });
    }),
  );

  const demoAdmin = createdUsers.find((user) => user.role === UserRole.DEMO_ADMIN);
  const demoDentist = createdUsers.find((user) => user.role === UserRole.DEMO_DENTIST);

  if (!demoAdmin || !demoDentist) {
    throw new Error("No se pudieron crear los usuarios base para el seed.");
  }

  const patientOne = await prisma.patient.create({
    data: {
      firstName: "Mario",
      lastName: "Quispe",
      documentNumber: "70214488",
      phone: "999111222",
      email: "mario.quispe@email.local",
      birthDate: new Date("1990-03-14"),
      notes: "Paciente con seguimiento ortodontico quincenal.",
      isDemo: true,
    },
  });

  const patientTwo = await prisma.patient.create({
    data: {
      firstName: "Valeria",
      lastName: "Sanchez",
      documentNumber: "48871210",
      phone: "988777666",
      email: "valeria.sanchez@email.local",
      birthDate: new Date("1988-08-29"),
      notes: "Paciente en rehabilitacion y control periodontal.",
      isDemo: true,
    },
  });

  const patientThree = await prisma.patient.create({
    data: {
      firstName: "Camila",
      lastName: "Herrera",
      documentNumber: "61120557",
      phone: "977665544",
      email: "camila.herrera@email.local",
      birthDate: new Date("1995-11-05"),
      notes: "Paciente de mantenimiento preventivo con controles trimestrales.",
      isDemo: true,
    },
  });

  const orthodontic = await prisma.treatment.create({
    data: {
      patientId: patientOne.id,
      dentistId: demoDentist.id,
      title: "Ortodoncia integral",
      diagnosis: "Maloclusion clase II y apinamiento moderado.",
      startDate: subDays(new Date(), 42),
      estimatedEndDate: addDays(new Date(), 120),
      status: TreatmentStatus.IN_PROGRESS,
      notes: "Se esperan controles cada 15 dias.",
      isDemo: true,
      phases: {
        create: [
          {
            name: "Diagnostico y radiografias",
            phaseOrder: 1,
            weight: 2,
            status: PhaseStatus.COMPLETED,
            plannedDate: subDays(new Date(), 50),
            completedDate: subDays(new Date(), 46),
          },
          {
            name: "Instalacion de brackets",
            phaseOrder: 2,
            weight: 3,
            status: PhaseStatus.COMPLETED,
            plannedDate: subDays(new Date(), 40),
            completedDate: subDays(new Date(), 37),
          },
          {
            name: "Controles y ajuste",
            phaseOrder: 3,
            weight: 4,
            status: PhaseStatus.IN_PROGRESS,
            plannedDate: subDays(new Date(), 20),
          },
          {
            name: "Retencion final",
            phaseOrder: 4,
            weight: 1,
            status: PhaseStatus.PENDING,
            plannedDate: addDays(new Date(), 110),
          },
        ],
      },
    },
  });

  const rehabilitation = await prisma.treatment.create({
    data: {
      patientId: patientTwo.id,
      dentistId: demoDentist.id,
      title: "Rehabilitacion oral",
      diagnosis: "Desgaste oclusal y necesidad de coronas unitarias.",
      startDate: subDays(new Date(), 18),
      estimatedEndDate: addDays(new Date(), 45),
      status: TreatmentStatus.IN_PROGRESS,
      notes: "Priorizar citas de prueba y control oclusal.",
      isDemo: true,
      phases: {
        create: [
          {
            name: "Preparacion de piezas",
            phaseOrder: 1,
            weight: 3,
            status: PhaseStatus.COMPLETED,
            plannedDate: subDays(new Date(), 17),
            completedDate: subDays(new Date(), 16),
          },
          {
            name: "Impresiones",
            phaseOrder: 2,
            weight: 2,
            status: PhaseStatus.COMPLETED,
            plannedDate: subDays(new Date(), 13),
            completedDate: subDays(new Date(), 12),
          },
          {
            name: "Prueba clinica",
            phaseOrder: 3,
            weight: 2,
            status: PhaseStatus.PENDING,
            plannedDate: addDays(new Date(), 3),
          },
          {
            name: "Cementacion",
            phaseOrder: 4,
            weight: 3,
            status: PhaseStatus.PENDING,
            plannedDate: addDays(new Date(), 18),
          },
        ],
      },
    },
  });

  const preventiveCare = await prisma.treatment.create({
    data: {
      patientId: patientThree.id,
      dentistId: demoDentist.id,
      title: "Mantenimiento preventivo",
      diagnosis: "Control de placa y sellantes preventivos.",
      startDate: subDays(new Date(), 5),
      estimatedEndDate: addDays(new Date(), 20),
      status: TreatmentStatus.IN_PROGRESS,
      notes: "Coordinar higiene, profilaxis y control de sensibilidad.",
      isDemo: true,
      phases: {
        create: [
          {
            name: "Evaluacion clinica",
            phaseOrder: 1,
            weight: 2,
            status: PhaseStatus.COMPLETED,
            plannedDate: subDays(new Date(), 5),
            completedDate: subDays(new Date(), 4),
          },
          {
            name: "Profilaxis",
            phaseOrder: 2,
            weight: 2,
            status: PhaseStatus.IN_PROGRESS,
            plannedDate: subDays(new Date(), 1),
          },
          {
            name: "Aplicacion de sellantes",
            phaseOrder: 3,
            weight: 2,
            status: PhaseStatus.PENDING,
            plannedDate: addDays(new Date(), 8),
          },
          {
            name: "Control final",
            phaseOrder: 4,
            weight: 1,
            status: PhaseStatus.PENDING,
            plannedDate: addDays(new Date(), 18),
          },
        ],
      },
    },
  });

  await prisma.appointment.createMany({
    data: [
      {
        patientId: patientOne.id,
        treatmentId: orthodontic.id,
        scheduledAt: subDays(new Date(), 30),
        status: AppointmentStatus.ATTENDED,
        reason: "Control y ajuste",
        notes: "Sin incidencias.",
        isDemo: true,
      },
      {
        patientId: patientOne.id,
        treatmentId: orthodontic.id,
        scheduledAt: subDays(new Date(), 15),
        status: AppointmentStatus.NO_SHOW,
        reason: "Control mensual",
        isDemo: true,
      },
      {
        patientId: patientOne.id,
        treatmentId: orthodontic.id,
        scheduledAt: addDays(new Date(), 2),
        status: AppointmentStatus.SCHEDULED,
        reason: "Control y ajuste",
        isDemo: true,
      },
      {
        patientId: patientTwo.id,
        treatmentId: rehabilitation.id,
        scheduledAt: subDays(new Date(), 7),
        status: AppointmentStatus.ATTENDED,
        reason: "Control de impresiones",
        isDemo: true,
      },
      {
        patientId: patientTwo.id,
        treatmentId: rehabilitation.id,
        scheduledAt: addDays(new Date(), 4),
        status: AppointmentStatus.RESCHEDULED,
        reason: "Prueba clinica",
        notes: "Paciente solicito cambio por viaje.",
        isDemo: true,
      },
      {
        patientId: patientTwo.id,
        treatmentId: rehabilitation.id,
        scheduledAt: addDays(new Date(), 6),
        status: AppointmentStatus.SCHEDULED,
        reason: "Prueba clinica reprogramada",
        isDemo: true,
      },
      {
        patientId: patientThree.id,
        treatmentId: preventiveCare.id,
        scheduledAt: startOfTodayAtHour(11),
        status: AppointmentStatus.SCHEDULED,
        reason: "Control preventivo",
        notes: "Cita visible en el dashboard demo de hoy.",
        isDemo: true,
      },
      {
        patientId: patientThree.id,
        treatmentId: preventiveCare.id,
        scheduledAt: addDays(new Date(), 8),
        status: AppointmentStatus.SCHEDULED,
        reason: "Aplicacion de sellantes",
        isDemo: true,
      },
    ],
  });

  await prisma.auditLog.create({
    data: {
      actorId: demoAdmin.id,
      entityType: "seed",
      entityId: "initial-load",
      action: "DEMO_SEED_EXECUTED",
      description: "Carga inicial de datos demo de ejemplo.",
    },
  });

  console.log("Seed completa.");
  console.log("Las credenciales reales se cargaron desde variables REAL_* del entorno local.");
  console.log("Demo admin: demo.admin@clinic.local / DemoAdmin123!");
  console.log("Demo dentista: demo.dentista@clinic.local / DemoDentista123!");
  console.log("Demo asistente: demo.asistente@clinic.local / DemoAsistente123!");
  console.log("Demo recepcionista: demo.recepcion@clinic.local / DemoRecepcion123!");
}

function startOfTodayAtHour(hour: number) {
  const date = new Date();

  date.setHours(hour, 0, 0, 0);

  return date;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
