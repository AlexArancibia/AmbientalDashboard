"use client"

import { useState } from "react"
import { useClientStore } from "@/lib/stores/useClientStore"
import { useServiceOrderStore } from "@/lib/stores/useServiceOrderStore"
import { useQuotationStore } from "@/lib/stores/useQuotationStore"
import { useEquipmentStore } from "@/lib/stores/useEquipmentStore"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { FinancialAnalytics } from "./financial-analytics"
import { ClientAnalytics } from "./client-analytics"
import { QuotationAnalytics } from "./quotation-analytics"
import { ServiceOrderAnalytics } from "./service-order-analytics"
import { EquipmentAnalytics } from "./equipment-analytics"
import { format, subDays, subMonths } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "../ui/calendar"

// Opciones predefinidas de fechas
const datePresets = [
  { id: "last7days", name: "Últimos 7 días", getDate: () => subDays(new Date(), 7) },
  { id: "last30days", name: "Últimos 30 días", getDate: () => subDays(new Date(), 30) },
  { id: "last90days", name: "Últimos 90 días", getDate: () => subDays(new Date(), 90) },
  { id: "last6months", name: "Últimos 6 meses", getDate: () => subMonths(new Date(), 6) },
  { id: "last12months", name: "Último año", getDate: () => subMonths(new Date(), 12) },
]

export function AnalyticsView() {
  const { clients } = useClientStore()
  const { serviceOrders } = useServiceOrderStore()
  const { quotations } = useQuotationStore()
  const { equipment } = useEquipmentStore()

  const [dateRange, setDateRange] = useState({
    from: subMonths(new Date(), 6),
    to: new Date(),
  })
  const [showDatePicker, setShowDatePicker] = useState(false)

  // Aplicar un preset de fecha
  const applyDatePreset = (presetId: string) => {
    const preset = datePresets.find((p) => p.id === presetId)
    if (preset) {
      setDateRange({
        from: preset.getDate(),
        to: new Date(),
      })
    }
  }

  // Obtener el texto del rango de fechas seleccionado
  const getDateRangeText = () => {
    const preset = datePresets.find((p) => {
      const presetDate = p.getDate()
      const diffDays = Math.abs(presetDate.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)
      return diffDays < 1 // Si la diferencia es menor a un día, consideramos que es el mismo preset
    })

    if (preset) {
      return preset.name
    }

    return `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Análisis Detallado</h2>

        <div className="flex flex-wrap items-center gap-2">
          <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-9">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {getDateRangeText()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-3 border-b">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Rango de fechas</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Desde</div>
                      <Calendar
                        mode="single"
                        selected={dateRange.from}
                        onSelect={(date) => setDateRange({ ...dateRange, from: date! })}
                        initialFocus
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Hasta</div>
                      <Calendar
                        mode="single"
                        selected={dateRange.to}
                        onSelect={(date) => setDateRange({ ...dateRange, to: date! })}
                        initialFocus
                      />
                    </div>
                  </div>
                </div>
                <div className="p-3 border-t">
                  <h4 className="font-medium text-sm mb-2">Períodos predefinidos</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {datePresets.map((preset) => (
                      <Button
                        key={preset.id}
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => {
                          applyDatePreset(preset.id)
                          setShowDatePicker(false)
                        }}
                      >
                        {preset.name}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end p-3 border-t">
                  <Button size="sm" onClick={() => setShowDatePicker(false)}>
                    Aplicar
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Select defaultValue="all">
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por cliente" />
            </SelectTrigger>
            <SelectContent  className="w-[180px]">
              <SelectItem value="all">Todos los clientes</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="financial" className="space-y-4">
        <TabsList className="grid grid-cols-5 h-auto">
          <TabsTrigger value="financial" className="py-2">
            Financiero
          </TabsTrigger>
          <TabsTrigger value="clients" className="py-2">
            Clientes
          </TabsTrigger>
          <TabsTrigger value="quotations" className="py-2">
            Cotizaciones
          </TabsTrigger>
          <TabsTrigger value="serviceOrders" className="py-2">
            Órdenes de Servicio
          </TabsTrigger>
          <TabsTrigger value="equipment" className="py-2">
            Equipos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-4">
          <FinancialAnalytics serviceOrders={serviceOrders} startDate={dateRange.from} endDate={dateRange.to} />
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <ClientAnalytics
            clients={clients}
            serviceOrders={serviceOrders}
            quotations={quotations}
            startDate={dateRange.from}
            endDate={dateRange.to}
          />
        </TabsContent>

        <TabsContent value="quotations" className="space-y-4">
          <QuotationAnalytics
            quotations={quotations}
            clients={clients}
            startDate={dateRange.from}
            endDate={dateRange.to}
          />
        </TabsContent>

        <TabsContent value="serviceOrders" className="space-y-4">
          <ServiceOrderAnalytics
            serviceOrders={serviceOrders}
            clients={clients}
            startDate={dateRange.from}
            endDate={dateRange.to}
          />
        </TabsContent>

        <TabsContent value="equipment" className="space-y-4">
          <EquipmentAnalytics
            equipment={equipment}
            quotations={quotations}
            startDate={dateRange.from}
            endDate={dateRange.to}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

