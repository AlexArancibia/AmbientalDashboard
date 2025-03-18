"use client"

import { useEquipmentStore } from "@/lib/stores/useEquipmentStore"
import { useEffect, useState } from "react"
import { EquipmentStatus } from "@/types"
import { Cell, Pie, PieChart, ResponsiveContainer, Legend, Tooltip } from "recharts"

export function EquipmentStatusChart() {
  const { equipment } = useEquipmentStore()
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    // Contar equipos por estado
    const statusCounts = equipment.reduce(
      (acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Preparar datos para el gráfico
    const data = [
      {
        name: "Bueno",
        value: statusCounts[EquipmentStatus.BUENO] || 0,
        color: "#10b981", // emerald-500
      },
      {
        name: "Regular",
        value: statusCounts[EquipmentStatus.REGULAR] || 0,
        color: "#f59e0b", // amber-500
      },
      {
        name: "Malo",
        value: statusCounts[EquipmentStatus.MALO] || 0,
        color: "#ef4444", // red-500
      },
    ]

    setChartData(data)
  }, [equipment])

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} className="stroke-background dark:stroke-background" />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [`${value} equipos`, name]}
            contentStyle={{
              backgroundColor: "var(--background)",
              borderColor: "var(--border)",
              borderRadius: "0.375rem",
              boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

