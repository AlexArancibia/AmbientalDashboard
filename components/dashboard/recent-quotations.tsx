"use client"

import { useQuotationStore } from "@/lib/stores/useQuotationStore"
import { useClientStore } from "@/lib/stores/useClientStore"
import { QuotationStatus, Currency } from "@/types"
import { FileText, ArrowUpRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export function RecentQuotations() {
  const { quotations } = useQuotationStore()
  const { clients } = useClientStore()

  const recentQuotations = quotations
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  const getStatusBadge = (status: QuotationStatus) => {
    switch (status) {
      case QuotationStatus.DRAFT:
        return (
          <Badge variant="outline" className="font-medium text-gray-600 border-gray-300">
            Borrador
          </Badge>
        )
      case QuotationStatus.SENT:
        return <Badge className="bg-blue-500 hover:bg-blue-600 font-medium">Enviada</Badge>
      case QuotationStatus.ACCEPTED:
        return <Badge className="bg-green-500 hover:bg-green-600 font-medium">Aceptada</Badge>
      case QuotationStatus.REJECTED:
        return <Badge className="bg-red-500 hover:bg-red-600 font-medium">Rechazada</Badge>
      case QuotationStatus.EXPIRED:
        return (
          <Badge variant="secondary" className="font-medium">
            Expirada
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  const formatCurrency = (amount: number, currency: Currency) => {
    const symbol = currency === Currency.PEN ? "S/. " : "$ "
    return symbol + amount.toFixed(2)
  }

  return (
    <div className="space-y-4">
      {recentQuotations.length > 0 ? (
        recentQuotations.map((quotation) => {
          const client = clients.find((c) => c.id === quotation.clientId)
          return (
            <Link
              href={`/quotations/${quotation.id}`}
              key={quotation.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border/40 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{quotation.number}</p>
                  <p className="text-xs text-muted-foreground">{client?.name || "Cliente desconocido"}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <p className="text-sm font-medium">{formatCurrency(quotation.total, quotation.currency)}</p>
                <div className="flex items-center gap-1">
                  {getStatusBadge(quotation.status)}
                  <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </Link>
          )
        })
      ) : (
        <p className="text-center text-muted-foreground py-6">No hay cotizaciones recientes</p>
      )}
      {recentQuotations.length > 0 && (
        <div className="pt-2">
          <Link href="/quotations" className="text-xs text-primary hover:underline flex items-center justify-end">
            Ver todas las cotizaciones
            <ArrowUpRight className="h-3 w-3 ml-1" />
          </Link>
        </div>
      )}
    </div>
  )
}

