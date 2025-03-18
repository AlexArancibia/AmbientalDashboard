"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  MoreHorizontal,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  Search,
  FilterIcon,
  FileText,
  AlertCircle,
  Plus,
} from "lucide-react"
import { Currency, PurchaseOrderStatus } from "@/types"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { toast } from "@/components/ui/use-toast"
import { usePurchaseOrderStore } from "@/lib/stores/usePurchaseOrderStore"
import { generatePurchaseOrderPDF } from "@/lib/generatePurchaseOrderPDF"
import { Skeleton } from "@/components/ui/skeleton"

export function PurchaseOrdersTable() {
  const { purchaseOrders, isLoading, error, fetchPurchaseOrders, updatePurchaseOrder, deletePurchaseOrder } =
    usePurchaseOrderStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [filteredOrders, setFilteredOrders] = useState<any[]>([])

  // Fetch purchase orders on component mount
  useEffect(() => {
    const loadPurchaseOrders = async () => {
      try {
        await fetchPurchaseOrders()
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Error desconocido"
        toast({
          title: "Error al cargar órdenes de compra",
          description: errorMessage,
          variant: "destructive",
        })
      }
    }

    loadPurchaseOrders()
  }, [fetchPurchaseOrders])

  // Filter purchase orders whenever the search term, status filter, or purchase orders list changes
  useEffect(() => {
    const filtered = purchaseOrders.filter(
      (order) =>
        (order.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.client.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (statusFilter === "all" || order.status === statusFilter),
    )
    setFilteredOrders(filtered)
  }, [purchaseOrders, searchTerm, statusFilter])

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      })
    }
  }, [error])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
  }

  const getStatusBadge = (status: PurchaseOrderStatus) => {
    switch (status) {
      case PurchaseOrderStatus.PENDING:
        return (
          <Badge variant="outline" className="font-medium text-gray-600 border-gray-300">
            Pendiente
          </Badge>
        )
      case PurchaseOrderStatus.IN_PROGRESS:
        return <Badge className="bg-blue-500 hover:bg-blue-600 font-medium">En Progreso</Badge>
      case PurchaseOrderStatus.COMPLETED:
        return <Badge className="bg-green-500 hover:bg-green-600 font-medium">Completada</Badge>
      case PurchaseOrderStatus.CANCELLED:
        return <Badge className="bg-red-500 hover:bg-red-600 font-medium">Cancelada</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const formatCurrency = (amount: number, currency: Currency) => {
    const symbol = currency === Currency.PEN ? "S/. " : "$ "
    return symbol + amount.toFixed(2)
  }

  const handleGeneratePDF = (order: any) => {
    try {
      const doc = generatePurchaseOrderPDF(order)
      const fileName = `orden_compra_${order.number.replace(/\//g, "-")}.pdf`
      doc.save(fileName)

      toast({
        title: "PDF generado",
        description: `El PDF de la orden de compra ${order.number} ha sido generado exitosamente.`,
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

  const handleDeleteOrder = async (order: any) => {
    if (confirm(`¿Estás seguro de que deseas eliminar la orden de compra ${order.number}?`)) {
      try {
        const success = await deletePurchaseOrder(order.id)
        if (success) {
          toast({
            title: "Orden de compra eliminada",
            description: `La orden de compra ${order.number} ha sido eliminada exitosamente.`,
          })
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Error desconocido"
        toast({
          title: "Error al eliminar orden de compra",
          description: errorMessage,
          variant: "destructive",
        })
      }
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/40 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por número o cliente..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-9 h-10 w-full sm:w-[300px] md:w-[400px] bg-background border-border/60 focus-visible:ring-primary/20"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <FilterIcon className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={handleStatusFilter}>
                  <SelectTrigger className="h-10 w-[180px] border-border/60 focus:ring-primary/20">
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los Estados</SelectItem>
                    <SelectItem value={PurchaseOrderStatus.PENDING}>Pendiente</SelectItem>
                    <SelectItem value={PurchaseOrderStatus.IN_PROGRESS}>En Progreso</SelectItem>
                    <SelectItem value={PurchaseOrderStatus.COMPLETED}>Completada</SelectItem>
                      <SelectItem value={PurchaseOrderStatus.CANCELLED}>Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Badge variant="outline" className="text-xs font-normal py-1 border-border/60">
                {filteredOrders.length} órdenes de compra
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/40 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-[30%]" />
                  <Skeleton className="h-12 w-[30%]" />
                  <Skeleton className="h-12 w-[20%]" />
                  <Skeleton className="h-12 w-[20%]" />
                </div>
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No se encontraron órdenes de compra</h3>
              <p className="text-muted-foreground mt-2 max-w-md">
                {searchTerm || statusFilter !== "all"
                  ? "Intenta ajustar los filtros de búsqueda para encontrar lo que estás buscando."
                  : "Comienza creando una nueva orden de compra."}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Button asChild className="mt-6">
                  <Link href="/purchase-orders/new">
                    <Plus className="mr-2 h-4 w-4" /> Crear Orden de Compra
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold">Número</TableHead>
                    <TableHead className="font-semibold">Cliente</TableHead>
                    <TableHead className="font-semibold hidden md:table-cell">Fecha</TableHead>
                    <TableHead className="font-semibold hidden lg:table-cell">Gestor</TableHead>
                    <TableHead className="font-semibold">Total</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                    <TableHead className="text-right font-semibold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="group border-b border-border/40 hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="font-medium text-primary">
                        <Link href={`/purchase-orders/${order.id}`} className="hover:underline">
                          {order.number}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={order.client.name}>
                        {order.client.name}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {format(new Date(order.date), "dd MMM, yyyy")}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {order.gestor?.name || "No asignado"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(order.total, order.currency as Currency)}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status as PurchaseOrderStatus)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 opacity-70 group-hover:opacity-100">
                              <span className="sr-only">Abrir menú</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[180px]">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleGeneratePDF(order)} className="cursor-pointer">
                              <FileText className="mr-2 h-4 w-4" />
                              <span>Generar PDF</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/purchase-orders/${order.id}`} className="cursor-pointer">
                                <EyeIcon className="mr-2 h-4 w-4" />
                                <span>Ver detalles</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/purchase-orders/${order.id}/edit`} className="cursor-pointer">
                                <PencilIcon className="mr-2 h-4 w-4" />
                                <span>Editar</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600 cursor-pointer"
                              onClick={() => handleDeleteOrder(order)}
                            >
                              <TrashIcon className="mr-2 h-4 w-4" />
                              <span>Eliminar</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

