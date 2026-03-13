import { notFound } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { EditPatientForm } from "@/components/patients/edit-patient-form";
import { Card } from "@/components/ui/card";
import { requireBaseRole } from "@/lib/auth";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getPatientFormDetail } from "@/modules/patients/queries";

export default async function EditPatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [user, locale] = await Promise.all([requireBaseRole(["ADMIN", "ASSISTANT", "RECEPTIONIST"]), getCurrentLocale()]);
  const { id } = await params;
  const patient = await getPatientFormDetail(id, user.isDemo);

  if (!patient) {
    notFound();
  }

  return (
    <main className="space-y-6 py-4 lg:py-8">
      <Topbar
        title={locale === "en" ? "Edit patient" : "Editar paciente"}
        description={
          locale === "en"
            ? "Update patient data without losing clinical history, appointments, or treatments."
            : "Actualiza los datos del paciente sin perder su historial clinico, citas ni tratamientos."
        }
        locale={locale}
      />

      <Card>
        <EditPatientForm patient={patient} />
      </Card>
    </main>
  );
}
