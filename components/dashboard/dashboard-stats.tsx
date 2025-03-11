import { useClientStore } from "@/lib/stores/useClientStore"
import { useServiceOrderStore } from "@/lib/stores/useServiceOrderStore"
import { usePurchaseOrderStore } from "@/lib/stores/usePurchaseOrderStore"
import { useEquipmentStore } from "@/lib/stores/useEquipmentStore"
import { useQuotationStore } from "@/lib/stores/useQuotationStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, DollarSign, Package, Users } from "lucide-react"

export function DashboardStats() {
  const { clients } = useClientStore()
  const { serviceOrders } = useServiceOrderStore()
  const { purchaseOrders } = usePurchaseOrderStore()
  const { equipment } = useEquipmentStore()
  const { quotations } = useQuotationStore()

  const totalRevenue = serviceOrders.reduce((sum, order) => sum + order.total, 0)
  const activeClients = clients.length
  const rentedEquipment = equipment.length
  const activeQuotations = quotations.length

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">S/. {totalRevenue.toFixed(2)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeClients}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Equipment Rented</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{rentedEquipment}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Quotations</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeQuotations}</div>
        </CardContent>
      </Card>
    </div>
  )
}

