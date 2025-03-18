"use client"

import { useState } from "react"
import { useClientStore } from "@/lib/stores/useClientStore"
import { useServiceOrderStore } from "@/lib/stores/useServiceOrderStore"
import { useQuotationStore } from "@/lib/stores/useQuotationStore"
import { usePurchaseOrderStore } from "@/lib/stores/usePurchaseOrderStore"
import { useEquipmentStore } from "@/lib/stores/useEquipmentStore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, subDays, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import {
  Download,
  FileText,
  ClipboardList,
  ShoppingCart,
  Package,
  Users,
  CalendarIcon,
  Filter,
  FileSpreadsheet,
  FileIcon as FilePdf,
  FileJson,
  Check,
  X,
} from "lucide-react"

// Tipos de reportes disponibles
const reportTypes = [
  { id: "quotations", name: "Cotizaciones", icon: <FileText className="h-4 w-4" /> },
  { id: "serviceOrders", name: "Órdenes de Servicio", icon: <ClipboardList className="h-4 w-4" /> },
  { id: "purchaseOrders", name: "Órdenes de Compra", icon: <ShoppingCart className="h-4 w-4" /> },
  { id: "equipment", name: "Equipos", icon: <Package className="h-4 w-4" /> },
  { id: "clients", name: "Clientes", icon: <Users className="h-4 w-4" /> },
]

// Opciones de formato de exportación
const exportFormats = [
  { id: "pdf", name: "PDF", icon: <FilePdf className="h-4 w-4" /> },
  { id: "excel", name: "Excel", icon: <FileSpreadsheet className="h-4 w-4" /> },
  { id: "csv", name: "CSV", icon: <FileText className="h-4 w-4" /> },
  { id: "json", name: "JSON", icon: <FileJson className="h-4 w-4" /> },
]

// Opciones predefinidas de fechas
const datePresets = [
  { id: "today", name: "Hoy", getDate: () => new Date() },
  { id: "yesterday", name: "Ayer", getDate: () => subDays(new Date(), 1) },
  { id: "last7days", name: "Últimos 7 días", getDate: () => subDays(new Date(), 7) },
  { id: "last30days", name: "Últimos 30 días", getDate: () => subDays(new Date(), 30) },
  {
    id: "thisMonth",
    name: "Este mes",
    getDate: () => {
      const date = new Date()
      date.setDate(1)
      return date
    },
  },
  {
    id: "lastMonth",
    name: "Mes anterior",
    getDate: () => {
      const date = new Date()
      date.setDate(1)
      return subMonths(date, 1)
    },
  },
  { id: "last3months", name: "Últimos 3 meses", getDate: () => subMonths(new Date(), 3) },
  { id: "last6months", name: "Últimos 6 meses", getDate: () => subMonths(new Date(), 6) },
  {
    id: "thisYear",
    name: "Este año",
    getDate: () => {
      const date = new Date()
      date.setMonth(0, 1)
      return date
    },
  },
]

