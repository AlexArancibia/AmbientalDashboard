"use client"

import { useServiceOrderStore } from "@/lib/stores/useServiceOrderStore"
import { useClientStore } from "@/lib/stores/useClientStore"
import { ServiceOrderStatus, Currency } from "@/types"
import { ClipboardList, ArrowUpRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export function RecentServiceOrders() {
  const { serviceOrders } = useServiceOrderStore()
  const { clients } = useClientStore()

  const recentOrders = serviceOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)

  const getStatusBadge = (status: ServiceOrderStatus) => {
    switch (status) {
      case ServiceOrderStatus.PENDING:
        return (
          <Badge
            variant="outline"
            className="font-medium text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/20"
          >
            Pendiente
          </Badge>
        )
      case ServiceOrderStatus.IN_PROGRESS:
        return <Badge className="bg-blue-500 hover:bg-blue-600 font-medium">En Progreso</Badge>
      case ServiceOrderStatus.COMPLETED:
        return <Badge className="bg-green-500 hover:bg-green-600 font-medium">Completada</Badge>
      case ServiceOrderStatus.CANCELLED:
        return <Badge className="bg-red-500 hover:bg-red-600 font-medium">Cancelada</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const formatCurrency = (amount: number, currency: Currency) => {
    const symbol = currency === Currency.PEN ? "S/. " : "$ "
    return symbol + amount.toFixed(2)
  }

  return (
    <div className="space-y-4">
      {recentOrders.length > 0 ? (
        recentOrders.map((order) => {
          const client = clients.find((c) => c.id === order.clientId)
          return (
            <Link
              href={`/service-orders/${order.id}`}
              key={order.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border/40 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <ClipboardList className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{order.number}</p>
                  <p className="text-xs text-muted-foreground">{client?.name || "Cliente desconocido"}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <p className="text-sm font-medium">{formatCurrency(order.total, order.currency)}</p>
                <div className="flex items-center gap-1">
                  {getStatusBadge(order.status)}
                  <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </Link>
          )
        })
      ) : (
        <p className="text-center text-muted-foreground py-6">No hay órdenes de servicio recientes</p>
      )}
      {recentOrders.length > 0 && (
        <div className="pt-2">
          <Link href="/service-orders" className="text-xs text-primary hover:underline flex items-center justify-end">
            Ver todas las órdenes de servicio
            <ArrowUpRight className="h-3 w-3 ml-1" />
          </Link>
        </div>
      )}
    </div>
  )
}

