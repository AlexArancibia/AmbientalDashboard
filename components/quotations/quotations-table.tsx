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
  CheckIcon,
  XIcon,
  FileText,
  AlertCircle,
  Plus,
} from "lucide-react"
import { Currency, type Quotation, QuotationStatus } from "@/types"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { toast } from "@/components/ui/use-toast"
import { useQuotationStore } from "@/lib/stores/useQuotationStore"
import { generateQuotationPDF } from "@/lib/generateQuotationPDF"
import { Skeleton } from "@/components/ui/skeleton"

export function QuotationsTable() {
  const { quotations, isLoading, error, fetchQuotations, updateQuotation, deleteQuotation } = useQuotationStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [filteredQuotations, setFilteredQuotations] = useState<Quotation[]>([])

  // Fetch quotations on component mount
  useEffect(() => {
    const loadQuotations = async () => {
      try {
        await fetchQuotations()
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Error desconocido"
        toast({
          title: "Error al cargar cotizaciones",
          description: errorMessage,
          variant: "destructive",
        })
      }
    }

    loadQuotations()
  }, [fetchQuotations])

  // Filter quotations whenever the search term, status filter, or quotations list changes
  useEffect(() => {
    const filtered = quotations.filter(
      (quotation) =>
        (quotation.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          quotation.client.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (statusFilter === "all" || quotation.status === statusFilter),
    )
    setFilteredQuotations(filtered)
  }, [quotations, searchTerm, statusFilter])

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

  const getStatusBadge = (status: QuotationStatus) => {
    switch (status) {
      case QuotationStatus.DRAFT:
        return (
          <Badge variant="outline" className="font-medium text-gray-600 border-gray-300">
            Borrador
          </Badge>
        )
      case QuotationStatus.SENT:
        return <Badge className="bg-blue-500 hover:bg-blue-600 font-medium">Enviada</Badge>
      case QuotationStatus.ACCEPTED:
        return <Badge className="bg-green-500 hover:bg-green-600 font-medium">Aceptada</Badge>
      case QuotationStatus.REJECTED:
        return <Badge className="bg-red-500 hover:bg-red-600 font-medium">Rechazada</Badge>
      case QuotationStatus.EXPIRED:
        return (
          <Badge variant="secondary" className="font-medium">
            Expirada
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  const formatCurrency = (amount: number, currency: Currency) => {
    const symbol = currency === Currency.PEN ? "S/. " : "$ "
    return symbol + amount.toFixed(2)
  }

  const handleGeneratePDF = (quotation: Quotation) => {
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

  const handleStatusChange = async (quotation: Quotation, newStatus: QuotationStatus) => {
    try {
      const result = await updateQuotation(quotation.id, { status: newStatus })
      if (result) {
        toast({
          title: "Estado actualizado",
          description: `La cotización ${quotation.number} ha sido marcada como ${newStatus}.`,
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      toast({
        title: "Error al actualizar estado",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleDeleteQuotation = async (quotation: Quotation) => {
    if (confirm(`¿Estás seguro de que deseas eliminar la cotización ${quotation.number}?`)) {
      try {
        const success = await deleteQuotation(quotation.id)
        if (success) {
          toast({
            title: "Cotización eliminada",
            description: `La cotización ${quotation.number} ha sido eliminada exitosamente.`,
          })
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Error desconocido"
        toast({
          title: "Error al eliminar cotización",
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
                    <SelectItem value={QuotationStatus.DRAFT}>Borrador</SelectItem>
                    <SelectItem value={QuotationStatus.SENT}>Enviada</SelectItem>
                    <SelectItem value={QuotationStatus.ACCEPTED}>Aceptada</SelectItem>
                    <SelectItem value={QuotationStatus.REJECTED}>Rechazada</SelectItem>
                    <SelectItem value={QuotationStatus.EXPIRED}>Expirada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Badge variant="outline" className="text-xs font-normal py-1 border-border/60">
                {filteredQuotations.length} cotizaciones
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
          ) : filteredQuotations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No se encontraron cotizaciones</h3>
              <p className="text-muted-foreground mt-2 max-w-md">
                {searchTerm || statusFilter !== "all"
                  ? "Intenta ajustar los filtros de búsqueda para encontrar lo que estás buscando."
                  : "Comienza creando una nueva cotización para tus clientes."}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Button asChild className="mt-6">
                  <Link href="/quotations/new">
                    <Plus className="mr-2 h-4 w-4" /> Crear Cotización
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
                    <TableHead className="font-semibold hidden lg:table-cell">Fecha de Entrega</TableHead>
                    <TableHead className="font-semibold">Total</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                    <TableHead className="text-right font-semibold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotations.map((quotation) => (
                    <TableRow
                      key={quotation.id}
                      className="group border-b border-border/40 hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="font-medium text-primary">
                        <Link href={`/quotations/${quotation.id}`} className="hover:underline">
                          {quotation.number}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={quotation.client.name}>
                        {quotation.client.name}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {format(new Date(quotation.date), "dd MMM, yyyy")}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {format(new Date(quotation.equipmentReleaseDate), "dd MMM, yyyy")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(quotation.total, quotation.currency as Currency)}
                      </TableCell>
                      <TableCell>{getStatusBadge(quotation.status as QuotationStatus)}</TableCell>
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
                            <DropdownMenuItem onClick={() => handleGeneratePDF(quotation)} className="cursor-pointer">
                              <FileText className="mr-2 h-4 w-4" />
                              <span>Generar PDF</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/quotations/${quotation.id}`} className="cursor-pointer">
                                <EyeIcon className="mr-2 h-4 w-4" />
                                <span>Ver detalles</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/quotations/${quotation.id}/edit`} className="cursor-pointer">
                                <PencilIcon className="mr-2 h-4 w-4" />
                                <span>Editar</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {quotation.status === QuotationStatus.SENT && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(quotation, QuotationStatus.ACCEPTED)}
                                  className="cursor-pointer"
                                >
                                  <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
                                  <span>Marcar Aceptada</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(quotation, QuotationStatus.REJECTED)}
                                  className="cursor-pointer"
                                >
                                  <XIcon className="mr-2 h-4 w-4 text-red-500" />
                                  <span>Marcar Rechazada</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600 cursor-pointer"
                              onClick={() => handleDeleteQuotation(quotation)}
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