export function ReportsView() {
  const { clients } = useClientStore()
  const { serviceOrders } = useServiceOrderStore()
  const { quotations } = useQuotationStore()
  const { purchaseOrders } = usePurchaseOrderStore()
  const { equipment } = useEquipmentStore()

  // Estado para los filtros
  const [reportType, setReportType] = useState("quotations")
  const [exportFormat, setExportFormat] = useState("pdf")
  const [dateRange, setDateRange] = useState({
    from: subMonths(new Date(), 1),
    to: new Date(),
  })
  const [selectedClient, setSelectedClient] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [includeOptions, setIncludeOptions] = useState({
    summary: true,
    details: true,
    charts: true,
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Obtener estados disponibles según el tipo de reporte
  const getStatusOptions = () => {
    switch (reportType) {
      case "quotations":
        return [
          { id: "DRAFT", name: "Borrador" },
          { id: "SENT", name: "Enviada" },
          { id: "ACCEPTED", name: "Aceptada" },
          { id: "REJECTED", name: "Rechazada" },
          { id: "EXPIRED", name: "Expirada" },
        ]
      case "serviceOrders":
        return [
          { id: "PENDING", name: "Pendiente" },
          { id: "IN_PROGRESS", name: "En Progreso" },
          { id: "COMPLETED", name: "Completada" },
          { id: "CANCELLED", name: "Cancelada" },
        ]
      case "purchaseOrders":
        return [
          { id: "PENDING", name: "Pendiente" },
          { id: "APPROVED", name: "Aprobada" },
          { id: "COMPLETED", name: "Completada" },
          { id: "CANCELLED", name: "Cancelada" },
        ]
      case "equipment":
        return [
          { id: "BUENO", name: "Bueno" },
          { id: "REGULAR", name: "Regular" },
          { id: "MALO", name: "Malo" },
        ]
      default:
        return []
    }
  }

  // Función para aplicar un preset de fecha
  const applyDatePreset = (presetId: string) => {
    const preset = datePresets.find((p) => p.id === presetId)
    if (preset) {
      setDateRange({
        from: preset.getDate(),
        to: new Date(),
      })
    }
  }

  // Función para generar el reporte
  const generateReport = () => {
    setIsGenerating(true)

    // Simulación de generación de reporte
    setTimeout(() => {
      setIsGenerating(false)
      // Aquí iría la lógica real para generar y descargar el reporte
      console.log("Generando reporte con los siguientes parámetros:", {
        type: reportType,
        format: exportFormat,
        dateRange,
        client: selectedClient,
        status: selectedStatus,
        include: includeOptions,
      })
    }, 2000)
  }

  // Obtener el título del reporte
  const getReportTitle = () => {
    const type = reportTypes.find((t) => t.id === reportType)?.name || ""
    return `Reporte de ${type}`
  }

  // Obtener el conteo de elementos según el tipo de reporte
  const getItemCount = () => {
    const from = dateRange.from
    const to = dateRange.to

    let items = []
    switch (reportType) {
      case "quotations":
        items = quotations.filter((q) => {
          const date = new Date(q.date)
          return (
            date >= from &&
            date <= to &&
            (selectedStatus === "all" || q.status === selectedStatus) &&
            (selectedClient === "all" || q.clientId === selectedClient)
          )
        })
        break
      case "serviceOrders":
        items = serviceOrders.filter((o) => {
          const date = new Date(o.date)
          return (
            date >= from &&
            date <= to &&
            (selectedStatus === "all" || o.status === selectedStatus) &&
            (selectedClient === "all" || o.clientId === selectedClient)
          )
        })
        break
      case "purchaseOrders":
        items = purchaseOrders.filter((p) => {
          const date = new Date(p.date)
          return date >= from && date <= to && (selectedStatus === "all" || p.status === selectedStatus)
        })
        break
      case "equipment":
        items = equipment.filter((e) => selectedStatus === "all" || e.status === selectedStatus)
        break
      case "clients":
        items = clients
        break
    }

    return items.length
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Generador de Reportes</h2>
          <p className="text-muted-foreground">Crea reportes personalizados para análisis y documentación</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="h-9">
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
          </Button>

          <Button onClick={generateReport} disabled={isGenerating} className="h-9">
            <Download className="h-4 w-4 mr-2" />
            {isGenerating ? "Generando..." : "Generar Reporte"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Panel de configuración */}
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Configuración del Reporte</CardTitle>
            <CardDescription>Selecciona el tipo de reporte y formato de exportación</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="report-type">Tipo de Reporte</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger id="report-type">
                  <SelectValue placeholder="Seleccionar tipo de reporte" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center">
                        {type.icon}
                        <span className="ml-2">{type.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="export-format">Formato de Exportación</Label>
              <div className="grid grid-cols-2 gap-2">
                {exportFormats.map((format) => (
                  <Button
                    key={format.id}
                    type="button"
                    variant={exportFormat === format.id ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => setExportFormat(format.id)}
                  >
                    {format.icon}
                    <span className="ml-2">{format.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Incluir en el Reporte</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-summary"
                    checked={includeOptions.summary}
                    onCheckedChange={(checked) => setIncludeOptions({ ...includeOptions, summary: !!checked })}
                  />
                  <label
                    htmlFor="include-summary"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Resumen ejecutivo
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-details"
                    checked={includeOptions.details}
                    onCheckedChange={(checked) => setIncludeOptions({ ...includeOptions, details: !!checked })}
                  />
                  <label
                    htmlFor="include-details"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Detalles completos
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-charts"
                    checked={includeOptions.charts}
                    onCheckedChange={(checked) => setIncludeOptions({ ...includeOptions, charts: !!checked })}
                  />
                  <label
                    htmlFor="include-charts"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Gráficos y visualizaciones
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Panel de filtros */}
        <Card className={cn("md:col-span-8", !showFilters && "hidden md:block")}>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Personaliza los datos que se incluirán en el reporte</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Rango de Fechas</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !dateRange.from && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? format(dateRange.from, "PPP", { locale: es }) : <span>Fecha inicial</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateRange.from}
                        onSelect={(date) => setDateRange({ ...dateRange, from: date! })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("justify-start text-left font-normal", !dateRange.to && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.to ? format(dateRange.to, "PPP", { locale: es }) : <span>Fecha final</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateRange.to}
                        onSelect={(date) => setDateRange({ ...dateRange, to: date! })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="pt-2">
                  <Label className="mb-2 block">Períodos predefinidos</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {datePresets.slice(0, 6).map((preset) => (
                      <Button
                        key={preset.id}
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => applyDatePreset(preset.id)}
                      >
                        {preset.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {(reportType === "quotations" || reportType === "serviceOrders" || reportType === "purchaseOrders") && (
                  <div className="space-y-2">
                    <Label htmlFor="client">Cliente</Label>
                    <Select value={selectedClient} onValueChange={setSelectedClient}>
                      <SelectTrigger id="client">
                        <SelectValue placeholder="Todos los clientes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los clientes</SelectItem>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {getStatusOptions().length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="status">Estado</Label>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Todos los estados" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        {getStatusOptions().map((status) => (
                          <SelectItem key={status.id} value={status.id}>
                            {status.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {reportType === "equipment" && (
                  <div className="space-y-2">
                    <Label htmlFor="equipment-type">Tipo de Equipo</Label>
                    <Select defaultValue="all">
                      <SelectTrigger id="equipment-type">
                        <SelectValue placeholder="Todos los tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los tipos</SelectItem>
                        {Array.from(new Set(equipment.map((e) => e.type))).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setDateRange({ from: subMonths(new Date(), 1), to: new Date() })
                setSelectedClient("all")
                setSelectedStatus("all")
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Restablecer filtros
            </Button>
            <Button onClick={() => setShowFilters(false)} className="md:hidden">
              <Check className="h-4 w-4 mr-2" />
              Aplicar filtros
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Vista previa del reporte */}
      <Card>
        <CardHeader>
          <CardTitle>Vista Previa del Reporte</CardTitle>
          <CardDescription>
            {getReportTitle()} - {format(dateRange.from, "dd/MM/yyyy")} al {format(dateRange.to, "dd/MM/yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border p-6 bg-muted/40">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">{getReportTitle()}</h3>
                <p className="text-sm text-muted-foreground">Generado el {format(new Date(), "PPP", { locale: es })}</p>
              </div>

              {includeOptions.summary && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Resumen Ejecutivo</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-background rounded-md p-4 shadow-sm">
                      <p className="text-sm text-muted-foreground">Total de registros</p>
                      <p className="text-2xl font-bold">{getItemCount()}</p>
                    </div>
                    <div className="bg-background rounded-md p-4 shadow-sm">
                      <p className="text-sm text-muted-foreground">Período</p>
                      <p className="text-lg font-medium">
                        {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                      </p>
                    </div>
                    {selectedClient !== "all" && (
                      <div className="bg-background rounded-md p-4 shadow-sm">
                        <p className="text-sm text-muted-foreground">Cliente</p>
                        <p className="text-lg font-medium">
                          {clients.find((c) => c.id === selectedClient)?.name || ""}
                        </p>
                      </div>
                    )}
                    {selectedStatus !== "all" && (
                      <div className="bg-background rounded-md p-4 shadow-sm">
                        <p className="text-sm text-muted-foreground">Estado</p>
                        <p className="text-lg font-medium">
                          {getStatusOptions().find((s) => s.id === selectedStatus)?.name || ""}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {includeOptions.details && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Detalles</h4>
                  <div className="bg-background rounded-md p-4 shadow-sm h-40 flex items-center justify-center">
                    <p className="text-muted-foreground">
                      Aquí se mostrarán los detalles completos de los {getItemCount()} registros seleccionados
                    </p>
                  </div>
                </div>
              )}

              {includeOptions.charts && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Gráficos</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-background rounded-md p-4 shadow-sm h-40 flex items-center justify-center">
                      <p className="text-muted-foreground">Gráfico de distribución por estado</p>
                    </div>
                    <div className="bg-background rounded-md p-4 shadow-sm h-40 flex items-center justify-center">
                      <p className="text-muted-foreground">Gráfico de tendencia temporal</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

