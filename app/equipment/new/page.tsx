import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { EquipmentForm } from "@/components/equipment/equipment-form"

export default function NewEquipmentPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Nuevo Equipo" text="Agregar un nuevo equipo al inventario" />
      <EquipmentForm />
    </DashboardShell>
  )
}

