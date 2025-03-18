"use client"

import { useMemo } from "react"
import { type ServiceOrder, Currency, ServiceOrderStatus } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts"
import { ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, BarChart3 } from "lucide-react"

interface FinancialAnalyticsProps {
  serviceOrders: ServiceOrder[]
  startDate: Date
  endDate: Date
}

export function FinancialAnalytics({ serviceOrders, startDate, endDate }: FinancialAnalyticsProps) {
  // Filtrar órdenes por rango de fechas
  const filteredOrders = useMemo(() => {
    return serviceOrders.filter((order) => {
      const orderDate = new Date(order.date)
      return orderDate >= startDate && orderDate <= endDate
    })
  }, [serviceOrders, startDate, endDate])

  // Calcular ingresos totales
  const totalRevenue = useMemo(() => {
    return filteredOrders
      .filter((order) => order.status === ServiceOrderStatus.COMPLETED)
      .reduce((sum, order) => {
        // Convertir USD a PEN para uniformidad (tasa de cambio aproximada)
        const amount = order.currency === Currency.USD ? order.total * 3.7 : order.total
        return sum + amount
      }, 0)
  }, [filteredOrders])

  // Calcular ingresos pendientes
  const pendingRevenue = useMemo(() => {
    return filteredOrders
      .filter((order) => order.status === ServiceOrderStatus.PENDING || order.status === ServiceOrderStatus.IN_PROGRESS)
      .reduce((sum, order) => {
        const amount = order.currency === Currency.USD ? order.total * 3.7 : order.total
        return sum + amount
      }, 0)
  }, [filteredOrders])

  // Calcular ingresos por mes
  const revenueByMonth = useMemo(() => {
    const months: Record<string, { month: string; revenue: number; count: number }> = {}

    filteredOrders
      .filter((order) => order.status === ServiceOrderStatus.COMPLETED)
      .forEach((order) => {
        const date = new Date(order.date)
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`
        const monthName = date.toLocaleString("es-ES", { month: "short", year: "2-digit" })

        if (!months[monthKey]) {
          months[monthKey] = { month: monthName, revenue: 0, count: 0 }
        }

        const amount = order.currency === Currency.USD ? order.total * 3.7 : order.total
        months[monthKey].revenue += amount
        months[monthKey].count += 1
      })

    return Object.values(months).sort((a, b) => {
      const [aMonth, aYear] = a.month.split(" ")
      const [bMonth, bYear] = b.month.split(" ")
      return Number.parseInt(aYear) - Number.parseInt(bYear) || aMonth.localeCompare(bMonth)
    })
  }, [filteredOrders])

  // Calcular ingresos por tipo de servicio
  const revenueByService = useMemo(() => {
    const services: Record<string, { name: string; revenue: number; count: number }> = {}

    filteredOrders
      .filter((order) => order.status === ServiceOrderStatus.COMPLETED)
      .forEach((order) => {
        order.items.forEach((item) => {
          const serviceName =
            item.description.length > 20 ? item.description.substring(0, 20) + "..." : item.description

          if (!services[serviceName]) {
            services[serviceName] = { name: serviceName, revenue: 0, count: 0 }
          }

          const amount = order.currency === Currency.USD ? item.total! * 3.7 : item.total
          services[serviceName].revenue += amount!
          services[serviceName].count += 1
        })
      })

    return Object.values(services)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }, [filteredOrders])

  // Calcular promedio de ingresos por orden
  const averageOrderValue =
    totalRevenue / (filteredOrders.filter((order) => order.status === ServiceOrderStatus.COMPLETED).length || 1)

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return `S/. ${amount.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <ArrowUpRight className="inline h-3 w-3 mr-1 text-emerald-500" />
              <span className="text-emerald-500 font-medium">
                {filteredOrders.filter((o) => o.status === ServiceOrderStatus.COMPLETED).length} órdenes completadas
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Pendientes</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(pendingRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <ArrowDownRight className="inline h-3 w-3 mr-1 text-amber-500" />
              <span className="text-amber-500 font-medium">
                {
                  filteredOrders.filter(
                    (o) => o.status === ServiceOrderStatus.PENDING || o.status === ServiceOrderStatus.IN_PROGRESS,
                  ).length
                }{" "}
                órdenes pendientes
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Promedio</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(averageOrderValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Por orden de servicio completada</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredOrders.length > 0
                ? `${Math.round((filteredOrders.filter((o) => o.status === ServiceOrderStatus.COMPLETED).length / filteredOrders.length) * 100)}%`
                : "0%"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Órdenes completadas vs. totales</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ingresos Mensuales</CardTitle>
            <CardDescription>Tendencia de ingresos durante el período seleccionado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `S/${value / 1000}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), "Ingresos"]}
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      borderColor: "var(--border)",
                      borderRadius: "0.375rem",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 Servicios por Ingresos</CardTitle>
            <CardDescription>Servicios que generan más ingresos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByService} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={true} vertical={false} />
                  <XAxis
                    type="number"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `S/${value / 1000}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={150}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), "Ingresos"]}
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      borderColor: "var(--border)",
                      borderRadius: "0.375rem",
                    }}
                  />
                  <Bar dataKey="revenue" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

