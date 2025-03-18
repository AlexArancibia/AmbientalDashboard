"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Currency, PurchaseOrderStatus, type PurchaseOrder } from "@/types"
import { format } from "date-fns"
import {
  ArrowLeft,
  Printer,
  Edit,
  Download,
  Trash,
  Building,
  User,
  FileText,
  DollarSign,
  Tag,
  MessageSquare,
  CreditCard,
} from "lucide-react"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"
import { generatePurchaseOrderPDF } from "@/lib/generatePurchaseOrderPDF"
import { usePurchaseOrderStore } from "@/lib/stores/usePurchaseOrderStore"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PurchaseOrderDetailProps {
  purchaseOrder: PurchaseOrder
}

export function PurchaseOrderDetail({ purchaseOrder }: PurchaseOrderDetailProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { deletePurchaseOrder } = usePurchaseOrderStore()

  const getStatusBadge = (status: PurchaseOrderStatus) => {
    switch (status) {
      case PurchaseOrderStatus.PENDING:
        return <Badge className="bg-yellow-500">Pendiente</Badge>
      case PurchaseOrderStatus.IN_PROGRESS:
        return <Badge className="bg-blue-500">En Progreso</Badge>
      case PurchaseOrderStatus.COMPLETED:
        return <Badge className="bg-green-500">Completada</Badge>
      case PurchaseOrderStatus.CANCELLED:
        return <Badge className="bg-red-500">Cancelada</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const formatCurrency = (amount: number, currency: Currency) => {
    const symbol = currency === Currency.PEN ? "S/. " : "$ "
    return symbol + amount.toFixed(2)
  }

  const handlePrint = () => {
    const doc = generatePurchaseOrderPDF(purchaseOrder)
    doc.autoPrint()
    window.open(doc.output("bloburl"), "_blank")

    toast({
      title: "Imprimiendo",
      description: "Enviando orden de compra a la impresora...",
    })
  }

  const handleGeneratePDF = () => {
    const doc = generatePurchaseOrderPDF(purchaseOrder)
    doc.save(`orden-compra-${purchaseOrder.number}.pdf`)

    toast({
      title: "PDF generado",
      description: `El PDF de la orden de compra ${purchaseOrder.number} ha sido generado exitosamente.`,
    })
  }

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      const success = await deletePurchaseOrder(purchaseOrder.id)
      if (success) {
        toast({
          title: "Orden de compra eliminada",
          description: `La orden de compra ${purchaseOrder.number} ha sido eliminada exitosamente.`,
        })
        router.push("/purchase-orders")
      } else {
        throw new Error("No se pudo eliminar la orden de compra")
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "No se pudo eliminar la orden de compra. Inténtelo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center">
          <Button variant="outline" asChild className="mr-4">
            <Link href="/purchase-orders">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Órdenes de Compra
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Orden de Compra #{purchaseOrder.number}</h1>
          <div className="ml-4">{getStatusBadge(purchaseOrder.status)}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Button variant="outline" onClick={handleGeneratePDF}>
            <Download className="mr-2 h-4 w-4" />
            Descargar PDF
          </Button>
          <Button asChild>
            <Link href={`/purchase-orders/${purchaseOrder.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isLoading}>
                <Trash className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Esto eliminará permanentemente la orden de compra{" "}
                  {purchaseOrder.number}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  {isLoading ? "Eliminando..." : "Eliminar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="details">Detalles</TabsTrigger>
          <TabsTrigger value="items">Ítems</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Información General */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-primary" />
                  Información General
                </CardTitle>
                <CardDescription>Detalles básicos de la orden de compra</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Número</span>
                    <span className="font-medium">{purchaseOrder.number}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Fecha</span>
                    <span>{format(new Date(purchaseOrder.date), "dd/MM/yyyy")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Estado</span>
                    <div>{getStatusBadge(purchaseOrder.status)}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Moneda</span>
                    <span>{purchaseOrder.currency === Currency.PEN ? "Soles (PEN)" : "Dólares (USD)"}</span>
                  </div>
                </div>

                {purchaseOrder.description && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Descripción</p>
                    <p className="text-sm">{purchaseOrder.description}</p>
                  </div>
                )}

                {purchaseOrder.comments && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      <MessageSquare className="inline mr-1 h-4 w-4" /> Comentarios
                    </p>
                    <p className="text-sm">{purchaseOrder.comments}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Información del Proveedor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="mr-2 h-5 w-5 text-primary" />
                  Información del Proveedor
                </CardTitle>
                <CardDescription>Datos del proveedor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Nombre</span>
                    <span className="font-medium">{purchaseOrder.client.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">RUC</span>
                    <span>{purchaseOrder.client.ruc}</span>
                  </div>
                  {purchaseOrder.client.address && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Dirección</span>
                      <span className="text-right">{purchaseOrder.client.address}</span>
                    </div>
                  )}
                  {purchaseOrder.client.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Email</span>
                      <span>{purchaseOrder.client.email}</span>
                    </div>
                  )}
 
                </div>
              </CardContent>
            </Card>

            {/* Resumen Financiero */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="mr-2 h-5 w-5 text-primary" />
                  Resumen Financiero
                </CardTitle>
                <CardDescription>Totales de la orden de compra</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(purchaseOrder.subtotal, purchaseOrder.currency)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">IGV (18%)</span>
                      <span>{formatCurrency(purchaseOrder.igv, purchaseOrder.currency)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="font-bold">Total</span>
                      <span className="font-bold text-lg">
                        {formatCurrency(purchaseOrder.total, purchaseOrder.currency)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        <User className="inline mr-1 h-4 w-4" /> Gestor
                      </span>
                      <span>{purchaseOrder.gestor.name}</span>
                    </div>
                    {purchaseOrder.attendantName && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Atendido por</span>
                        <span>{purchaseOrder.attendantName}</span>
                      </div>
                    )}
                    {purchaseOrder.paymentTerms && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          <CreditCard className="inline mr-1 h-4 w-4" /> Términos de Pago
                        </span>
                        <span>{purchaseOrder.paymentTerms}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="items">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Tag className="mr-2 h-5 w-5 text-primary" />
                Ítems de la Orden
              </CardTitle>
              <CardDescription>Productos o servicios incluidos en esta orden de compra</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Código</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-center">Cantidad</TableHead>
                    <TableHead className="text-right">Precio Unitario</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrder.items.map((item, index) => (
                    <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">{item.code || "-"}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.unitPrice, purchaseOrder.currency)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.quantity * item.unitPrice, purchaseOrder.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {purchaseOrder.items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        No hay ítems en esta orden de compra
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="mt-6 flex justify-end">
                <div className="w-[300px] space-y-2 border p-4 rounded-lg bg-muted/30">
                  <div className="flex justify-between">
                    <span className="font-medium">Subtotal:</span>
                    <span>{formatCurrency(purchaseOrder.subtotal, purchaseOrder.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">IGV (18%):</span>
                    <span>{formatCurrency(purchaseOrder.igv, purchaseOrder.currency)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-bold">Total:</span>
                    <span className="font-bold text-lg">
                      {formatCurrency(purchaseOrder.total, purchaseOrder.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

