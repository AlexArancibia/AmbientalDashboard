"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  Calendar,
  User,
  DollarSign,
} from "lucide-react"
import { ServiceOrderStatus } from "@/types"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { useServiceOrderStore } from "@/lib/stores/useServiceOrderStore"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ServiceOrdersTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const { serviceOrders, isLoading, error, fetchServiceOrders, deleteServiceOrder } = useServiceOrderStore()

  useEffect(() => {
    fetchServiceOrders()
  }, [fetchServiceOrders])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
  }

  const filteredOrders = serviceOrders.filter(
    (order) =>
      (order.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.client?.name?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (statusFilter === "all" || order.status === statusFilter),
  )

  const getStatusBadge = (status: ServiceOrderStatus) => {
    switch (status) {
      case ServiceOrderStatus.PENDING:
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50">
            Pendiente
          </Badge>
        )
      case ServiceOrderStatus.IN_PROGRESS:
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50">
            En Progreso
          </Badge>
        )
      case ServiceOrderStatus.COMPLETED:
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50">
            Completada
          </Badge>
        )
      case ServiceOrderStatus.CANCELLED:
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50">
            Cancelada
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600">
            <p>Error al cargar las órdenes de servicio: {error}</p>
            <Button variant="outline" size="sm" onClick={() => fetchServiceOrders()}>
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="border-none shadow-none">
        <CardHeader className="px-0 pt-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número o cliente..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-8 h-9 w-full sm:w-[300px] md:w-[400px] lg:w-[500px] bg-background"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <FilterIcon className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={handleStatusFilter}>
                  <SelectTrigger className="h-9 w-[180px]">
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los Estados</SelectItem>
                    {Object.values(ServiceOrderStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status === ServiceOrderStatus.PENDING
                          ? "Pendiente"
                          : status === ServiceOrderStatus.IN_PROGRESS
                            ? "En Progreso"
                            : status === ServiceOrderStatus.COMPLETED
                              ? "Completada"
                              : status === ServiceOrderStatus.CANCELLED
                                ? "Cancelada"
                                : status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Badge variant="outline" className="text-xs bg-muted">
                {filteredOrders.length} órdenes
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[120px]">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    Número
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    Fecha
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    Cliente
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                    Total
                  </div>
                </TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5)
                  .fill(0)
                  .map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell>
                        <Skeleton className="h-5 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-40" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-8 rounded-full ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <FileText className="h-10 w-10 mb-2 opacity-20" />
                      <p>No se encontraron órdenes de servicio</p>
                      <p className="text-sm">Intente con otros criterios de búsqueda o cree una nueva orden</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id} className="group">
                    <TableCell className="font-medium">
                      <Link href={`/service-orders/${order.id}`} className="hover:underline">
                        {order.number}
                      </Link>
                    </TableCell>
                    <TableCell>{format(new Date(order.date), "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      <div className="max-w-[250px] truncate" title={order.client.name}>
                        {order.client.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {order.currency === "PEN" ? "S/. " : "$ "}
                        {order.total.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 opacity-70 group-hover:opacity-100">
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/service-orders/${order.id}`} className="cursor-pointer">
                              <EyeIcon className="mr-2 h-4 w-4" />
                              <span>Ver detalles</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/service-orders/${order.id}/edit`} className="cursor-pointer">
                              <PencilIcon className="mr-2 h-4 w-4" />
                              <span>Editar</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              if (window.confirm("¿Estás seguro de que quieres eliminar esta orden de servicio?")) {
                                deleteServiceOrder(order.id)
                              }
                            }}
                            className="text-red-600 focus:text-red-600 cursor-pointer"
                          >
                            <TrashIcon className="mr-2 h-4 w-4" />
                            <span>Eliminar</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

