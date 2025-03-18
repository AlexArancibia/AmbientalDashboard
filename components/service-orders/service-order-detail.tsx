"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Currency, ServiceOrderStatus, type ServiceOrder } from "@/types"
import { format } from "date-fns"
import {
  ArrowLeft,
  FileText,
  Printer,
  Edit,
  ClipboardList,
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
import { useServiceOrderStore } from "@/lib/stores/useServiceOrderStore"
import { generateServiceOrderPDF } from "@/lib/generateServiceOrderPDF"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"

interface ServiceOrderDetailProps {
  id: string
}

export function ServiceOrderDetail({ id }: ServiceOrderDetailProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("details")
  const [serviceOrder, setServiceOrder] = useState<ServiceOrder | null>(null)
  const { getServiceOrder, deleteServiceOrder } = useServiceOrderStore()

  useEffect(() => {
    const fetchServiceOrder = async () => {
      const order = await getServiceOrder(id)
      if (order) {
        setServiceOrder(order)
      } else {
        router.push("/service-orders")
      }
    }
    fetchServiceOrder()
  }, [id, getServiceOrder, router])

  const getStatusBadge = (status: ServiceOrderStatus) => {
    switch (status) {
      case ServiceOrderStatus.PENDING:
        return (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-medium text-yellow-600 border-yellow-300">
              Pendiente
            </Badge>
            <span className="text-sm text-muted-foreground">En espera de inicio</span>
          </div>
        )
      case ServiceOrderStatus.IN_PROGRESS:
        return (
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-500 hover:bg-blue-600 font-medium">En Progreso</Badge>
            <span className="text-sm text-muted-foreground">Trabajo en curso</span>
          </div>
        )
      case ServiceOrderStatus.COMPLETED:
        return (
          <div className="flex items-center gap-2">
            <Badge className="bg-green-500 hover:bg-green-600 font-medium">Completada</Badge>
            <span className="text-sm text-muted-foreground">Servicio finalizado</span>
          </div>
        )
      case ServiceOrderStatus.CANCELLED:
        return (
          <div className="flex items-center gap-2">
            <Badge className="bg-red-500 hover:bg-red-600 font-medium">Cancelada</Badge>
            <span className="text-sm text-muted-foreground">Servicio cancelado</span>
          </div>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    if (!serviceOrder) return ""
    return new Intl.NumberFormat("es-PE", { style: "currency", currency: serviceOrder.currency }).format(amount)
  }

  const handleDelete = async () => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta orden de servicio?")) {
      const success = await deleteServiceOrder(id)
      if (success) {
        toast({
          title: "Orden de servicio eliminada",
          description: "La orden de servicio ha sido eliminada exitosamente.",
        })
        router.push("/service-orders")
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar la orden de servicio.",
          variant: "destructive",
        })
      }
    }
  }

  const handlePrint = () => {
    try {
      const doc = generateServiceOrderPDF(serviceOrder!)
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
      const doc = generateServiceOrderPDF(serviceOrder!)
      const fileName = `orden_servicio_${serviceOrder!.number.replace(/\//g, "-")}.pdf`
      doc.save(fileName)

      toast({
        title: "PDF generado",
        description: `El PDF de la orden de servicio ${serviceOrder!.number} ha sido generado exitosamente.`,
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

  if (!serviceOrder) {
    return <div>Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" asChild className="w-fit">
          <Link href="/service-orders" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Órdenes de Servicio
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handlePrint} className=" transition-colors">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Button variant="outline" onClick={handleGeneratePDF} className=" transition-colors">
            <FileText className="mr-2 h-4 w-4" />
            Generar PDF
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90 transition-colors">
            <Link href={`/service-orders/${id}/edit`}>
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
                <CardTitle className="text-2xl font-bold">Orden de Servicio #{serviceOrder.number}</CardTitle>
                <CardDescription className="mt-1">
                  Creada el {format(new Date(serviceOrder.date), "dd 'de' MMMM, yyyy")}
                </CardDescription>
              </div>
              {getStatusBadge(serviceOrder.status as ServiceOrderStatus)}
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
                      <p className="font-medium">{serviceOrder.client.name}</p>
                      <p className="text-sm text-muted-foreground">RUC: {serviceOrder.client.ruc}</p>
                    </div>
                  </div>
                  {serviceOrder.client.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm">{serviceOrder.client.address}</p>
                    </div>
                  )}
                  {serviceOrder.client.email && (
                    <div className="flex items-start gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm">{serviceOrder.client.email}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Detalles de la Orden
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm">
                        Moneda:{" "}
                        <span className="font-medium">
                          {serviceOrder.currency === Currency.PEN ? "Soles (PEN)" : "Dólares (USD)"}
                        </span>
                      </p>
                    </div>
                  </div>
                  {serviceOrder.paymentTerms && (
                    <div className="flex items-start gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm">
                          Términos de Pago: <span className="font-medium">{serviceOrder.paymentTerms}</span>
                        </p>
                      </div>
                    </div>
                  )}
                  {serviceOrder.attendantName && (
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm">
                          Técnico Asignado: <span className="font-medium">{serviceOrder.attendantName}</span>
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm">
                        Gestor: <span className="font-medium">{serviceOrder.gestor.name}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {serviceOrder.description && (
              <div className="mt-6 pt-6 border-t border-border/40">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Descripción
                </h3>
                <p className="text-sm whitespace-pre-line">{serviceOrder.description}</p>
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
                <span>{formatCurrency(serviceOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IGV (18%):</span>
                <span>{formatCurrency(serviceOrder.igv)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-medium text-lg">
                <span>Total:</span>
                <span>{formatCurrency(serviceOrder.total)}</span>
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
          <CardDescription>Servicios incluidos en esta orden</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold">Código</TableHead>
                  <TableHead className="font-semibold">Descripción</TableHead>
                  <TableHead className="font-semibold">Nombre</TableHead>
                  <TableHead className="font-semibold">Cantidad</TableHead>
                  <TableHead className="font-semibold">Días</TableHead>
                  <TableHead className="font-semibold">Precio Unitario</TableHead>
                  <TableHead className="font-semibold text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceOrder.items.map((item) => (
                  <TableRow key={item.id} className="border-b border-border/40">
                    <TableCell>{item.code}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.days || 1}</TableCell>
                    <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.total || item.quantity * item.unitPrice * (item.days || 1))}
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
          <TabsTrigger value="personnel" className="data-[state=active]:bg-primary/10">
            <User className="mr-2 h-4 w-4" />
            Personal Asignado
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
                    <p className="font-medium">{format(new Date(serviceOrder.createdAt), "dd/MM/yyyy HH:mm")}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Última Actualización</p>
                    <p className="font-medium">{format(new Date(serviceOrder.updatedAt), "dd/MM/yyyy HH:mm")}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {serviceOrder.comments && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Comentarios</p>
                      <p className="whitespace-pre-line">{serviceOrder.comments}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="personnel">
          <Card className="border-border/40 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle>Personal Asignado</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Gestor</p>
                    <p className="font-medium">{serviceOrder.gestor.name}</p>
                  </div>
                  {serviceOrder.attendantName && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Técnico Asignado</p>
                      <p className="font-medium">{serviceOrder.attendantName}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

