"use client"

import type React from "react"
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
  Plus,
  AlertTriangle,
  AlertCircle,
} from "lucide-react"
import { type Equipment, EquipmentStatus } from "@/types"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"
import { getEquipmentApi } from "@/lib/api"
import { format, differenceInDays, isBefore } from "date-fns"
import { es } from "date-fns/locale"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function EquipmentTable() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([])

  // Cargar datos de equipos desde la API
  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        setLoading(true)
        const data = await getEquipmentApi()
        setEquipment(data)
        setFilteredEquipment(data)
        setError(null)
      } catch (err) {
        console.error("Error fetching equipment:", err)
        setError("Failed to load equipment data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchEquipment()
  }, [])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value
    setSearchTerm(term)
    filterEquipment(term, statusFilter)
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
    filterEquipment(searchTerm, value)
  }

  const filterEquipment = (term: string, status: string) => {
    const filtered = equipment.filter(
      (item) =>
        (item.name.toLowerCase().includes(term.toLowerCase()) ||
          item.code.toLowerCase().includes(term.toLowerCase()) ||
          item.type.toLowerCase().includes(term.toLowerCase())) &&
        (status === "all" || item.status === status),
    )

    setFilteredEquipment(filtered)
  }

  const getStatusBadge = (status: EquipmentStatus) => {
    switch (status) {
      case EquipmentStatus.BUENO:
        return <Badge className="bg-green-500">Bueno</Badge>
      case EquipmentStatus.REGULAR:
        return <Badge className="bg-yellow-500">Regular</Badge>
      case EquipmentStatus.MALO:
        return <Badge className="bg-red-500">Malo</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const formatCalibrationDate = (date: Date | undefined) => {
    if (!date) return "No calibrado"
    return format(new Date(date), "dd MMM yyyy", { locale: es })
  }

  const getCalibrationStatus = (date: Date | undefined) => {
    if (!date) return { status: "none", text: "No calibrado" }

    const today = new Date()
    const calibrationDate = new Date(date)

    // If calibration date is in the past
    if (isBefore(calibrationDate, today)) {
      return {
        status: "overdue",
        text: "Calibración vencida",
        className: "text-red-600 font-medium",
      }
    }

    const daysUntilCalibration = differenceInDays(calibrationDate, today)

    if (daysUntilCalibration <= 2) {
      return {
        status: "critical",
        text: `En ${daysUntilCalibration} día${daysUntilCalibration === 1 ? "" : "s"}`,
        className: "text-red-600 font-bold",
        icon: <AlertCircle className="h-4 w-4 text-red-600 inline ml-1" />,
      }
    }

    if (daysUntilCalibration <= 7) {
      return {
        status: "warning",
        text: `En ${daysUntilCalibration} días`,
        className: "text-amber-600 font-medium",
        icon: <AlertTriangle className="h-4 w-4 text-amber-600 inline ml-1" />,
      }
    }

    return {
      status: "ok",
      text: formatCalibrationDate(date),
      className: "text-green-600",
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar equipos..."
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
                <SelectItem value={EquipmentStatus.BUENO}>Bueno</SelectItem>
                <SelectItem value={EquipmentStatus.REGULAR}>Regular</SelectItem>
                <SelectItem value={EquipmentStatus.MALO}>Malo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Badge variant="outline" className="text-xs">
            {filteredEquipment.length} equipos
          </Badge>
        </div>
        <Button asChild>
          <Link href="/equipment/new">
            <Plus className="mr-2 h-4 w-4" /> Agregar Equipo
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <span className="ml-2">Cargando equipos...</span>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">
              <p>{error}</p>
              <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                Reintentar
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden md:table-cell">Tipo</TableHead>
                  <TableHead className="hidden lg:table-cell">Descripción</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden md:table-cell">Calibrado</TableHead>
                  <TableHead className="hidden md:table-cell">Fecha Calibración</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEquipment.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No se encontraron equipos.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEquipment.map((item) => {
                    const calibrationStatus = getCalibrationStatus(item.calibrationDate)
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.code}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="hidden md:table-cell">{item.type}</TableCell>
                        <TableCell className="hidden lg:table-cell max-w-[300px] truncate">
                          {item.description}
                        </TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell className="hidden md:table-cell">{item.isCalibrated ? "Sí" : "No"}</TableCell>
                        <TableCell className={`hidden md:table-cell ${calibrationStatus.className}`}>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help">
                                  {calibrationStatus.text}
                                  {calibrationStatus.icon}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {calibrationStatus.status === "overdue"
                                  ? "La calibración de este equipo está vencida"
                                  : calibrationStatus.status === "critical"
                                    ? "¡Atención! Este equipo necesita calibración en menos de 2 días"
                                    : calibrationStatus.status === "warning"
                                      ? "Este equipo necesita calibración en menos de una semana"
                                      : calibrationStatus.status === "none"
                                        ? "Este equipo no requiere calibración"
                                        : "Fecha de próxima calibración"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/equipment/${item.id}`}>
                                  <EyeIcon className="mr-2 h-4 w-4" />
                                  <span>Ver</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/equipment/${item.id}/edit`}>
                                  <PencilIcon className="mr-2 h-4 w-4" />
                                  <span>Editar</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <TrashIcon className="mr-2 h-4 w-4" />
                                <span>Eliminar</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

