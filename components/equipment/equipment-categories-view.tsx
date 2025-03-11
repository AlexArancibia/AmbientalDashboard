"use client"
import { equipment } from "@/lib/data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { EquipmentStatus } from "@/types"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function EquipmentCategoriesView() {
  // Agrupar equipos por nombre
  const equipmentByName = equipment.reduce(
    (acc, item) => {
      if (!acc[item.name]) {
        acc[item.name] = []
      }
      acc[item.name].push(item)
      return acc
    },
    {} as Record<string, typeof equipment>,
  )

  // Obtener tipos de equipo únicos
  const equipmentTypes = [...new Set(equipment.map((item) => item.type))]

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

  return (
    <Tabs defaultValue="all" className="space-y-4">
      <TabsList className="flex flex-wrap">
        <TabsTrigger value="all">Todas las Categorías</TabsTrigger>
        {equipmentTypes.map((type) => (
          <TabsTrigger key={type} value={type}>
            {type}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="all" className="space-y-4">
        {Object.entries(equipmentByName).map(([name, items]) => (
          <Card key={name} className="overflow-hidden">
            <CardHeader className="bg-muted">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{name}</CardTitle>
                <Badge variant="outline">{items.length} unidades</Badge>
              </div>
              <CardDescription>{items[0].type}</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <Card key={item.id} className="flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{item.code}</CardTitle>
                      {getStatusBadge(item.status)}
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                      {item.observations && (
                        <p className="mt-2 text-xs text-muted-foreground italic">{item.observations}</p>
                      )}
                    </CardContent>
                    <CardContent className="mt-auto pt-0">
                      <Button variant="outline" size="sm" asChild className="w-full">
                        <Link href={`/equipment/${item.id}`}>
                          Ver Detalles <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </TabsContent>

      {equipmentTypes.map((type) => (
        <TabsContent key={type} value={type} className="space-y-4">
          {Object.entries(equipmentByName)
            .filter(([_, items]) => items[0].type === type)
            .map(([name, items]) => (
              <Card key={name} className="overflow-hidden">
                <CardHeader className="bg-muted">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{name}</CardTitle>
                    <Badge variant="outline">{items.length} unidades</Badge>
                  </div>
                  <CardDescription>{items[0].type}</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((item) => (
                      <Card key={item.id} className="flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">{item.code}</CardTitle>
                          {getStatusBadge(item.status)}
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                          {item.observations && (
                            <p className="mt-2 text-xs text-muted-foreground italic">{item.observations}</p>
                          )}
                        </CardContent>
                        <CardContent className="mt-auto pt-0">
                          <Button variant="outline" size="sm" asChild className="w-full">
                            <Link href={`/equipment/${item.id}`}>
                              Ver Detalles <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>
      ))}
    </Tabs>
  )
}

