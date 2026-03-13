# Registros Dentales

Sistema web para una clinica dental construido con:

- Next.js App Router
- TypeScript
- Prisma ORM
- SQLite
- Tailwind CSS

## Alcance del MVP

- Login con sesion por cookie firmada
- Dashboard con metricas operativas
- Registro y consulta de pacientes
- Registro y seguimiento de tratamientos
- Avance calculado por fases ponderadas
- Agenda de citas con estados:
  - Agendada
  - Asistio
  - No asistio
  - Reprogramada
  - Cancelada

## Estructura principal

```txt
src/
  app/
    login/
    (protected)/
      dashboard/
      patients/
      treatments/
      appointments/
  components/
  lib/
  modules/
prisma/
  schema.prisma
  migrations/
  seed.ts
```

## Scripts

```bash
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

## Credenciales demo

- `demo.admin@clinic.local / DemoAdmin123!`
- `demo.dentista@clinic.local / DemoDentista123!`
- `demo.asistente@clinic.local / DemoAsistente123!`
- `demo.recepcion@clinic.local / DemoRecepcion123!`

Los usuarios reales existen para operacion interna, pero sus credenciales no se publican en este repositorio.

## Modelo principal

- `User`
- `Patient`
- `Treatment`
- `TreatmentPhase`
- `Appointment`
- `AuditLog`

## Reglas de negocio implementadas

- El tiempo transcurrido y restante se calcula a partir de las fechas del tratamiento.
- El porcentaje de avance se calcula segun el peso de las fases completadas.
- El detalle del tratamiento resume citas asistidas, no asistidas, reprogramadas y canceladas.
- Al cerrar todas las fases, el tratamiento pasa a `COMPLETED`.

## Seguridad aplicada

- Cookie `httpOnly`
- Firma de sesion con `AUTH_SECRET`
- Password hashing con `bcryptjs`
- Validacion de entradas con `zod`
- Autorizacion por roles en acciones sensibles
- Auditoria basica en cambios importantes
