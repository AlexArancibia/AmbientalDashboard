import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { QuotationForm } from "@/components/quotations/quotation-form"

export default function NewQuotationPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Nueva Cotización" text="Crear una nueva cotización para un cliente" />
      <QuotationForm />
    </DashboardShell>
  )
}

