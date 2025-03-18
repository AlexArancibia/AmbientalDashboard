"use client"

import { useMemo } from "react"
import { type Client, type ServiceOrder, type Quotation, Currency, QuotationStatus, ServiceOrderStatus } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, UserPlus, UserCheck, UserMinus } from "lucide-react"

interface ClientAnalyticsProps {
  clients: Client[]
  serviceOrders: ServiceOrder[]
  quotations: Quotation[]
  startDate: Date
  endDate: Date
}

export function ClientAnalytics({ clients, serviceOrders, quotations, startDate, endDate }: ClientAnalyticsProps) {
  // Filtrar órdenes y cotizaciones por rango de fechas
  const filteredOrders = useMemo(() => {
    return serviceOrders.filter((order) => {
      const orderDate = new Date(order.date)
      return orderDate >= startDate && orderDate <= endDate
    })
  }, [serviceOrders, startDate, endDate])

  const filteredQuotations = useMemo(() => {
    return quotations.filter((quote) => {
      const quoteDate = new Date(quote.date)
      return quoteDate >= startDate && quoteDate <= endDate
    })
  }, [quotations, startDate, endDate])

  // Calcular clientes activos (con órdenes o cotizaciones en el período)
  const activeClientIds = useMemo(() => {
    const clientIds = new Set([
      ...filteredOrders.map((order) => order.clientId),
      ...filteredQuotations.map((quote) => quote.clientId),
    ])
    return Array.from(clientIds)
  }, [filteredOrders, filteredQuotations])

  // Calcular ingresos por cliente
  const revenueByClient = useMemo(() => {
    const clientRevenue: Record<string, number> = {}

    filteredOrders
      .filter((order) => order.status === ServiceOrderStatus.COMPLETED)
      .forEach((order) => {
        if (!clientRevenue[order.clientId]) {
          clientRevenue[order.clientId] = 0
        }

        const amount = order.currency === Currency.USD ? order.total * 3.7 : order.total
        clientRevenue[order.clientId] += amount
      })

    return Object.entries(clientRevenue)
      .map(([clientId, revenue]) => {
        const client = clients.find((c) => c.id === clientId)
        return {
          id: clientId,
          name: client?.name || "Cliente desconocido",
          revenue,
        }
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }, [filteredOrders, clients])

  // Calcular tasa de conversión por cliente (cotizaciones aceptadas / cotizaciones totales)
  const conversionRateByClient = useMemo(() => {
    const clientQuotes: Record<string, { total: number; accepted: number }> = {}

    filteredQuotations.forEach((quote) => {
      if (!clientQuotes[quote.clientId]) {
        clientQuotes[quote.clientId] = { total: 0, accepted: 0 }
      }

      clientQuotes[quote.clientId].total += 1

      if (quote.status === QuotationStatus.ACCEPTED) {
        clientQuotes[quote.clientId].accepted += 1
      }
    })

    return Object.entries(clientQuotes)
      .filter(([_, data]) => data.total >= 3) // Solo clientes con al menos 3 cotizaciones
      .map(([clientId, data]) => {
        const client = clients.find((c) => c.id === clientId)
        return {
          id: clientId,
          name: client?.name || "Cliente desconocido",
          rate: (data.accepted / data.total) * 100,
          total: data.total,
          accepted: data.accepted,
        }
      })
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 5)
  }, [filteredQuotations, clients])

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return `S/. ${amount.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Clientes registrados en el sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeClientIds.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-emerald-500 font-medium">
                {Math.round((activeClientIds.length / clients.length) * 100)}%
              </span>{" "}
              del total de clientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Nuevos</CardTitle>
            <UserPlus className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                clients.filter((client) => {
                  const createdAt = new Date(client.createdAt)
                  return createdAt >= startDate && createdAt <= endDate
                }).length
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">Nuevos clientes en el período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Inactivos</CardTitle>
            <UserMinus className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length - activeClientIds.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-amber-500 font-medium">
                {Math.round(((clients.length - activeClientIds.length) / clients.length) * 100)}%
              </span>{" "}
              sin actividad reciente
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Clientes por Ingresos</CardTitle>
            <CardDescription>Clientes que generan más ingresos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByClient} layout="vertical">
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

        <Card>
          <CardHeader>
            <CardTitle>Mejores Tasas de Conversión</CardTitle>
            <CardDescription>Clientes con mayor tasa de aceptación de cotizaciones</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Cotizaciones</TableHead>
                  <TableHead className="text-right">Aceptadas</TableHead>
                  <TableHead className="text-right">Tasa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversionRateByClient.length > 0 ? (
                  conversionRateByClient.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell className="text-right">{client.total}</TableCell>
                      <TableCell className="text-right">{client.accepted}</TableCell>
                      <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                        {client.rate.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
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

