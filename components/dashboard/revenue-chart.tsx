"use client"

import { useServiceOrderStore } from "@/lib/stores/useServiceOrderStore"
import { useEffect, useState } from "react"
import { ServiceOrderStatus, Currency } from "@/types"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

export function RevenueChart() {
  const { serviceOrders } = useServiceOrderStore()
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    // Obtener los últimos 6 meses
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      return {
        month: date.toLocaleString("es-ES", { month: "short" }),
        year: date.getFullYear(),
        monthIndex: date.getMonth(),
        yearMonth: `${date.getFullYear()}-${date.getMonth() + 1}`,
      }
    }).reverse()

    // Agrupar órdenes por mes y calcular ingresos
    const revenueByMonth = last6Months.map((monthData) => {
      const monthOrders = serviceOrders.filter((order) => {
        const orderDate = new Date(order.date)
        return orderDate.getMonth() === monthData.monthIndex && orderDate.getFullYear() === monthData.year
      })

      const completed = monthOrders
        .filter((order) => order.status === ServiceOrderStatus.COMPLETED)
        .reduce((sum, order) => {
          // Convertir USD a PEN para uniformidad (tasa de cambio aproximada)
          const amount = order.currency === Currency.USD ? order.total * 3.7 : order.total
          return sum + amount
        }, 0)

      const pending = monthOrders
        .filter(
          (order) => order.status === ServiceOrderStatus.PENDING || order.status === ServiceOrderStatus.IN_PROGRESS,
        )
        .reduce((sum, order) => {
          const amount = order.currency === Currency.USD ? order.total * 3.7 : order.total
          return sum + amount
        }, 0)

      return {
        name: `${monthData.month} ${monthData.year}`,
        Completado: Math.round(completed),
        Pendiente: Math.round(pending),
      }
    })

    setChartData(revenueByMonth)
  }, [serviceOrders])

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `S/${value / 1000}k`}
          />
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
          <Tooltip
            formatter={(value: number) => [`S/. ${value.toLocaleString("es-PE")}`, ""]}
            labelFormatter={(label) => `Ingresos: ${label}`}
            contentStyle={{
              backgroundColor: "var(--background)",
              borderColor: "var(--border)",
              borderRadius: "0.375rem",
              boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
            }}
          />
          <Bar
            dataKey="Completado"
            fill="var(--emerald-500)"
            radius={[4, 4, 0, 0]}
            className="fill-emerald-500 dark:fill-emerald-400"
          />
          <Bar
            dataKey="Pendiente"
            fill="var(--amber-500)"
            radius={[4, 4, 0, 0]}
            className="fill-amber-500 dark:fill-amber-400"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

