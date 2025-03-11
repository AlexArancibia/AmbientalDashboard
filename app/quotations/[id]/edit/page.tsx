"use client"

import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { QuotationForm } from "@/components/quotations/quotation-form"
import { notFound, useRouter } from "next/navigation"
import { useQuotationStore } from "@/lib/stores/useQuotationStore"
import { useEffect, useState, use } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function EditQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  // Resolve the params Promise outside of try/catch
  const resolvedParams = use(params)
  const id = resolvedParams.id

  const router = useRouter()
  const { getQuotation, isLoading, error } = useQuotationStore()
  const [quotation, setQuotation] = useState<any>(null)

  useEffect(() => {
    const fetchQuotation = async () => {
      const fetchedQuotation = await getQuotation(id)
      if (fetchedQuotation) {
        setQuotation(fetchedQuotation)
      } else {
        notFound()
      }
    }

    fetchQuotation()
  }, [id, getQuotation])

  if (isLoading) {
    return (
      <DashboardShell>
        <DashboardHeader heading="Cargando cotización..." text="Por favor espere" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </DashboardShell>
    )
  }

  if (error) {
    return (
      <DashboardShell>
        <DashboardHeader heading="Error" text="No se pudo cargar la cotización" />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </DashboardShell>
    )
  }

  if (!quotation) {
    return null // Esto se renderizará brevemente antes de redirigir a notFound()
  }

  return (
    <DashboardShell>
      <DashboardHeader heading={`Editar Cotización #${quotation.number}`} text={`Cliente: ${quotation.client.name}`} />
      <QuotationForm quotation={quotation} />
    </DashboardShell>
  )
}

