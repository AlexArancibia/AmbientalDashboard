"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Currency, QuotationStatus, type Quotation } from "@/types"
import { format } from "date-fns"
import { ArrowLeft, FileText, Printer, Edit, Calendar, ClipboardList } from "lucide-react"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQuotationStore } from "@/lib/stores/useQuotationStore"
import { generateQuotationPDF } from "@/lib/generateQuotationPDF"

interface QuotationDetailProps {
  quotation: Quotation
}

export function QuotationDetail({ quotation }: QuotationDetailProps) {
  const [activeTab, setActiveTab] = useState("details")
  const { updateQuotation } = useQuotationStore()

  const getStatusBadge = (status: QuotationStatus) => {
    switch (status) {
      case QuotationStatus.DRAFT:
        return <Badge variant="outline">Borrador</Badge>
      case QuotationStatus.SENT:
        return <Badge className="bg-blue-500">Enviada</Badge>
      case QuotationStatus.ACCEPTED:
        return <Badge className="bg-green-500">Aceptada</Badge>
      case QuotationStatus.REJECTED:
        return <Badge className="bg-red-500">Rechazada</Badge>
      case QuotationStatus.EXPIRED:
        return <Badge variant="secondary">Expirada</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const formatCurrency = (amount: number, currency: Currency) => {
    const symbol = currency === Currency.PEN ? "S/. " : "$ "
    return symbol + amount.toFixed(2)
  }

  const handlePrint = () => {
    try {
      const doc = generateQuotationPDF(quotation)
      doc.autoPrint()
      window.open(doc.output("bloburl"), "_blank")

      toast({
        title: "Imprimiendo",
        description: "Documento enviado a la impresora.",
      })
    } catch (error) {
      console.error("Error al imprimir:", error)
      toast({
        title: "Error al imprimir",
        description: "Ocurrió un error al preparar el documento para imprimir.",
        variant: "destructive",
      })
    }
  }

  const handleGeneratePDF = () => {
    try {
      const doc = generateQuotationPDF(quotation)
      const fileName = `cotizacion_${quotation.number.replace(/\//g, "-")}.pdf`
      doc.save(fileName)

      toast({
        title: "PDF generado",
        description: `El PDF de la cotización ${quotation.number} ha sido generado exitosamente.`,
      })
    } catch (error) {
      console.error("Error al generar PDF:", error)
      toast({
        title: "Error al generar PDF",
        description: "Ocurrió un error al generar el PDF. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      })
    }
  }

  const handleStatusChange = async (newStatus: QuotationStatus) => {
    try {
      await updateQuotation(quotation.id, { status: newStatus })
      toast({
        title: "Estado actualizado",
        description: `La cotización ${quotation.number} ha sido marcada como ${newStatus}.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la cotización.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" asChild>
          <Link href="/quotations">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Cotizaciones
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Button variant="outline" onClick={handleGeneratePDF}>
            <FileText className="mr-2 h-4 w-4" />
            Generar PDF
          </Button>
          <Button asChild>
            <Link href={`/quotations/${quotation.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información General</CardTitle>
          <CardDescription>Detalles básicos de la cotización</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Número</p>
              <p className="text-lg font-medium">{quotation.number}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fecha</p>
              <p className="text-lg font-medium">{format(new Date(quotation.date), "dd/MM/yyyy")}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Cliente</p>
              <p>{quotation.client.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Estado</p>
              <div className="mt-1">{getStatusBadge(quotation.status as QuotationStatus)}</div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Moneda</p>
              <p>{quotation.currency === Currency.PEN ? "Soles (PEN)" : "Dólares (USD)"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fecha de Entrega</p>
              <p>{format(new Date(quotation.equipmentReleaseDate), "dd/MM/yyyy")}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Validez</p>
              <p>{quotation.validityDays} días</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Notas</p>
            <p className="mt-1">{quotation.notes || "Sin notas adicionales"}</p>
          </div>

          {quotation.status === QuotationStatus.SENT && (
            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => handleStatusChange(QuotationStatus.ACCEPTED)}
                className="bg-green-600 hover:bg-green-700"
              >
                Marcar como Aceptada
              </Button>
              <Button onClick={() => handleStatusChange(QuotationStatus.REJECTED)} variant="destructive">
                Marcar como Rechazada
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalles de Servicios</CardTitle>
          <CardDescription>Servicios incluidos en esta cotización</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Servicio</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Días</TableHead>
                <TableHead>Precio Unitario</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotation.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.code}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.days}</TableCell>
                  <TableCell>{formatCurrency(item.unitPrice, quotation.currency as Currency)}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.quantity * item.days * item.unitPrice, quotation.currency as Currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-6 flex justify-end">
            <div className="w-[200px] space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Subtotal:</span>
                <span>{formatCurrency(quotation.subtotal, quotation.currency as Currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">IGV (18%):</span>
                <span>{formatCurrency(quotation.igv, quotation.currency as Currency)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-bold">Total:</span>
                <span className="font-bold">{formatCurrency(quotation.total, quotation.currency as Currency)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">
            <ClipboardList className="mr-2 h-4 w-4" />
            Detalles Adicionales
          </TabsTrigger>
          <TabsTrigger value="schedule">
            <Calendar className="mr-2 h-4 w-4" />
            Cronograma
          </TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="border rounded-md mt-6 p-4">
          <h3 className="text-lg font-medium mb-4">Información Adicional</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fecha de Creación</p>
              <p>{format(new Date(quotation.createdAt), "dd/MM/yyyy HH:mm")}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Última Actualización</p>
              <p>{format(new Date(quotation.updatedAt), "dd/MM/yyyy HH:mm")}</p>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="schedule" className="border rounded-md mt-6 p-4">
          <h3 className="text-lg font-medium mb-4">Cronograma de Entrega</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fecha de Entrega de Servicios</p>
              <p>{format(new Date(quotation.equipmentReleaseDate), "dd/MM/yyyy")}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fecha de Expiración de Cotización</p>
              <p>
                {format(
                  new Date(new Date(quotation.date).getTime() + quotation.validityDays * 24 * 60 * 60 * 1000),
                  "dd/MM/yyyy",
                )}
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

