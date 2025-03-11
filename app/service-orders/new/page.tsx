"use client"

import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { ServiceOrderForm } from "@/components/service-orders/service-order-form"
import { useServiceOrderStore } from "@/lib/stores/useServiceOrderStore"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import type { ServiceOrder } from "@/types"

export default function NewServiceOrderPage() {
  const router = useRouter()
  const { createServiceOrder } = useServiceOrderStore()

  const handleCreateServiceOrder = async (data: Omit<ServiceOrder, "id" | "createdAt" | "updatedAt">) => {
    try {
      const newServiceOrder = await createServiceOrder(data)
      if (newServiceOrder) {
        toast({
          title: "Orden de servicio creada",
          description: "La orden de servicio ha sido creada exitosamente.",
        })
        router.push(`/service-orders/${newServiceOrder.id}`)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al crear la orden de servicio.",
        variant: "destructive",
      })
    }
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Nueva Orden de Servicio" text="Crear una nueva orden de servicio" />
      <ServiceOrderForm onSubmit={handleCreateServiceOrder} />
    </DashboardShell>
  )
}

