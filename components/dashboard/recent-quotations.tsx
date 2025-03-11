import { useQuotationStore } from "@/lib/stores/useQuotationStore"
import { useClientStore } from "@/lib/stores/useClientStore"

export function RecentQuotations() {
  const { quotations } = useQuotationStore()
  const { clients } = useClientStore()

  const recentQuotations = quotations
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  return (
    <div>
      <div className="space-y-8">
        {recentQuotations.map((quotation) => {
          const client = clients.find((c) => c.id === quotation.clientId)
          return (
            <div key={quotation.id} className="flex items-center">
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium leading-none">{client?.name || "Unknown Client"}</p>
                <p className="text-sm text-muted-foreground">{new Date(quotation.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="ml-auto font-medium">S/. {quotation.total.toFixed(2)}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

