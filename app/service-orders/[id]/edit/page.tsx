"use client"

import { use } from "react"
import { notFound } from "next/navigation"
import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { ServiceOrderForm } from "@/components/service-orders/service-order-form"
import { useServiceOrderStore } from "@/lib/stores/useServiceOrderStore"
import type { ServiceOrder } from "@/types"

export default function EditServiceOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const id = resolvedParams.id

  if (!id) {
    notFound()
  }

  const { getServiceOrder, updateServiceOrder } = useServiceOrderStore()

  const serviceOrder = use(getServiceOrder(id))

  if (!serviceOrder) {
    notFound()
  }

  async function handleUpdateServiceOrder(data: Omit<ServiceOrder, "id" | "createdAt" | "updatedAt">) {
    await updateServiceOrder(id, data)
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading={`Editar Orden de Servicio #${serviceOrder.number}`}
        text={`Cliente: ${serviceOrder.client.name}`}
      />
      <div className="grid gap-10">
        <ServiceOrderForm id={id} serviceOrder={serviceOrder} onSubmit={handleUpdateServiceOrder} />
      </div>
    </DashboardShell>
  )
}

