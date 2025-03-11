"use client"

import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EquipmentStatus } from "@/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertCircle,
  BarChart3,
  PieChartIcon,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Gauge,
  CalendarIcon,
  ClockIcon,
  ArrowRightIcon,
} from "lucide-react"
import { useEquipmentStore } from "@/lib/stores/useEquipmentStore"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { format, differenceInDays, isBefore, addDays, isValid } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function ConsolidatedEquipmentView() {
  const { equipment, isLoading, error, fetchEquipment } = useEquipmentStore()

  useEffect(() => {
    fetchEquipment()
  }, [fetchEquipment])

  // Show loading state
  if (isLoading) {
    return <LoadingState />
  }

  // Show error state
  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  // If no equipment data
  if (equipment.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <div className="mx-auto bg-muted rounded-full w-12 h-12 flex items-center justify-center mb-4">
            <BarChart3 className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>No hay datos de equipos</CardTitle>
          <CardDescription>No se encontraron equipos en la base de datos.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <a href="/equipment/new" className="text-primary hover:underline">
            Agregar nuevo equipo
          </a>
        </CardContent>
      </Card>
    )
  }

  // Group equipment by name
  const equipmentByName = equipment.reduce(
    (acc, item) => {
      if (!acc[item.name]) {
        acc[item.name] = []
      }
      acc[item.name].push(item)
      return acc
    },
    {} as Record<string, typeof equipment>,
  )

  // Calculate overall statistics
  const totalEquipment = equipment.length
  const statusCounts = equipment.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1
      return acc
    },
    {} as Record<EquipmentStatus, number>,
  )

  const calibratedCount = equipment.filter((item) => item.isCalibrated).length
  const calibrationPercentage = Math.round((calibratedCount / totalEquipment) * 100) || 0

  const overallStats = [
    {
      name: "Bueno",
      value: statusCounts[EquipmentStatus.BUENO] || 0,
      color: "#22c55e",
      icon: <CheckCircle2 className="h-4 w-4" />,
    },
    {
      name: "Regular",
      value: statusCounts[EquipmentStatus.REGULAR] || 0,
      color: "#eab308",
      icon: <AlertTriangle className="h-4 w-4" />,
    },
    {
      name: "Malo",
      value: statusCounts[EquipmentStatus.MALO] || 0,
      color: "#ef4444",
      icon: <XCircle className="h-4 w-4" />,
    },
  ]

  const consolidatedData = Object.entries(equipmentByName).map(([name, items]) => {
    const groupStats = items.reduce(
      (acc, item) => {
        acc.total++
        acc[item.status]++
        if (item.isCalibrated) acc.calibrated++
        return acc
      },
      {
        total: 0,
        [EquipmentStatus.BUENO]: 0,
        [EquipmentStatus.REGULAR]: 0,
        [EquipmentStatus.MALO]: 0,
        calibrated: 0,
      },
    )

    return {
      name,
      total: groupStats.total,
      bueno: groupStats[EquipmentStatus.BUENO],
      regular: groupStats[EquipmentStatus.REGULAR],
      malo: groupStats[EquipmentStatus.MALO],
      calibrated: groupStats.calibrated,
      calibrationPercentage: Math.round((groupStats.calibrated / groupStats.total) * 100) || 0,
    }
  })

  // Sort by total count descending
  consolidatedData.sort((a, b) => b.total - a.total)

  // Prepare data for calibration status table
  const calibrationStatusData = [
    {
      status: "Calibrados",
      count: calibratedCount,
      percentage: calibrationPercentage,
      color: "#3b82f6",
    },
    {
      status: "No Calibrados",
      count: totalEquipment - calibratedCount,
      percentage: 100 - calibrationPercentage,
      color: "#94a3b8",
    },
  ]

  // Calculate equipment status by type for heatmap-like table
  const topEquipmentTypes = consolidatedData.slice(0, 5)

  // Find equipment needing calibration soon
  const today = new Date()
  const nextWeek = addDays(today, 7)

  // Fixed: Improved date validation and parsing
  const equipmentNeedingCalibration = equipment
    .filter((item) => {
      // Make sure we have a valid calibration date
      if (!item.calibrationDate) return false

      // Parse the date safely
      const calibrationDate = new Date(item.calibrationDate)

      // Ensure the date is valid
      if (!isValid(calibrationDate)) return false

      // Check if it's in the future and within the next week
      return item.isCalibrated && isBefore(today, calibrationDate) && isBefore(calibrationDate, nextWeek)
    })
    .sort((a, b) => {
      const dateA = a.calibrationDate ? new Date(a.calibrationDate) : new Date()
      const dateB = b.calibrationDate ? new Date(b.calibrationDate) : new Date()
      return dateA.getTime() - dateB.getTime()
    })

  console.log("Equipment needing calibration:", equipmentNeedingCalibration)

  const getCalibrationUrgency = (date: Date | undefined) => {
    if (!date) return { className: "", text: "No calibrado" }

    const calibrationDate = new Date(date)
    if (!isValid(calibrationDate)) return { className: "", text: "Fecha inválida" }

    const daysUntilCalibration = differenceInDays(calibrationDate, today)

    if (daysUntilCalibration <= 2) {
      return {
        className: "text-red-600 font-bold",
        text: `En ${daysUntilCalibration} día${daysUntilCalibration === 1 ? "" : "s"}`,
        icon: <AlertCircle className="h-4 w-4 text-red-600 inline ml-1" />,
      }
    }

    return {
      className: "text-amber-600 font-medium",
      text: `En ${daysUntilCalibration} días`,
      icon: <AlertTriangle className="h-4 w-4 text-amber-600 inline ml-1" />,
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Equipos</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEquipment}</div>
            <p className="text-xs text-muted-foreground mt-1">{Object.keys(equipmentByName).length} tipos diferentes</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estado Bueno</CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts[EquipmentStatus.BUENO] || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(((statusCounts[EquipmentStatus.BUENO] || 0) / totalEquipment) * 100)}% del total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Necesitan Atención</CardTitle>
            <div className="h-8 w-8 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(statusCounts[EquipmentStatus.REGULAR] || 0) + (statusCounts[EquipmentStatus.MALO] || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(
                (((statusCounts[EquipmentStatus.REGULAR] || 0) + (statusCounts[EquipmentStatus.MALO] || 0)) /
                  totalEquipment) *
                  100,
              )}
              % del total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calibrados</CardTitle>
            <div className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
              <Gauge className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calibratedCount}</div>
            <div className="mt-2">
              <Progress value={calibrationPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{calibrationPercentage}% del total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calibration Alert Card - Redesigned */}
      {equipmentNeedingCalibration.length > 0 && (
        <Card className="overflow-hidden border-0 shadow-md bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
          <CardHeader className="pb-2 border-b border-amber-200 dark:border-amber-800/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <ClockIcon className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-amber-800 dark:text-amber-400 text-lg">Calibraciones Próximas</CardTitle>
                  <CardDescription className="text-amber-700 dark:text-amber-500">
                    {equipmentNeedingCalibration.length} equipos requieren calibración en los próximos 7 días
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="bg-white dark:bg-gray-900 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                asChild
              >
                <Link href="/equipment">
                  Ver todos <ArrowRightIcon className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-3">
              {equipmentNeedingCalibration.map((item) => {
                const urgency = getCalibrationUrgency(item.calibrationDate)
                return (
                  <Card
                    key={item.id}
                    className="bg-white dark:bg-gray-900 border-amber-100 dark:border-amber-800/20 shadow-sm overflow-hidden"
                  >
                    <CardHeader className="p-3 pb-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-sm font-medium">{item.name}</CardTitle>
                          <CardDescription className="text-xs">{item.code}</CardDescription>
                        </div>
                        {item.status === EquipmentStatus.BUENO ? (
                          <Badge className="bg-green-500">Bueno</Badge>
                        ) : item.status === EquipmentStatus.REGULAR ? (
                          <Badge className="bg-yellow-500">Regular</Badge>
                        ) : (
                          <Badge className="bg-red-500">Malo</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-2">
                      <div className="flex justify-between items-center mt-1">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Calibración:</span>{" "}
                          {item.calibrationDate
                            ? format(new Date(item.calibrationDate), "dd MMM yyyy", { locale: es })
                            : "No calibrado"}
                        </div>
                        <div className={`text-sm font-medium ${urgency.className} flex items-center`}>
                          {urgency.text}
                          {urgency.icon}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-3 pt-0 flex justify-end">
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" asChild>
                        <Link href={`/equipment/${item.id}`}>Ver detalles</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 p-1 rounded-lg">
          <TabsTrigger
            value="overview"
            className="rounded-md data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-900"
          >
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              <span>Resumen</span>
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="calibration"
            className="rounded-md data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-900"
          >
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span>Calibración</span>
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="details"
            className="rounded-md data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-900"
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>Detalle</span>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-white dark:bg-gray-950 shadow-sm">
              <CardHeader>
                <CardTitle>Distribución por Estado</CardTitle>
                <CardDescription>Porcentaje de equipos según su estado actual</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={overallStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {overallStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value} ${value === 1 ? "equipo" : "equipos"}`, "Cantidad"]}
                        contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-950 shadow-sm">
              <CardHeader>
                <CardTitle>Estado de Calibración</CardTitle>
                <CardDescription>Análisis de equipos calibrados vs. no calibrados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex justify-center">
                    <div className="w-32 h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={calibrationStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={25}
                            outerRadius={50}
                            fill="#8884d8"
                            dataKey="count"
                            paddingAngle={2}
                          >
                            {calibrationStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => [`${value} equipos`, "Cantidad"]}
                            contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                        <TableHead className="text-right">Porcentaje</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {calibrationStatusData.map((item) => (
                        <TableRow key={item.status}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                              {item.status}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{item.count}</TableCell>
                          <TableCell className="text-right">{item.percentage}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white dark:bg-gray-950 shadow-sm">
            <CardHeader>
              <CardTitle>Análisis de Equipos por Tipo</CardTitle>
              <CardDescription>
                Comparativa de estado y calibración de los 5 tipos de equipo más comunes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo de Equipo</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center" colSpan={3}>
                        Estado
                      </TableHead>
                      <TableHead className="text-center" colSpan={2}>
                        Calibración
                      </TableHead>
                    </TableRow>
                    <TableRow>
                      <TableHead></TableHead>
                      <TableHead></TableHead>
                      <TableHead className="text-center bg-green-50 dark:bg-green-900/20">Bueno</TableHead>
                      <TableHead className="text-center bg-yellow-50 dark:bg-yellow-900/20">Regular</TableHead>
                      <TableHead className="text-center bg-red-50 dark:bg-red-900/20">Malo</TableHead>
                      <TableHead className="text-center bg-blue-50 dark:bg-blue-900/20">Calibrados</TableHead>
                      <TableHead className="text-center bg-gray-50 dark:bg-gray-800/50">No Calibrados</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topEquipmentTypes.map((item) => (
                      <TableRow key={item.name}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-center">{item.total}</TableCell>
                        <TableCell className="text-center bg-green-50 dark:bg-green-900/10">
                          <div className="flex flex-col items-center">
                            <span>{item.bueno}</span>
                            <span className="text-xs text-muted-foreground">
                              {Math.round((item.bueno / item.total) * 100)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center bg-yellow-50 dark:bg-yellow-900/10">
                          <div className="flex flex-col items-center">
                            <span>{item.regular}</span>
                            <span className="text-xs text-muted-foreground">
                              {Math.round((item.regular / item.total) * 100)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center bg-red-50 dark:bg-red-900/10">
                          <div className="flex flex-col items-center">
                            <span>{item.malo}</span>
                            <span className="text-xs text-muted-foreground">
                              {Math.round((item.malo / item.total) * 100)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center bg-blue-50 dark:bg-blue-900/10">
                          <div className="flex flex-col items-center">
                            <span>{item.calibrated}</span>
                            <span className="text-xs text-muted-foreground">{item.calibrationPercentage}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center bg-gray-50 dark:bg-gray-800/30">
                          <div className="flex flex-col items-center">
                            <span>{item.total - item.calibrated}</span>
                            <span className="text-xs text-muted-foreground">{100 - item.calibrationPercentage}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calibration">
          <Card className="bg-white dark:bg-gray-950 shadow-sm">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Estado de Calibración de Equipos</CardTitle>
                  <CardDescription>Análisis detallado del estado de calibración de todos los equipos</CardDescription>
                </div>
                <Badge variant="outline" className="ml-2">
                  {equipment.filter((item) => item.isCalibrated).length} equipos calibrados
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha Calibración</TableHead>
                      <TableHead>Estado Calibración</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipment
                      .filter((item) => item.isCalibrated)
                      .sort((a, b) => {
                        if (!a.calibrationDate) return 1
                        if (!b.calibrationDate) return -1
                        return new Date(a.calibrationDate).getTime() - new Date(b.calibrationDate).getTime()
                      })
                      .map((item) => {
                        const today = new Date()
                        const calibrationDate = item.calibrationDate ? new Date(item.calibrationDate) : null
                        let status = { text: "No calibrado", className: "" }

                        if (calibrationDate) {
                          if (isBefore(calibrationDate, today)) {
                            status = { text: "Vencido", className: "text-red-600 font-bold" }
                          } else {
                            const daysUntil = differenceInDays(calibrationDate, today)
                            if (daysUntil <= 2) {
                              status = {
                                text: `En ${daysUntil} día${daysUntil === 1 ? "" : "s"}`,
                                className: "text-red-600 font-bold",
                              }
                            } else if (daysUntil <= 7) {
                              status = {
                                text: `En ${daysUntil} días`,
                                className: "text-amber-600 font-medium",
                              }
                            } else {
                              status = {
                                text: `En ${daysUntil} días`,
                                className: "text-green-600",
                              }
                            }
                          }
                        }

                        return (
                          <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                            <TableCell className="font-medium">{item.code}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>{item.type}</TableCell>
                            <TableCell>
                              {item.status === EquipmentStatus.BUENO ? (
                                <Badge className="bg-green-500">Bueno</Badge>
                              ) : item.status === EquipmentStatus.REGULAR ? (
                                <Badge className="bg-yellow-500">Regular</Badge>
                              ) : (
                                <Badge className="bg-red-500">Malo</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {calibrationDate ? format(calibrationDate, "dd MMM yyyy", { locale: es }) : "No definido"}
                            </TableCell>
                            <TableCell className={status.className}>
                              {status.text}
                              {status.className.includes("red") && (
                                <AlertCircle className="h-4 w-4 text-red-600 inline ml-1" />
                              )}
                              {status.className.includes("amber") && (
                                <AlertTriangle className="h-4 w-4 text-amber-600 inline ml-1" />
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" className="h-8 px-2" asChild>
                                <Link href={`/equipment/${item.id}`}>Ver</Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          <Card className="bg-white dark:bg-gray-950 shadow-sm">
            <CardHeader>
              <CardTitle>Detalle por Tipo de Equipo</CardTitle>
              <CardDescription>Desglose completo de todos los tipos de equipo y sus estados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Bueno</TableHead>
                      <TableHead className="text-right">Regular</TableHead>
                      <TableHead className="text-right">Malo</TableHead>
                      <TableHead className="text-right">Calibrados</TableHead>
                      <TableHead className="text-right">% Calibración</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consolidatedData.map((item) => (
                      <TableRow key={item.name}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-right">{item.total}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {item.bueno}
                            {item.bueno > 0 && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {item.regular}
                            {item.regular > 0 && <span className="w-2 h-2 rounded-full bg-yellow-500"></span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {item.malo}
                            {item.malo > 0 && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{item.calibrated}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Progress value={item.calibrationPercentage} className="h-2 w-16" />
                            <span className="text-xs">{item.calibrationPercentage}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="flex justify-center">
          <Skeleton className="h-[300px] w-[300px] rounded-full" />
        </CardContent>
      </Card>
    </div>
  )
}

