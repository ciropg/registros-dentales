# Registros Dentales

Sistema web para una clinica dental construido con:

- Next.js App Router
- TypeScript
- Prisma ORM
- PostgreSQL
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
npm run db:migrate
npm run db:seed
npm run dev
```

## Variables de entorno

Usa [.env.example](./.env.example) como base. Para desarrollo local necesitas una instancia de PostgreSQL accesible desde `DATABASE_URL`.

## Despliegue en Vercel con Postgres

Flujo recomendado para produccion nueva:

1. Crea un proyecto en Vercel y conecta este repositorio.
2. Agrega una base PostgreSQL desde Vercel Marketplace. La opcion recomendada para este proyecto es Prisma Postgres.
3. Configura en Vercel las variables de entorno requeridas:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - credenciales iniciales `REAL_*` si quieres generar usuarios base con seed
4. Ejecuta las migraciones contra la base remota con:

```bash
npm run db:deploy
```

5. Si quieres poblar roles, usuarios base y cuentas demo, ejecuta una sola vez:

```bash
npm run db:seed
```

Notas:

- Este cambio deja de usar `SQLite` y no migra automaticamente el contenido previo de `prisma/dev.db`.
- El proyecto genera Prisma Client en `postinstall`, por lo que Vercel puede compilarlo sin pasos extra de generacion.
- Para despliegues automáticos, puedes configurar en Vercel el Build Command como `npm run db:deploy && npm run build`.

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
