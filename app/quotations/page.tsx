import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { QuotationsTable } from "@/components/quotations/quotations-table"
import Link from "next/link"

export default function QuotationsPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Cotizaciones" text="Gestiona las cotizaciones de tus clientes">
        <Button asChild>
          <Link href="/quotations/new">
            <Plus className="mr-2 h-4 w-4" /> Crear Cotización
          </Link>
        </Button>
      </DashboardHeader>
      <QuotationsTable />
    </DashboardShell>
  )
}

