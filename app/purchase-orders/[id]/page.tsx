import { use } from "react"
import { notFound } from "next/navigation"
import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { PurchaseOrderDetail } from "@/components/purchase-orders/purchase-order-detail"
import { usePurchaseOrderStore } from "@/lib/stores/usePurchaseOrderStore"

export default function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Resolve the params Promise outside of try/catch
  const resolvedParams = use(params)
  const id = resolvedParams.id

  const { getPurchaseOrder } = usePurchaseOrderStore.getState()
  const purchaseOrder = use(getPurchaseOrder(id))

  if (!purchaseOrder) {
    notFound()
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading={`Orden de Compra #${purchaseOrder.number}`}
        text={`Fecha: ${new Date(purchaseOrder.date).toLocaleDateString()}`}
      />
      <PurchaseOrderDetail purchaseOrder={purchaseOrder} />
    </DashboardShell>
  )
}

