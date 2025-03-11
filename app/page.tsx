"use client"

import { useEffect, useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { Overview } from "@/components/dashboard/overview"
import { RecentQuotations } from "@/components/dashboard/recent-quotations"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDateRangePicker } from "@/components/date-range-picker"
import { Button } from "@/components/ui/button"
import { useClientStore } from "@/lib/stores/useClientStore"
import { useServiceOrderStore } from "@/lib/stores/useServiceOrderStore"
import { usePurchaseOrderStore } from "@/lib/stores/usePurchaseOrderStore"
import { useEquipmentStore } from "@/lib/stores/useEquipmentStore"
import { useQuotationStore } from "@/lib/stores/useQuotationStore"

export default function DashboardPage() {
  const { fetchClients } = useClientStore()
  const { fetchServiceOrders } = useServiceOrderStore()
  const { fetchPurchaseOrders } = usePurchaseOrderStore()
  const { fetchEquipment } = useEquipmentStore()
  const { fetchQuotations } = useQuotationStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
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

    fetchAllData()
  }, [fetchClients, fetchServiceOrders, fetchPurchaseOrders, fetchEquipment, fetchQuotations])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Dashboard" text="Overview of your business">
        <div className="flex items-center gap-2">
          <CalendarDateRangePicker />
          <Button>Download</Button>
        </div>
      </DashboardHeader>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <DashboardStats />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardContent>
                <Overview />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardContent>
                <RecentQuotations />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          {/* Add more detailed analytics components here */}
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}

