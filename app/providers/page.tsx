import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { ClientsTable } from "@/components/clients/clients-table"
import { CompanyType } from "@/types"

export default function ProvidersPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Proveedores" text="Gestiona la información de tus proveedores" />
      <ClientsTable companyType={CompanyType.PROVIDER} title="Proveedores" />
    </DashboardShell>
  )
}

