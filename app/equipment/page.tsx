import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { EquipmentTable } from "@/components/equipment/equipment-table"

export default function EquipmentPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Equipos" text="Gestiona tu inventario de equipos" />
      <EquipmentTable />
    </DashboardShell>
  )
}

