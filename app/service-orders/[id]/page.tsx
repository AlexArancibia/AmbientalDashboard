import { use } from "react"
import { notFound } from "next/navigation"
import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { ServiceOrderDetail } from "@/components/service-orders/service-order-detail"

export default function ServiceOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Resolve the params Promise outside of try/catch
  const resolvedParams = use(params)
  const id = resolvedParams.id

  if (!id) {
    notFound()
  }

  return (
    <DashboardShell>
      <DashboardHeader heading={`Orden de Servicio`} text={`Detalles de la orden de servicio`} />
      <ServiceOrderDetail id={id} />
    </DashboardShell>
  )
}

