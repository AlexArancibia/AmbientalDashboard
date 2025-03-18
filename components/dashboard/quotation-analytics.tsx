"use client"

import { useMemo } from "react"
import { type Client, type Quotation, QuotationStatus, Currency } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import { FileText, CheckCircle, Clock, AlertTriangle } from "lucide-react"

interface QuotationAnalyticsProps {
  quotations: Quotation[]
  clients: Client[]
  startDate: Date
  endDate: Date
}

export function QuotationAnalytics({ quotations, clients, startDate, endDate }: QuotationAnalyticsProps) {
  // Filtrar cotizaciones por rango de fechas
  const filteredQuotations = useMemo(() => {
    return quotations.filter((quote) => {
      const quoteDate = new Date(quote.date)
      return quoteDate >= startDate && quoteDate <= endDate
    })
  }, [quotations, startDate, endDate])

  // Contar cotizaciones por estado
  const quotationsByStatus = useMemo(() => {
    const statusCounts: Record<string, number> = {
      [QuotationStatus.DRAFT]: 0,
      [QuotationStatus.SENT]: 0,
      [QuotationStatus.ACCEPTED]: 0,
      [QuotationStatus.REJECTED]: 0,
      [QuotationStatus.EXPIRED]: 0,
    }

    filteredQuotations.forEach((quote) => {
      statusCounts[quote.status] += 1
    })

    return Object.entries(statusCounts).map(([status, count]) => {
      let name = status
      let color = "#888888"

      switch (status) {
        case QuotationStatus.DRAFT:
          name = "Borrador"
          color = "#94a3b8" // slate-400
          break
        case QuotationStatus.SENT:
          name = "Enviada"
          color = "#3b82f6" // blue-500
          break
        case QuotationStatus.ACCEPTED:
          name = "Aceptada"
          color = "#10b981" // emerald-500
          break
        case QuotationStatus.REJECTED:
          name = "Rechazada"
          color = "#ef4444" // red-500
          break
        case QuotationStatus.EXPIRED:
          name = "Expirada"
          color = "#f59e0b" // amber-500
          break
      }

      return { name, value: count, color }
    })
  }, [filteredQuotations])

  // Calcular valor total de cotizaciones por estado
  const quotationValueByStatus = useMemo(() => {
    const statusValues: Record<string, number> = {
      [QuotationStatus.DRAFT]: 0,
      [QuotationStatus.SENT]: 0,
      [QuotationStatus.ACCEPTED]: 0,
      [QuotationStatus.REJECTED]: 0,
      [QuotationStatus.EXPIRED]: 0,
    }

    filteredQuotations.forEach((quote) => {
      const amount = quote.currency === Currency.USD ? quote.total * 3.7 : quote.total
      statusValues[quote.status] += amount
    })

    return statusValues
  }, [filteredQuotations])

  // Calcular tendencia de cotizaciones por mes
  const quotationsByMonth = useMemo(() => {
    const months: Record<string, { month: string; total: number; accepted: number; rejected: number }> = {}

    filteredQuotations.forEach((quote) => {
      const date = new Date(quote.date)
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`
      const monthName = date.toLocaleString("es-ES", { month: "short", year: "2-digit" })

      if (!months[monthKey]) {
        months[monthKey] = { month: monthName, total: 0, accepted: 0, rejected: 0 }
      }

      months[monthKey].total += 1

      if (quote.status === QuotationStatus.ACCEPTED) {
        months[monthKey].accepted += 1
      } else if (quote.status === QuotationStatus.REJECTED) {
        months[monthKey].rejected += 1
      }
    })

    return Object.values(months).sort((a, b) => {
      const [aMonth, aYear] = a.month.split(" ")
      const [bMonth, bYear] = b.month.split(" ")
      return Number.parseInt(aYear) - Number.parseInt(bYear) || aMonth.localeCompare(bMonth)
    })
  }, [filteredQuotations])

  // Calcular tasa de conversión global
  const conversionRate = useMemo(() => {
    const totalQuotes = filteredQuotations.length
    const acceptedQuotes = filteredQuotations.filter((q) => q.status === QuotationStatus.ACCEPTED).length

    return totalQuotes > 0 ? (acceptedQuotes / totalQuotes) * 100 : 0
  }, [filteredQuotations])

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return `S/. ${amount.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cotizaciones</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredQuotations.length}</div>
            <p className="text-xs text-muted-foreground mt-1">En el período seleccionado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cotizaciones Aceptadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredQuotations.filter((q) => q.status === QuotationStatus.ACCEPTED).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-emerald-500 font-medium">{conversionRate.toFixed(1)}%</span> tasa de conversión
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cotizaciones Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredQuotations.filter((q) => q.status === QuotationStatus.SENT).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Esperando respuesta del cliente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Potencial</CardTitle>
            <AlertTriangle className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(quotationValueByStatus[QuotationStatus.SENT])}</div>
            <p className="text-xs text-muted-foreground mt-1">En cotizaciones pendientes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Estado de Cotizaciones</CardTitle>
            <CardDescription>Distribución por estado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={quotationsByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {quotationsByStatus.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        className="stroke-background dark:stroke-background"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [`${value} cotizaciones`, name]}
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
            <CardTitle>Tendencia de Cotizaciones</CardTitle>
            <CardDescription>Evolución mensual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={quotationsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      borderColor: "var(--border)",
                      borderRadius: "0.375rem",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Total"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="accepted"
                    name="Aceptadas"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rejected"
                    name="Rechazadas"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

