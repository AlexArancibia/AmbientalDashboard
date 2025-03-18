"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Currency, QuotationStatus, type Quotation } from "@/types"
import { format } from "date-fns"
import {
  ArrowLeft,
  FileText,
  Printer,
  Edit,
  Calendar,
  ClipboardList,
  CheckCircle,
  XCircle,
  Clock,
  Building,
  Mail,
  MapPin,
  User,
  CreditCard,
  DollarSign,
} from "lucide-react"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQuotationStore } from "@/lib/stores/useQuotationStore"
import { generateQuotationPDF } from "@/lib/generateQuotationPDF"
import { Separator } from "@/components/ui/separator"

interface QuotationDetailProps {
  quotation: Quotation
}

export function QuotationDetail({ quotation }: QuotationDetailProps) {
  const [activeTab, setActiveTab] = useState("details")
  const { updateQuotation } = useQuotationStore()

  const getStatusBadge = (status: QuotationStatus) => {
    switch (status) {
      case QuotationStatus.DRAFT:
        return (
          <div className="flex items-center gap-2  ml-4">
            <Badge variant="outline" className="font-medium text-gray-600 border-gray-300">
              Borrador
            </Badge>
            <span className="text-sm text-muted-foreground">Pendiente de envío</span>
          </div>
        )
      case QuotationStatus.SENT:
        return (
          <div className="flex items-center gap-2  ml-4">
            <Badge className="bg-blue-500 hover:bg-blue-600 font-medium">Enviada</Badge>
            <span className="text-sm text-muted-foreground">Esperando respuesta del cliente</span>
          </div>
        )
      case QuotationStatus.ACCEPTED:
        return (
          <div className="flex items-center gap-2 ml-4">
            <Badge className="bg-green-500 hover:bg-green-600 font-medium">Aceptada</Badge>
            <span className="text-sm text-muted-foreground">Cotización aprobada por el cliente</span>
          </div>
        )
      case QuotationStatus.REJECTED:
        return (
          <div className="flex items-center gap-2  ml-4">
            <Badge className="bg-red-500 hover:bg-red-600 font-medium">Rechazada</Badge>
            <span className="text-sm text-muted-foreground">Cotización rechazada por el cliente</span>
          </div>
        )
      case QuotationStatus.EXPIRED:
        return (
          <div className="flex items-center gap-2  ml-4">
            <Badge variant="secondary" className="font-medium">
              Expirada
            </Badge>
            <span className="text-sm text-muted-foreground">Cotización fuera de vigencia</span>
          </div>
        )
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

  // Calculate expiration date
  const expirationDate = new Date(new Date(quotation.date).getTime() + quotation.validityDays * 24 * 60 * 60 * 1000)
  const isExpired = new Date() > expirationDate

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" asChild className="w-fit">
          <Link href="/quotations" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Cotizaciones
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handlePrint} className="  transition-colors">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Button variant="outline" onClick={handleGeneratePDF} className=" transition-colors">
            <FileText className="mr-2 h-4 w-4" />
            Generar PDF
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90 transition-colors">
            <Link href={`/quotations/${quotation.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-border/40 shadow-sm lg:col-span-2">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl font-bold">Cotización #{quotation.number}</CardTitle>
                <CardDescription className="mt-1">
                  Creada el {format(new Date(quotation.date), "dd 'de' MMMM, yyyy")}
                </CardDescription>
              </div>
              {getStatusBadge(quotation.status as QuotationStatus)}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Información del Cliente
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Building className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{quotation.client.name}</p>
                      <p className="text-sm text-muted-foreground">RUC: {quotation.client.ruc}</p>
                    </div>
                  </div>
                  {quotation.client.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm">{quotation.client.address}</p>
                    </div>
                  )}
                  {quotation.client.email && (
                    <div className="flex items-start gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm">{quotation.client.email}</p>
                    </div>
                  )}
                  {quotation.client.contactPerson && (
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm">{quotation.client.contactPerson}</p>
                    </div>
                  )}
                  {quotation.client.creditLine && (
                    <div className="flex items-start gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm">
                        Línea de crédito: {formatCurrency(quotation.client.creditLine, quotation.currency as Currency)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Detalles de la Cotización
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm">
                        Moneda:{" "}
                        <span className="font-medium">
                          {quotation.currency === Currency.PEN ? "Soles (PEN)" : "Dólares (USD)"}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm">
                        Fecha de Entrega:{" "}
                        <span className="font-medium">
                          {format(new Date(quotation.equipmentReleaseDate), "dd/MM/yyyy")}
                        </span>
                      </p>
                    </div>
                  </div>
                  {quotation.returnDate && (
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm">
                          Fecha de Retorno:{" "}
                          <span className="font-medium">{format(new Date(quotation.returnDate), "dd/MM/yyyy")}</span>
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm">
                        Validez: <span className="font-medium">{quotation.validityDays} días</span>{" "}
                        {isExpired && <span className="text-red-500">(Expirada)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">Expira el {format(expirationDate, "dd/MM/yyyy")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {quotation.notes && (
              <div className="mt-6 pt-6 border-t border-border/40">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Notas</h3>
                <p className="text-sm whitespace-pre-line">{quotation.notes}</p>
              </div>
            )}

            {quotation.status === QuotationStatus.SENT && (
              <div className="mt-6 pt-6 border-t border-border/40">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Acciones</h3>
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleStatusChange(QuotationStatus.ACCEPTED)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Marcar como Aceptada
                  </Button>
                  <Button onClick={() => handleStatusChange(QuotationStatus.REJECTED)} variant="destructive">
                    <XCircle className="mr-2 h-4 w-4" />
                    Marcar como Rechazada
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-sm">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>{formatCurrency(quotation.subtotal, quotation.currency as Currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IGV (18%):</span>
                <span>{formatCurrency(quotation.igv, quotation.currency as Currency)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-medium text-lg">
                <span>Total:</span>
                <span>{formatCurrency(quotation.total, quotation.currency as Currency)}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 flex flex-col items-start pt-4">
            <p className="text-sm text-muted-foreground mb-1">Acciones rápidas</p>
            <div className="grid grid-cols-2 gap-2 w-full mt-2">
              <Button variant="outline" size="sm" onClick={handleGeneratePDF} className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint} className="w-full justify-start">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      <Card className="border-border/40 shadow-sm">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle>Detalles de Servicios</CardTitle>
          <CardDescription>Servicios incluidos en esta cotización</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold">Servicio</TableHead>
                  <TableHead className="font-semibold">Cantidad</TableHead>
                  <TableHead className="font-semibold">Días</TableHead>
                  <TableHead className="font-semibold">Precio Unitario</TableHead>
                  <TableHead className="font-semibold text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotation.items.map((item) => (
                  <TableRow key={item.id} className="border-b border-border/40">
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.days}</TableCell>
                    <TableCell>{formatCurrency(item.unitPrice, quotation.currency as Currency)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.quantity * item.days * item.unitPrice, quotation.currency as Currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="details" className="data-[state=active]:bg-primary/10">
            <ClipboardList className="mr-2 h-4 w-4" />
            Detalles Adicionales
          </TabsTrigger>
          <TabsTrigger value="schedule" className="data-[state=active]:bg-primary/10">
            <Calendar className="mr-2 h-4 w-4" />
            Cronograma
          </TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <Card className="border-border/40 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle>Información Adicional</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Fecha de Creación</p>
                    <p className="font-medium">{format(new Date(quotation.createdAt), "dd/MM/yyyy HH:mm")}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Última Actualización</p>
                    <p className="font-medium">{format(new Date(quotation.updatedAt), "dd/MM/yyyy HH:mm")}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {quotation.monitoringLocation && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Lugar de Monitoreo</p>
                      <p className="font-medium">{quotation.monitoringLocation}</p>
                    </div>
                  )}
                  {quotation.considerDays && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Días Considerados</p>
                      <p className="font-medium">{quotation.considerDays} días</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="schedule">
          <Card className="border-border/40 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle>Cronograma de Entrega</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Fecha de Entrega de Servicios</p>
                    <p className="font-medium">{format(new Date(quotation.equipmentReleaseDate), "dd/MM/yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Fecha de Expiración de Cotización</p>
                    <p className="font-medium">
                      {format(expirationDate, "dd/MM/yyyy")}
                      {isExpired && <span className="ml-2 text-red-500 text-sm">(Expirada)</span>}
                    </p>
                  </div>
                </div>
                {quotation.returnDate && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Fecha de Retorno</p>
                    <p className="font-medium">{format(new Date(quotation.returnDate), "dd/MM/yyyy")}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

