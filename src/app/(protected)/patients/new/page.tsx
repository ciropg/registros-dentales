import { NewPatientForm } from "@/components/patients/new-patient-form";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";

export default function NewPatientPage() {
  return (
    <main className="space-y-6 py-4 lg:py-8">
      <Topbar
        title="Nuevo paciente"
        description="Registra la ficha basica del paciente. Solo nombres y apellidos son obligatorios."
      />

      <Card>
        <NewPatientForm />
      </Card>
    </main>
  );
}
