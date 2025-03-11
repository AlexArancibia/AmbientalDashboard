"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useServiceOrderStore } from "@/lib/stores/useServiceOrderStore"
import { type ServiceOrder, ServiceOrderStatus, Currency } from "@/types"
import { format } from "date-fns"
import { generateServiceOrderPDF } from "@/lib/generateServiceOrderPDF"

interface ServiceOrderDetailProps {
  id: string
}

export function ServiceOrderDetail({ id }: ServiceOrderDetailProps) {
  const router = useRouter()
  const { toast } = useToast()
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

  const handleGeneratePDF = async () => {
    if (!serviceOrder) return

    try {
      const doc = generateServiceOrderPDF(serviceOrder)
      doc.autoPrint()
      window.open(doc.output("bloburl"), "_blank")
 
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Error",
        description: "No se pudo generar el PDF. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }

  if (!serviceOrder) {
    return <div>Cargando...</div>
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PE", { style: "currency", currency: serviceOrder.currency }).format(amount)
  }

  const getStatusBadge = (status: ServiceOrderStatus) => {
    switch (status) {
      case ServiceOrderStatus.PENDING:
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pendiente</span>
      case ServiceOrderStatus.IN_PROGRESS:
        return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">En Progreso</span>
      case ServiceOrderStatus.COMPLETED:
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Completada</span>
      case ServiceOrderStatus.CANCELLED:
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded">Cancelada</span>
      default:
        return <span>{status}</span>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orden de Servicio #{serviceOrder.number}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div>
            <h3 className="text-lg font-semibold">Información General</h3>
            <p>Fecha: {format(new Date(serviceOrder.date), "dd/MM/yyyy")}</p>
            <p>Estado: {getStatusBadge(serviceOrder.status as ServiceOrderStatus)}</p>
            <p>Moneda: {serviceOrder.currency === Currency.PEN ? "Soles" : "Dólares"}</p>
            {serviceOrder.description && <p>Descripción: {serviceOrder.description}</p>}
            {serviceOrder.paymentTerms && <p>Términos de pago: {serviceOrder.paymentTerms}</p>}
          </div>
          <div>
            <h3 className="text-lg font-semibold">Información del Cliente</h3>
            <p>Nombre: {serviceOrder.client.name}</p>
            <p>RUC: {serviceOrder.client.ruc}</p>
            <p>Email: {serviceOrder.client.email}</p>
            <p>Dirección: {serviceOrder.client.address}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Detalles de Servicio</h3>
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Días
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio Unitario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {serviceOrder.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{item.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.days || 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatCurrency(item.total || item.quantity * item.unitPrice * (item.days || 1))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 text-right">
              <p>Subtotal: {formatCurrency(serviceOrder.subtotal)}</p>
              <p>IGV: {formatCurrency(serviceOrder.igv)}</p>
              <p className="font-bold">Total: {formatCurrency(serviceOrder.total)}</p>
            </div>
          </div>
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Detalles Adicionales</TabsTrigger>
              <TabsTrigger value="personnel">Personal Asignado</TabsTrigger>
            </TabsList>
            <TabsContent value="details">
              <p>{serviceOrder.comments || "No hay comentarios adicionales."}</p>
              <p>Creado el: {format(new Date(serviceOrder.createdAt), "dd/MM/yyyy HH:mm")}</p>
              <p>Última actualización: {format(new Date(serviceOrder.updatedAt), "dd/MM/yyyy HH:mm")}</p>
            </TabsContent>
            <TabsContent value="personnel">
              <p>Gestor: {serviceOrder.gestor.name}</p>
              {serviceOrder.attendantName && <p>Técnico asignado: {serviceOrder.attendantName}</p>}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={handleGeneratePDF}>Generar PDF</Button>
        <div>
          <Button variant="outline" className="mr-2" onClick={() => router.push(`/service-orders/${id}/edit`)}>
            Editar
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Eliminar
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

