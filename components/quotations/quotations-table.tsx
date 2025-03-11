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
import { MoreHorizontal, PencilIcon, TrashIcon, EyeIcon, Search, FilterIcon, CheckIcon, XIcon } from "lucide-react"
import { Currency, type Quotation, QuotationStatus } from "@/types"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { toast } from "@/components/ui/use-toast"
import { FileText } from "lucide-react"
import { useQuotationStore } from "@/lib/stores/useQuotationStore"
import { generateQuotationPDF } from "@/lib/generateQuotationPDF"

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
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cotizaciones..."
            value={searchTerm}
            onChange={handleSearch}
            className="h-9 w-full sm:w-[250px] md:w-[300px] lg:w-[400px]"
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
                <SelectItem value={QuotationStatus.DRAFT}>Borrador</SelectItem>
                <SelectItem value={QuotationStatus.SENT}>Enviada</SelectItem>
                <SelectItem value={QuotationStatus.ACCEPTED}>Aceptada</SelectItem>
                <SelectItem value={QuotationStatus.REJECTED}>Rechazada</SelectItem>
                <SelectItem value={QuotationStatus.EXPIRED}>Expirada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Badge variant="outline" className="text-xs">
            {filteredQuotations.length} cotizaciones
          </Badge>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-24">
              <p>Cargando cotizaciones...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden md:table-cell">Fecha</TableHead>
                  <TableHead className="hidden lg:table-cell">Fecha de Entrega</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No se encontraron cotizaciones.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuotations.map((quotation) => (
                    <TableRow key={quotation.id}>
                      <TableCell className="font-medium">{quotation.number}</TableCell>
                      <TableCell>{quotation.client.name}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {format(new Date(quotation.date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {format(new Date(quotation.equipmentReleaseDate), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>{formatCurrency(quotation.total, quotation.currency as Currency)}</TableCell>
                      <TableCell>{getStatusBadge(quotation.status as QuotationStatus)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleGeneratePDF(quotation)}>
                              <FileText className="mr-2 h-4 w-4" />
                              <span>Generar PDF</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/quotations/${quotation.id}`}>
                                <EyeIcon className="mr-2 h-4 w-4" />
                                <span>Ver detalles</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/quotations/${quotation.id}/edit`}>
                                <PencilIcon className="mr-2 h-4 w-4" />
                                <span>Editar</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {quotation.status === QuotationStatus.SENT && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(quotation, QuotationStatus.ACCEPTED)}
                                >
                                  <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
                                  <span>Marcar como Aceptada</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(quotation, QuotationStatus.REJECTED)}
                                >
                                  <XIcon className="mr-2 h-4 w-4 text-red-500" />
                                  <span>Marcar como Rechazada</span>
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteQuotation(quotation)}>
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}

