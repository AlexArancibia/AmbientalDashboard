"use client"

import { use } from "react"
import { notFound } from "next/navigation"
import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { PurchaseOrderForm } from "@/components/purchase-orders/purchase-order-form"
import { usePurchaseOrderStore } from "@/lib/stores/usePurchaseOrderStore"
import type { PurchaseOrder } from "@/types"

export default function EditPurchaseOrderPage({ params }: { params: Promise<{ id: string }> }) {
  // Resolve the params Promise outside of try/catch
  const resolvedParams = use(params)
  const id = resolvedParams.id

  const { getPurchaseOrder, updatePurchaseOrder } = usePurchaseOrderStore.getState()
  const purchaseOrder = use(getPurchaseOrder(id))

  if (!purchaseOrder) {
    notFound()
  }

  const handleUpdatePurchaseOrder = async (
    data: Omit<PurchaseOrder, "id" | "createdAt" | "updatedAt" | "deletedAt">,
  ) => {
    await updatePurchaseOrder(id, data)
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading={`Editar Orden de Compra #${purchaseOrder.number}`}
        text={`Fecha: ${new Date(purchaseOrder.date).toLocaleDateString()}`}
      />
      <PurchaseOrderForm purchaseOrderId={id} initialData={purchaseOrder} onSubmit={handleUpdatePurchaseOrder} />
    </DashboardShell>
  )
}

