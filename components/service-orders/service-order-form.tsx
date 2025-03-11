"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useServiceOrderStore } from "@/lib/stores/useServiceOrderStore"
import { useClientStore } from "@/lib/stores/useClientStore"
import { useUserStore } from "@/lib/stores/useUserStore"
import { ServiceOrderStatus, Currency, type ServiceOrder, type ServiceOrderItem } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Plus, Trash } from "lucide-react"

const formSchema = z.object({
  number: z.string().min(1, { message: "El número de orden de servicio es requerido" }),
  clientId: z.string().min(1, { message: "Por favor seleccione un cliente" }),
  gestorId: z.string().min(1, { message: "Por favor seleccione un gestor" }),
  currency: z.nativeEnum(Currency),
  date: z.string().min(1, { message: "Por favor ingrese una fecha" }),
  description: z.string().optional(),
  paymentTerms: z.string().optional(),
  attendantName: z.string().optional(),
  status: z.nativeEnum(ServiceOrderStatus),
  comments: z.string().optional(),
})

const serviceItemSchema = z.object({
  code: z.string().min(1, "El código es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  quantity: z.number().min(1, "La cantidad debe ser al menos 1"),
  unitPrice: z.number().min(0, "El precio unitario no puede ser negativo"),
  days: z.number().min(1, "Los días deben ser al menos 1").optional(),
  name: z.string().min(1, "El nombre es requerido"),
})

type ServiceOrderFormValues = z.infer<typeof formSchema>

interface ServiceOrderFormProps {
  id?: string
  serviceOrder?: ServiceOrder
  onSubmit: (data: Omit<ServiceOrder, "id" | "createdAt" | "updatedAt">) => Promise<void>
}

const formatDateForInput = (date: Date | string | undefined): string => {
  if (!date) return ""
  const d = new Date(date)
  return d.toISOString().split("T")[0]
}

export function ServiceOrderForm({ id, serviceOrder, onSubmit }: ServiceOrderFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const { getNextServiceOrderNumber, getServiceOrder } = useServiceOrderStore()
  const { clients, fetchClients } = useClientStore()
  const { users, fetchUsers } = useUserStore()

  const [items, setItems] = useState<ServiceOrderItem[]>(serviceOrder?.items || [])
  const [totals, setTotals] = useState({ subtotal: 0, igv: 0, total: 0 })
  const [searchTerm, setSearchTerm] = useState("")
  const [services, setServices] = useState<any[]>([])
  const [newService, setNewService] = useState<Partial<ServiceOrderItem>>({})

  const form = useForm<ServiceOrderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      number: serviceOrder?.number || "",
      clientId: serviceOrder?.clientId || "",
      gestorId: serviceOrder?.gestorId || "",
      currency: serviceOrder?.currency || Currency.PEN,
      date: formatDateForInput(serviceOrder?.date) || "",
      description: serviceOrder?.description || "",
      paymentTerms: serviceOrder?.paymentTerms || "",
      attendantName: serviceOrder?.attendantName || "",
      status: serviceOrder?.status || ServiceOrderStatus.PENDING,
      comments: serviceOrder?.comments || "",
    },
  })

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        await Promise.all([fetchClients(), fetchUsers()])
        if (id) {
          const fetchedServiceOrder = await getServiceOrder(id)
          if (fetchedServiceOrder) {
            form.reset({
              number: fetchedServiceOrder.number,
              clientId: fetchedServiceOrder.clientId,
              gestorId: fetchedServiceOrder.gestorId,
              currency: fetchedServiceOrder.currency,
              date: formatDateForInput(fetchedServiceOrder.date),
              description: fetchedServiceOrder.description || "",
              paymentTerms: fetchedServiceOrder.paymentTerms || "",
              attendantName: fetchedServiceOrder.attendantName || "",
              status: fetchedServiceOrder.status,
              comments: fetchedServiceOrder.comments || "",
            })
            setItems(fetchedServiceOrder.items || [])
          }
        } else {
          const nextNumber = await getNextServiceOrderNumber()
          form.setValue("number", nextNumber)
        }

        // Fetch services
        const response = await fetch("/api/services")
        if (response.ok) {
          const data = await response.json()
          setServices(data)
        } else {
          console.error("Error al cargar servicios")
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id, fetchClients, fetchUsers, form, getNextServiceOrderNumber, getServiceOrder])

  useEffect(() => {
    const calculateTotals = () => {
      let subtotal = 0
      items.forEach((item) => {
        subtotal += item.quantity * item.unitPrice * (item.days || 1)
      })
      const igv = subtotal * 0.18
      const total = subtotal + igv
      setTotals({ subtotal, igv, total })
    }

    calculateTotals()
  }, [items])

  const onSubmitHandler = async (values: z.infer<typeof formSchema>) => {
    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos un servicio a la orden",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const serviceOrderData = {
        number: values.number,
        clientId: values.clientId,
        gestorId: values.gestorId,
        currency: values.currency,
        date: new Date(values.date),
        description: values.description,
        paymentTerms: values.paymentTerms,
        attendantName: values.attendantName,
        status: values.status,
        comments: values.comments,
        subtotal: totals.subtotal,
        igv: totals.igv,
        total: totals.total,
        items: items.map((item) => ({
          code: item.code,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          days: item.days,
          name: item.name || item.description,
        })),
      }

      await onSubmit(serviceOrderData as any)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      toast({
        title: "Error",
        description: `Ocurrió un error al guardar la orden de servicio: ${errorMessage}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddService = () => {
    if (!newService.name) {
      newService.name = newService.description
    }

    const result = serviceItemSchema.safeParse(newService)
    if (result.success) {
      setItems([...items, { ...result.data, id: `temp-${Date.now()}`, serviceOrderId: id || "temp" }])
      setNewService({})
    } else {
      toast({
        title: "Error",
        description: "Por favor, complete todos los campos del servicio correctamente.",
        variant: "destructive",
      })
    }
  }

  const handleRemoveService = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const filteredServices = services.filter(
    (service) =>
      service.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>{id ? "Editar Orden de Servicio" : "Crear Nueva Orden de Servicio"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitHandler)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Orden de Servicio</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gestorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gestor</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un gestor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moneda</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione una moneda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={Currency.PEN}>PEN (S/.)</SelectItem>
                        <SelectItem value={Currency.USD}>USD ($)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={ServiceOrderStatus.PENDING}>Pendiente</SelectItem>
                        <SelectItem value={ServiceOrderStatus.IN_PROGRESS}>En Progreso</SelectItem>
                        <SelectItem value={ServiceOrderStatus.COMPLETED}>Completada</SelectItem>
                        <SelectItem value={ServiceOrderStatus.CANCELLED}>Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Términos de Pago</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="attendantName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Técnico</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
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

            <Card>
              <CardHeader>
                <CardTitle>Servicios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Buscar servicio..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <ScrollArea className="h-[200px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead>Precio Unitario</TableHead>
                          <TableHead>Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredServices.map((service) => (
                          <TableRow key={service.id}>
                            <TableCell>{service.code}</TableCell>
                            <TableCell>{service.description}</TableCell>
                            <TableCell>{service.unitPrice}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setNewService({
                                    code: service.code,
                                    description: service.description,
                                    name: service.description,
                                    unitPrice: service.unitPrice,
                                    quantity: 1,
                                    days: 1,
                                  })
                                }
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                  <div className="grid grid-cols-6 gap-4">
                    <Input
                      placeholder="Código"
                      value={newService.code || ""}
                      onChange={(e) => setNewService({ ...newService, code: e.target.value })}
                    />
                    <Input
                      placeholder="Descripción"
                      value={newService.description || ""}
                      onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                    />
                    <Input
                      placeholder="Nombre"
                      value={newService.name || ""}
                      onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="Cantidad"
                      value={newService.quantity || ""}
                      onChange={(e) => setNewService({ ...newService, quantity: Number(e.target.value) })}
                    />
                    <Input
                      type="number"
                      placeholder="Precio Unitario"
                      value={newService.unitPrice || ""}
                      onChange={(e) => setNewService({ ...newService, unitPrice: Number(e.target.value) })}
                    />
                    <Input
                      type="number"
                      placeholder="Días"
                      value={newService.days || ""}
                      onChange={(e) => setNewService({ ...newService, days: Number(e.target.value) })}
                    />
                  </div>
                  <Button type="button" onClick={handleAddService}>
                    Agregar Servicio
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Servicios Seleccionados</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Precio Unitario</TableHead>
                      <TableHead>Días</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.code}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.unitPrice}</TableCell>
                        <TableCell>{item.days}</TableCell>
                        <TableCell>{(item.quantity * item.unitPrice * (item.days || 1)).toFixed(2)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveService(index)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 flex justify-end space-x-2">
                  <div>Subtotal: {totals.subtotal.toFixed(2)}</div>
                  <div>IGV: {totals.igv.toFixed(2)}</div>
                  <div>Total: {totals.total.toFixed(2)}</div>
                </div>
              </CardContent>
            </Card>

            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comentarios</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => router.push("/service-orders")} type="button">
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Guardando..." : id ? "Actualizar Orden de Servicio" : "Crear Orden de Servicio"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

