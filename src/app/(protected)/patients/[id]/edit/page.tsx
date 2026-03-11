import { notFound } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { EditPatientForm } from "@/components/patients/edit-patient-form";
import { Card } from "@/components/ui/card";
import { requireBaseRole } from "@/lib/auth";
import { getPatientFormDetail } from "@/modules/patients/queries";

export default async function EditPatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireBaseRole(["ADMIN", "ASSISTANT", "RECEPTIONIST"]);
  const { id } = await params;
  const patient = await getPatientFormDetail(id, user.isDemo);

  if (!patient) {
    notFound();
  }

  return (
    <main className="space-y-6 py-4 lg:py-8">
      <Topbar
        title="Editar paciente"
        description="Actualiza los datos del paciente sin perder su historial clinico, citas ni tratamientos."
      />

      <Card>
        <EditPatientForm patient={patient} />
      </Card>
    </main>
  );
}
