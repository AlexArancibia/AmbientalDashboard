import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { ConsolidatedEquipmentView } from "@/components/equipment/consolidated-equipment-view"

export default function ConsolidatedEquipmentPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Consolidado de Equipos" text="Resumen y estadísticas de equipos" />
      <ConsolidatedEquipmentView />
    </DashboardShell>
  )
}

