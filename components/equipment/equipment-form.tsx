"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { type EquipmentComponents, EquipmentStatus } from "@/types"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { useEquipmentStore } from "@/lib/stores/useEquipmentStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Plus } from "lucide-react"

const formSchema = z.object({
  name: z.string().min(1, { message: "El nombre es requerido" }),
  type: z.string().min(1, { message: "El tipo es requerido" }),
  code: z.string().min(1, { message: "El código es requerido" }),
  description: z.string().min(1, { message: "La descripción es requerida" }),
  status: z.nativeEnum(EquipmentStatus),
  serialNumber: z.string().optional(),
  isCalibrated: z.boolean().optional(),
  calibrationDate: z.string().optional(),
  observations: z.string().optional(),
})

type EquipmentFormProps = {
  equipment?: any // Using any temporarily to avoid type issues
}

export function EquipmentForm({ equipment }: EquipmentFormProps = {}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const { createEquipment, updateEquipment } = useEquipmentStore()

  // State for components
  const [components, setComponents] = useState<EquipmentComponents>(equipment?.components || {})
  const [newComponentKey, setNewComponentKey] = useState("")
  const [newComponentValue, setNewComponentValue] = useState("")

  // Format date for the form input if it exists
  const formatDateForInput = (date: Date | string | undefined) => {
    if (!date) return ""
    const d = new Date(date)
    return d.toISOString().split("T")[0]
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: equipment?.name || "",
      type: equipment?.type || "",
      code: equipment?.code || "",
      description: equipment?.description || "",
      status: equipment?.status || EquipmentStatus.BUENO,
      serialNumber: equipment?.serialNumber || "",
      isCalibrated: equipment?.isCalibrated || false,
      calibrationDate: formatDateForInput(equipment?.calibrationDate),
      observations: equipment?.observations || "",
    },
  })

  // Add a new component
  const addComponent = () => {
    if (newComponentKey.trim() === "") {
      toast({
        title: "Error",
        description: "El nombre del componente no puede estar vacío",
        variant: "destructive",
      })
      return
    }

    setComponents({
      ...components,
      [newComponentKey]: newComponentValue,
    })
    setNewComponentKey("")
    setNewComponentValue("")
  }

  // Remove a component
  const removeComponent = (key: string) => {
    const updatedComponents = { ...components }
    delete updatedComponents[key]
    setComponents(updatedComponents)
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      // Prepare data with proper date conversion
      const equipmentData = {
        ...values,
        components,
        // Convert calibrationDate string to Date if provided
        calibrationDate: values.calibrationDate ? new Date(values.calibrationDate) : undefined,
      }

      if (equipment?.id) {
        // Update existing equipment
        await updateEquipment(equipment.id, equipmentData)
        toast({
          title: "Equipo actualizado",
          description: "El equipo ha sido actualizado exitosamente.",
        })
      } else {
        // Create new equipment
        await createEquipment(equipmentData)
        toast({
          title: "Equipo creado",
          description: "El equipo ha sido creado exitosamente.",
        })
      }

      // Navigate back to equipment list
      router.push("/equipment")
      router.refresh()
    } catch (error) {
      console.error("Error saving equipment:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar el equipo. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{equipment?.id ? "Editar Equipo" : "Crear Nuevo Equipo"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={EquipmentStatus.BUENO}>Bueno</SelectItem>
                        <SelectItem value={EquipmentStatus.REGULAR}>Regular</SelectItem>
                        <SelectItem value={EquipmentStatus.MALO}>Malo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Components Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <FormLabel className="text-base">Componentes</FormLabel>
              </div>

              {/* List of existing components */}
              {Object.keys(components).length > 0 && (
                <div className="space-y-2">
                  {Object.entries(components).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Input value={key} disabled className="flex-1" />
                      <Input
                        value={value}
                        onChange={(e) => {
                          const updatedComponents = { ...components }
                          updatedComponents[key] = e.target.value
                          setComponents(updatedComponents)
                        }}
                        className="flex-1"
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeComponent(key)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new component */}
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Nombre del componente"
                  value={newComponentKey}
                  onChange={(e) => setNewComponentKey(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Valor"
                  value={newComponentValue}
                  onChange={(e) => setNewComponentValue(e.target.value)}
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="icon" onClick={addComponent}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="serialNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Serie</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="calibrationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Calibración</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isCalibrated"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Equipo Calibrado</FormLabel>
                    <p className="text-sm text-muted-foreground">Marque esta casilla si el equipo está calibrado</p>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => router.push("/equipment")} type="button">
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Guardando..." : equipment?.id ? "Actualizar Equipo" : "Crear Equipo"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

