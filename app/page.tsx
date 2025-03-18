"use client"

import { useEffect, useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { RecentQuotations } from "@/components/dashboard/recent-quotations"
import { RecentServiceOrders } from "@/components/dashboard/recent-service-orders"
import { AnalyticsView } from "@/components/dashboard/analytics-view"
import { ReportsView } from "@/components/dashboard/reports-view"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDateRangePicker } from "@/components/date-range-picker"
import { Button } from "@/components/ui/button"
import { useClientStore } from "@/lib/stores/useClientStore"
import { useServiceOrderStore } from "@/lib/stores/useServiceOrderStore"
import { usePurchaseOrderStore } from "@/lib/stores/usePurchaseOrderStore"
import { useEquipmentStore } from "@/lib/stores/useEquipmentStore"
import { useQuotationStore } from "@/lib/stores/useQuotationStore"
import { Skeleton } from "@/components/ui/skeleton"
import { Download, RefreshCw } from "lucide-react"
import { EquipmentStatusChart } from "@/components/dashboard/equipment-status"
import { RecentPurchaseOrders } from "@/components/dashboard/recent-purchase-order"

export default function DashboardPage() {
  const { fetchClients } = useClientStore()
  const { fetchServiceOrders } = useServiceOrderStore()
  const { fetchPurchaseOrders } = usePurchaseOrderStore()
  const { fetchEquipment } = useEquipmentStore()
  const { fetchQuotations } = useQuotationStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchAllData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        fetchClients(),
        fetchServiceOrders(),
        fetchPurchaseOrders(),
        fetchEquipment(),
        fetchQuotations(),
      ])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAllData()
  }, [fetchClients, fetchServiceOrders, fetchPurchaseOrders, fetchEquipment, fetchQuotations])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchAllData()
    setIsRefreshing(false)
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Dashboard" text="Resumen general del negocio">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="h-9">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Actualizando..." : "Actualizar"}
          </Button>
          {/* <CalendarDateRangePicker />
          <Button className="h-9">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button> */}
        </div>
      </DashboardHeader>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          {/* <TabsTrigger value="analytics">Análisis</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger> */}
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          {isLoading ? (
            <DashboardSkeleton />
          ) : (
            <>
              <DashboardStats />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Ingresos Mensuales</CardTitle>
                    <CardDescription>Tendencia de ingresos de los últimos 6 meses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RevenueChart />
                  </CardContent>
                </Card>
                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Estado de Equipos</CardTitle>
                    <CardDescription>Distribución de equipos por estado</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <EquipmentStatusChart />
                  </CardContent>
                </Card>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Cotizaciones Recientes</CardTitle>
                    <CardDescription>Últimas 5 cotizaciones generadas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RecentQuotations />
                  </CardContent>
                </Card>
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Órdenes de Servicio</CardTitle>
                    <CardDescription>Últimas 5 órdenes de servicio</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RecentServiceOrders />
                  </CardContent>
                </Card>
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Órdenes de Compra</CardTitle>
                    <CardDescription>Últimas 5 órdenes de compra</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RecentPurchaseOrders />
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
        {/* <TabsContent value="analytics" className="space-y-4">
          <AnalyticsView />
        </TabsContent>
        <TabsContent value="reports" className="space-y-4">
          <ReportsView />
        </TabsContent> */}
      </Tabs>
    </DashboardShell>
  )
}

function DashboardSkeleton() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 overflow-hidden">
          <CardHeader>
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
        <Card className="col-span-3 overflow-hidden">
          <CardHeader>
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader>
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="flex justify-between">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-5 w-1/4" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}

