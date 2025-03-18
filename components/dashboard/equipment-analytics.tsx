"use client"

import { useMemo } from "react"
import { type Equipment, type Quotation, EquipmentStatus } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Package, CheckCircle, AlertTriangle, XCircle } from "lucide-react"

interface EquipmentAnalyticsProps {
  equipment: Equipment[]
  quotations: Quotation[]
  startDate: Date
  endDate: Date
}

export function EquipmentAnalytics({ equipment, quotations, startDate, endDate }: EquipmentAnalyticsProps) {
  // Contar equipos por estado
  const equipmentByStatus = useMemo(() => {
    const statusCounts: Record<string, number> = {
      [EquipmentStatus.BUENO]: 0,
      [EquipmentStatus.REGULAR]: 0,
      [EquipmentStatus.MALO]: 0,
    }

    equipment.forEach((item) => {
      statusCounts[item.status] += 1
    })

    return Object.entries(statusCounts).map(([status, count]) => {
      let name = status
      let color = "#888888"

      switch (status) {
        case EquipmentStatus.BUENO:
          name = "Bueno"
          color = "#10b981" // emerald-500
          break
        case EquipmentStatus.REGULAR:
          name = "Regular"
          color = "#f59e0b" // amber-500
          break
        case EquipmentStatus.MALO:
          name = "Malo"
          color = "#ef4444" // red-500
          break
      }

      return { name, value: count, color }
    })
  }, [equipment])

  // Contar equipos por tipo
  const equipmentByType = useMemo(() => {
    const typeCounts: Record<string, number> = {}

    equipment.forEach((item) => {
      if (!typeCounts[item.type]) {
        typeCounts[item.type] = 0
      }
      typeCounts[item.type] += 1
    })

    return Object.entries(typeCounts)
      .map(([type, count]) => ({ name: type, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [equipment])

  // Calcular equipos más cotizados
  const mostQuotedEquipment = useMemo(() => {
    const equipmentCounts: Record<string, { id: string; name: string; type: string; count: number }> = {}

    // Filtrar cotizaciones por rango de fechas
    const filteredQuotations = quotations.filter((quote) => {
      const quoteDate = new Date(quote.date)
      return quoteDate >= startDate && quoteDate <= endDate
    })

    filteredQuotations.forEach((quote) => {
      quote.items.forEach((item) => {
        const equip = equipment.find((e) => e.id === item.equipmentId)
        if (equip) {
          const key = equip.id
          if (!equipmentCounts[key]) {
            equipmentCounts[key] = {
              id: equip.id,
              name: equip.name,
              type: equip.type,
              count: 0,
            }
          }
          equipmentCounts[key].count += item.quantity
        }
      })
    })

    return Object.values(equipmentCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [equipment, quotations, startDate, endDate])

  // Calcular porcentaje de equipos en buen estado
  const goodConditionPercentage = useMemo(() => {
    return equipment.length > 0
      ? (equipment.filter((e) => e.status === EquipmentStatus.BUENO).length / equipment.length) * 100
      : 0
  }, [equipment])

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Equipos</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{equipment.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Equipos registrados en el sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipos en Buen Estado</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {equipment.filter((e) => e.status === EquipmentStatus.BUENO).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-emerald-500 font-medium">{goodConditionPercentage.toFixed(1)}%</span> del total de
              equipos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipos en Estado Regular</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {equipment.filter((e) => e.status === EquipmentStatus.REGULAR).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Requieren mantenimiento preventivo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipos en Mal Estado</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {equipment.filter((e) => e.status === EquipmentStatus.MALO).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Requieren reparación o reemplazo</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Estado de Equipos</CardTitle>
            <CardDescription>Distribución por estado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={equipmentByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {equipmentByStatus.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        className="stroke-background dark:stroke-background"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [`${value} equipos`, name]}
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
            <CardTitle>Equipos Más Cotizados</CardTitle>
            <CardDescription>Top 5 equipos más solicitados</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Solicitudes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mostQuotedEquipment.length > 0 ? (
                  mostQuotedEquipment.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.type}</TableCell>
                      <TableCell className="text-right font-medium">{item.count}</TableCell>
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

