"use client"

import { useClientStore } from "@/lib/stores/useClientStore"
import { useServiceOrderStore } from "@/lib/stores/useServiceOrderStore"
import { usePurchaseOrderStore } from "@/lib/stores/usePurchaseOrderStore"
import { useEquipmentStore } from "@/lib/stores/useEquipmentStore"
import { useQuotationStore } from "@/lib/stores/useQuotationStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, DollarSign, Users, TrendingUp, CheckCircle, Clock } from "lucide-react"
import { QuotationStatus, ServiceOrderStatus } from "@/types"

export function DashboardStats() {
  const { clients } = useClientStore()
  const { serviceOrders } = useServiceOrderStore()
  const { purchaseOrders } = usePurchaseOrderStore()
  const { equipment } = useEquipmentStore()
  const { quotations } = useQuotationStore()

  // Calcular ingresos totales (órdenes de servicio completadas)
  const totalRevenue = serviceOrders
    .filter((order) => order.status === ServiceOrderStatus.COMPLETED)
    .reduce((sum, order) => sum + order.total, 0)

  // Calcular ingresos pendientes (órdenes de servicio en progreso o pendientes)
  const pendingRevenue = serviceOrders
    .filter((order) => order.status === ServiceOrderStatus.IN_PROGRESS || order.status === ServiceOrderStatus.PENDING)
    .reduce((sum, order) => sum + order.total, 0)

  // Contar clientes activos (con órdenes en los últimos 3 meses)
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const recentClientIds = new Set([
    ...serviceOrders.filter((order) => new Date(order.date) >= threeMonthsAgo).map((order) => order.clientId),
    ...quotations.filter((quote) => new Date(quote.date) >= threeMonthsAgo).map((quote) => quote.clientId),
  ])

  const activeClients = recentClientIds.size

  // Contar equipos por estado
  const equipmentByStatus = equipment.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Contar cotizaciones por estado
  const quotationsByStatus = quotations.reduce(
    (acc, quote) => {
      acc[quote.status] = (acc[quote.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return `S/. ${amount.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-border/40 shadow-sm hover:shadow transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
          <DollarSign className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            <TrendingUp className="inline h-3 w-3 mr-1 text-emerald-500" />
            <span className="text-emerald-500 font-medium">+12%</span> vs mes anterior
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/40 shadow-sm hover:shadow transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ingresos Pendientes</CardTitle>
          <Clock className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(pendingRevenue)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            <span className="text-amber-500 font-medium">
              {
                serviceOrders.filter(
                  (o) => o.status !== ServiceOrderStatus.COMPLETED && o.status !== ServiceOrderStatus.CANCELLED,
                ).length
              }{" "}
              órdenes
            </span>{" "}
            en proceso
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/40 shadow-sm hover:shadow transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
          <Users className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeClients}</div>
          <p className="text-xs text-muted-foreground mt-1">
            <span className="text-blue-500 font-medium">{Math.round((activeClients / clients.length) * 100)}%</span> del
            total de clientes
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/40 shadow-sm hover:shadow transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cotizaciones Activas</CardTitle>
          <CreditCard className="h-4 w-4 text-indigo-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{quotationsByStatus[QuotationStatus.SENT] || 0}</div>
          <p className="text-xs text-muted-foreground mt-1">
            <CheckCircle className="inline h-3 w-3 mr-1 text-green-500" />
            <span className="text-green-500 font-medium">
              {quotationsByStatus[QuotationStatus.ACCEPTED] || 0} aceptadas
            </span>{" "}
            este mes
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

