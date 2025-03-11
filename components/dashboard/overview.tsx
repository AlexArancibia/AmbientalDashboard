"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { useServiceOrderStore } from "@/lib/stores/useServiceOrderStore"
import { useQuotationStore } from "@/lib/stores/useQuotationStore"

export function Overview() {
  const { serviceOrders } = useServiceOrderStore()
  const { quotations } = useQuotationStore()

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(0, i).toLocaleString("default", { month: "short" })
    return { name: month, total: 0 }
  })

  // Combine service orders and quotations
  const allOrders = [...serviceOrders, ...quotations]

  allOrders.forEach((order) => {
    const date = new Date(order.createdAt)
    const monthIndex = date.getMonth()
    monthlyData[monthIndex].total += order.total || 0
  })

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={monthlyData}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `S/.${value}`}
        />
        <Tooltip formatter={(value) => [`S/.${value}`, "Revenue"]} labelFormatter={(label) => `Month: ${label}`} />
        <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
      </BarChart>
    </ResponsiveContainer>
  )
}

