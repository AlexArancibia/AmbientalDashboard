"use client"

import { PurchaseOrderForm } from "@/components/purchase-orders/purchase-order-form"
import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { usePurchaseOrderStore } from "@/lib/stores/usePurchaseOrderStore"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import type { PurchaseOrder } from "@/types"

export default function NewPurchaseOrderPage() {
  const router = useRouter()
  const { createPurchaseOrder } = usePurchaseOrderStore()

  const handleCreatePurchaseOrder = async (
    data: Omit<PurchaseOrder, "id" | "createdAt" | "updatedAt" | "deletedAt">,
  ) => {
    try {
      await createPurchaseOrder(data)
      toast({
        title: "Orden de compra creada",
        description: "La orden de compra ha sido creada exitosamente.",
      })
      router.push("/purchase-orders")
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al crear la orden de compra.",
        variant: "destructive",
      })
    }
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Nueva Orden de Compra" text="Crear una nueva orden de compra" />
      <PurchaseOrderForm onSubmit={handleCreatePurchaseOrder} />
    </DashboardShell>
  )
}

