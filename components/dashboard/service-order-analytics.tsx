"use client"

import { useMemo } from "react"
import { type Client, type ServiceOrder, ServiceOrderStatus, Currency } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ClipboardList, CheckCircle, Clock, XCircle } from "lucide-react"

interface ServiceOrderAnalyticsProps {
  serviceOrders: ServiceOrder[]
  clients: Client[]
  startDate: Date
  endDate: Date
}

export function ServiceOrderAnalytics({ serviceOrders, clients, startDate, endDate }: ServiceOrderAnalyticsProps) {
  // Filtrar órdenes por rango de fechas
  const filteredOrders = useMemo(() => {
    return serviceOrders.filter((order) => {
      const orderDate = new Date(order.date)
      return orderDate >= startDate && orderDate <= endDate
    })
  }, [serviceOrders, startDate, endDate])

  // Contar órdenes por estado
  const ordersByStatus = useMemo(() => {
    const statusCounts: Record<string, number> = {
      [ServiceOrderStatus.PENDING]: 0,
      [ServiceOrderStatus.IN_PROGRESS]: 0,
      [ServiceOrderStatus.COMPLETED]: 0,
      [ServiceOrderStatus.CANCELLED]: 0,
    }

    filteredOrders.forEach((order) => {
      statusCounts[order.status] += 1
    })

    return Object.entries(statusCounts).map(([status, count]) => {
      let name = status
      let color = "#888888"

      switch (status) {
        case ServiceOrderStatus.PENDING:
          name = "Pendiente"
          color = "#f59e0b" // amber-500
          break
        case ServiceOrderStatus.IN_PROGRESS:
          name = "En Progreso"
          color = "#3b82f6" // blue-500
          break
        case ServiceOrderStatus.COMPLETED:
          name = "Completada"
          color = "#10b981" // emerald-500
          break
        case ServiceOrderStatus.CANCELLED:
          name = "Cancelada"
          color = "#ef4444" // red-500
          break
      }

      return { name, value: count, color }
    })
  }, [filteredOrders])

  // Calcular valor total de órdenes por estado
  const orderValueByStatus = useMemo(() => {
    const statusValues: Record<string, number> = {
      [ServiceOrderStatus.PENDING]: 0,
      [ServiceOrderStatus.IN_PROGRESS]: 0,
      [ServiceOrderStatus.COMPLETED]: 0,
      [ServiceOrderStatus.CANCELLED]: 0,
    }

    filteredOrders.forEach((order) => {
      const amount = order.currency === Currency.USD ? order.total * 3.7 : order.total
      statusValues[order.status] += amount
    })

    return statusValues
  }, [filteredOrders])

  // Calcular tendencia de órdenes por mes
  const ordersByMonth = useMemo(() => {
    const months: Record<string, { month: string; total: number; completed: number; inProgress: number }> = {}

    filteredOrders.forEach((order) => {
      const date = new Date(order.date)
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`
      const monthName = date.toLocaleString("es-ES", { month: "short", year: "2-digit" })

      if (!months[monthKey]) {
        months[monthKey] = { month: monthName, total: 0, completed: 0, inProgress: 0 }
      }

      months[monthKey].total += 1

      if (order.status === ServiceOrderStatus.COMPLETED) {
        months[monthKey].completed += 1
      } else if (order.status === ServiceOrderStatus.IN_PROGRESS) {
        months[monthKey].inProgress += 1
      }
    })

    return Object.values(months).sort((a, b) => {
      const [aMonth, aYear] = a.month.split(" ")
      const [bMonth, bYear] = b.month.split(" ")
      return Number.parseInt(aYear) - Number.parseInt(bYear) || aMonth.localeCompare(bMonth)
    })
  }, [filteredOrders])

  // Calcular servicios más solicitados
  const topServices = useMemo(() => {
    const services: Record<string, { description: string; count: number; revenue: number }> = {}

    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!services[item.description]) {
          services[item.description] = { description: item.description, count: 0, revenue: 0 }
        }

        services[item.description].count += 1
        const amount = order.currency === Currency.USD ? item.total * 3.7 : item.total
        services[item.description].revenue += amount
      })
    })

    return Object.values(services)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [filteredOrders])

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return `S/. ${amount.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Órdenes</CardTitle>
            <ClipboardList className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredOrders.length}</div>
            <p className="text-xs text-muted-foreground mt-1">En el período seleccionado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Órdenes Completadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredOrders.filter((o) => o.status === ServiceOrderStatus.COMPLETED).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-emerald-500 font-medium">
                {formatCurrency(orderValueByStatus[ServiceOrderStatus.COMPLETED])}
              </span>{" "}
              en ingresos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Órdenes en Progreso</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredOrders.filter((o) => o.status === ServiceOrderStatus.IN_PROGRESS).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-amber-500 font-medium">
                {formatCurrency(orderValueByStatus[ServiceOrderStatus.IN_PROGRESS])}
              </span>{" "}
              pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Cancelación</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredOrders.length > 0
                ? `${Math.round((filteredOrders.filter((o) => o.status === ServiceOrderStatus.CANCELLED).length / filteredOrders.length) * 100)}%`
                : "0%"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Órdenes canceladas vs. totales</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Estado de Órdenes</CardTitle>
            <CardDescription>Distribución por estado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ordersByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {ordersByStatus.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        className="stroke-background dark:stroke-background"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [`${value} órdenes`, name]}
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      borderColor: "var(--border)",
                      borderRadius: "0.375rem",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Servicios Más Solicitados</CardTitle>
            <CardDescription>Top 5 servicios por frecuencia</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Servicio</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Ingresos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topServices.length > 0 ? (
                  topServices.map((service, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {service.description.length > 30
                          ? service.description.substring(0, 30) + "..."
                          : service.description}
                      </TableCell>
                      <TableCell className="text-right">{service.count}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(service.revenue)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                      No hay datos suficientes para este período
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

