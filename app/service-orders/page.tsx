import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ServiceOrdersTable } from "@/components/service-orders/service-orders-table"
import Link from "next/link"

export default function ServiceOrdersPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Órdenes de Servicio" text="Gestiona las órdenes de servicio para tus clientes">
        <Button asChild>
          <Link href="/service-orders/new">
            <Plus className="mr-2 h-4 w-4" /> Crear Orden de Servicio
          </Link>
        </Button>
      </DashboardHeader>
      <ServiceOrdersTable />
    </DashboardShell>
  )
}

