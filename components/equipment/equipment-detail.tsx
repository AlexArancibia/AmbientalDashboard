"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type Equipment, EquipmentStatus } from "@/types"
import Link from "next/link"
import {
  ArrowLeft,
  Calendar,
  Edit,
  History,
  PenToolIcon as Tool,
  Tag,
  FileText,
  Info,
  CheckCircle,
  AlertCircle,
  Package,
  Clock,
  Clipboard,
  BarChart4,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface EquipmentDetailProps {
  equipment: Equipment
}

export function EquipmentDetail({ equipment }: EquipmentDetailProps) {
  // Format date for display
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "No disponible"
    const d = new Date(date)
    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  // Get status badge with icon and color
  const getStatusBadge = (status: EquipmentStatus) => {
    switch (status) {
      case EquipmentStatus.BUENO:
        return (
          <Badge className="bg-green-500 hover:bg-green-600 px-3 py-1">
            <CheckCircle className="mr-1 h-3 w-3" />
            Bueno
          </Badge>
        )
      case EquipmentStatus.REGULAR:
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600 px-3 py-1">
            <AlertCircle className="mr-1 h-3 w-3" />
            Regular
          </Badge>
        )
      case EquipmentStatus.MALO:
        return (
          <Badge className="bg-red-500 hover:bg-red-600 px-3 py-1">
            <AlertCircle className="mr-1 h-3 w-3" />
            Malo
          </Badge>
        )
      default:
        return (
          <Badge className="px-3 py-1">
            <Info className="mr-1 h-3 w-3" />
            Desconocido
          </Badge>
        )
    }
  }

  // Safely access components
  const hasComponents = equipment.components && Object.keys(equipment.components).length > 0

  return (
    <div className="space-y-8">
      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" asChild>
          <Link href="/equipment">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Equipos
          </Link>
        </Button>
        <Button asChild>
          <Link href={`/equipment/${equipment.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Editar Equipo
          </Link>
        </Button>
      </div>

      {/* Main Information */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Basic Information */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-xl">
              <Info className="mr-2 h-5 w-5 text-primary" />
              Información General
            </CardTitle>
            <CardDescription>Detalles básicos del equipo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                <p className="text-lg font-semibold">{equipment.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Código</p>
                <p className="text-lg font-semibold">{equipment.code}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                <p className="text-lg">{equipment.type}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Estado</p>
                <div className="mt-1">{getStatusBadge(equipment.status)}</div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Número de Serie</p>
                <p className="text-lg">{equipment.serialNumber || "No disponible"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Fecha de Creación</p>
                <p className="text-lg">{formatDate(equipment.createdAt)}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Descripción</p>
              <p className="text-base">{equipment.description}</p>
            </div>

            {equipment.observations && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Observaciones</p>
                <p className="text-base">{equipment.observations}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calibration Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-xl">
              <Tool className="mr-2 h-5 w-5 text-primary" />
              Calibración
            </CardTitle>
            <CardDescription>Información de calibración</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Estado</p>
              <p className="text-lg font-semibold">
                {equipment.isCalibrated ? (
                  <span className="flex items-center text-green-600">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Calibrado
                  </span>
                ) : (
                  <span className="flex items-center text-yellow-600">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    No Calibrado
                  </span>
                )}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Fecha de Calibración</p>
              <p className="text-lg">{formatDate(equipment.calibrationDate)}</p>
            </div>
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground">
            <Clock className="mr-2 h-4 w-4" />
            Última actualización: {formatDate(equipment.updatedAt)}
          </CardFooter>
        </Card>
      </div>

      {/* Components */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-xl">
            <Package className="mr-2 h-5 w-5 text-primary" />
            Componentes
          </CardTitle>
          <CardDescription>Partes y accesorios incluidos con este equipo</CardDescription>
        </CardHeader>
        <CardContent>
          {hasComponents ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(equipment.components!).map(([key, value]) => (
                <div key={key} className="flex items-start p-3 border rounded-md">
                  <Tag className="h-5 w-5 mr-3 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</p>
                    <p className="text-muted-foreground">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay componentes registrados para este equipo.</p>
            </div>
          )}
        </CardContent>
      </Card>

   
    </div>
  )
}

