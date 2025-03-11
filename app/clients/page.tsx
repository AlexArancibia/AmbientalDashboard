import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { ClientsTable } from "@/components/clients/clients-table"

export default function ClientsPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Clientes" text="Gestiona la información de tus clientes" />
      <ClientsTable />
    </DashboardShell>
  )
}

