import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { PurchaseOrdersTable } from "@/components/purchase-orders/purchase-orders-table"
import Link from "next/link"

export default function PurchaseOrdersPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Órdenes de Compra" text="Gestiona las órdenes de compra de tu empresa">
        <Button asChild>
          <Link href="/purchase-orders/new">
            <Plus className="mr-2 h-4 w-4" /> Crear Orden de Compra
          </Link>
        </Button>
      </DashboardHeader>
      <PurchaseOrdersTable />
    </DashboardShell>
  )
}

