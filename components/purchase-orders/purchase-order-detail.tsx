"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Currency, PurchaseOrderStatus, type PurchaseOrder } from "@/types"
import { format } from "date-fns"
import { ArrowLeft, Printer, Edit, Download, Trash } from "lucide-react"
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

interface PurchaseOrderDetailProps {
  purchaseOrder: PurchaseOrder
}

export function PurchaseOrderDetail({ purchaseOrder }: PurchaseOrderDetailProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { deletePurchaseOrder } = usePurchaseOrderStore()

  const getStatusBadge = (status: PurchaseOrderStatus) => {
    switch (status) {
      case PurchaseOrderStatus.DRAFT:
        return <Badge className="bg-yellow-500">Borrador</Badge>
      case PurchaseOrderStatus.SENT:
        return <Badge className="bg-blue-500">Enviada</Badge>
      case PurchaseOrderStatus.CONFIRMED:
        return <Badge className="bg-green-500">Confirmada</Badge>
      case PurchaseOrderStatus.CANCELLED:
        return <Badge className="bg-red-500">Cancelada</Badge>
      case PurchaseOrderStatus.RECEIVED:
        return <Badge className="bg-purple-500">Recibida</Badge>
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
    const fileName = `${purchaseOrder.number.replace(/\//g, "-")}.pdf`
    doc.save(fileName)

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
        <Button variant="outline" asChild>
          <Link href="/purchase-orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Órdenes de Compra
          </Link>
        </Button>
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

      <Card>
        <CardHeader>
          <CardTitle>Información General</CardTitle>
          <CardDescription>Detalles básicos de la orden de compra</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Número</p>
              <p className="text-lg font-medium">{purchaseOrder.number}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fecha</p>
              <p className="text-lg font-medium">{format(new Date(purchaseOrder.date), "dd/MM/yyyy")}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Cliente</p>
              <p>{purchaseOrder.client.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">RUC</p>
              <p>{purchaseOrder.client.ruc}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Estado</p>
              <div className="mt-1">{getStatusBadge(purchaseOrder.status)}</div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Moneda</p>
              <p>{purchaseOrder.currency === Currency.PEN ? "Soles (PEN)" : "Dólares (USD)"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Gestor</p>
              <p>{purchaseOrder.gestor.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Atendido por</p>
              <p>{purchaseOrder.attendantName || "-"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Términos de Pago</p>
              <p>{purchaseOrder.paymentTerms || "-"}</p>
            </div>
          </div>

          {purchaseOrder.description && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Descripción</p>
              <p className="mt-1">{purchaseOrder.description}</p>
            </div>
          )}

          {purchaseOrder.comments && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Comentarios</p>
              <p className="mt-1">{purchaseOrder.comments}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalles de la Orden</CardTitle>
          <CardDescription>Ítems incluidos en esta orden de compra</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-center">Cantidad</TableHead>
                <TableHead className="text-right">Precio Unitario</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrder.items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unitPrice, purchaseOrder.currency)}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.quantity * item.unitPrice, purchaseOrder.currency)}
                  </TableCell>
                </TableRow>
              ))}
              {purchaseOrder.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No hay ítems en esta orden de compra
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="mt-6 flex justify-end">
            <div className="w-[250px] space-y-2">
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
                <span className="font-bold">{formatCurrency(purchaseOrder.total, purchaseOrder.currency)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

