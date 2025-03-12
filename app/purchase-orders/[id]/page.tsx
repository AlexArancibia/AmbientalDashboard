"use client"
import { useEffect, useState } from "react"
import { notFound } from "next/navigation"
import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { PurchaseOrderDetail } from "@/components/purchase-orders/purchase-order-detail"
import { usePurchaseOrderStore } from "@/lib/stores/usePurchaseOrderStore"
import { PurchaseOrder } from "@/types"

export default function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null)

  const { getPurchaseOrder } = usePurchaseOrderStore()

  useEffect(() => {
    async function fetchData() {
      try {
        const { id } = await params // Esperamos a que `params` se resuelva
        const order = await getPurchaseOrder(id) // Obtenemos la orden de compra

        if (!order) {
          notFound()
        } else {
          setPurchaseOrder(order)
        }
      } catch (error) {
        console.error("Error fetching purchase order:", error)
        notFound()
      }
    }

    fetchData()
  }, [params, getPurchaseOrder])

  if (!purchaseOrder) return null // Evita renderizar hasta que haya datos

  return (
    <DashboardShell>
      <DashboardHeader
        heading={`Orden de Compra #${purchaseOrder.id}`}
        text={`Fecha: ${new Date(purchaseOrder.date).toLocaleDateString()}`}
      />
      <PurchaseOrderDetail purchaseOrder={purchaseOrder} />
    </DashboardShell>
  )
}
