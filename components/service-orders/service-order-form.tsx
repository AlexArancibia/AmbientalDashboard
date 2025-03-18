"use client"

import type React from "react"

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
import { ServiceOrderStatus, Currency, type ServiceOrder, type ServiceOrderItem, CompanyType } from "@/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Plus, Trash, X, Loader2, Save } from "lucide-react"

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
          const defaultComment = `ORDEN DE SERVICIO N°${nextNumber} - MONITOREO AMBIENTALPE
      
ENTREGA DE DOCUMENTOS:
- Orden de Servicio (Copia de la orden firmada)
- Informe técnico de los trabajos realizados
- Certificados de calibración de equipos utilizados
- Consulta de Validez del Comprobante de Pago

FACTURACIÓN: AMBIENTALPE S.A.C. / R.U.C. 20603040121 / DIRECCIÓN: Av. Benavides 1944, Oficina 1501, Miraflores, Lima

RECEPCIÓN DE FACTURAS: Lunes a Viernes de 9:00 a.m. a 5:00 p.m.

LUGAR DE PRESTACIÓN DEL SERVICIO: Según lo coordinado con el cliente

INFORMACIÓN ADICIONAL:
- Los informes deberán ser entregados en formato digital e impreso
- Los resultados de monitoreo deben incluir comparación con los Estándares de Calidad Ambiental vigentes
- Todos los equipos utilizados deben contar con certificados de calibración vigentes`

          form.setValue("comments", defaultComment)
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

  const handleAddService = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
    }

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

  const handleRemoveService = (index: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
    }
    setItems(items.filter((_, i) => i !== index))
  }

  const filteredServices = services.filter(
    (service) =>
      service.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatCurrency = (amount: number) => {
    const currency = form.getValues("currency")
    const symbol = currency === Currency.PEN ? "S/. " : "$ "
    return symbol + amount.toFixed(2)
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      <Card className="border-border shadow-md">
        <CardHeader className="bg-gradient-to-r from-background to-muted/50 border-b border-border">
          <CardTitle className="text-xl font-semibold">
            {id ? "Editar Orden de Servicio" : "Crear Nueva Orden de Servicio"}
          </CardTitle>
          <CardDescription>
            {id
              ? "Actualice los detalles de la orden de servicio"
              : "Complete los detalles para crear una nueva orden de servicio"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitHandler)} className="space-y-8">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 bg-muted/30 rounded-lg">
                  <FormField
                    control={form.control}
                    name="number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Número de Orden</FormLabel>
                        <FormControl>
                          <Input {...field} className="border-input" />
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
                        <FormLabel className="font-medium">Cliente</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}  >
                          <FormControl>
                            <SelectTrigger className="border-input">
                              <SelectValue placeholder="Seleccione un cliente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients
                              .filter((client) => client.type === CompanyType.CLIENT)
                              .map((client) => (
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
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Moneda</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-input">
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
                        <FormLabel className="font-medium">Fecha</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="border-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gestorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Gestor</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-input">
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
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Estado</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-input">
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
                        <FormLabel className="font-medium">Términos de Pago</FormLabel>
                        <FormControl>
                          <Input {...field} className="border-input" />
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
                        <FormLabel className="font-medium">Técnico Asignado</FormLabel>
                        <FormControl>
                          <Input {...field} className="border-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Descripción</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ""}
                          className="min-h-[120px] border-input"
                          placeholder="Ingrese una descripción para esta orden de servicio..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Servicios</CardTitle>
                    <CardDescription>Busque y agregue servicios a la orden</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Search and add services */}
                    <div className="space-y-4 border p-4 rounded-md">
                      <div className="flex items-center space-x-2">
                        <Search className="h-4 w-4" />
                        <Input
                          type="text"
                          placeholder="Buscar servicio..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <ScrollArea className="h-[200px] border rounded-md">
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
                            {filteredServices.length > 0 ? (
                              filteredServices.map((service) => (
                                <TableRow key={service.id} className="hover:bg-muted/50 transition-colors">
                                  <TableCell>{service.code}</TableCell>
                                  <TableCell>{service.description}</TableCell>
                                  <TableCell>{formatCurrency(service.unitPrice)}</TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      type="button"
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
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                                  No se encontraron servicios
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </ScrollArea>

                      <div className="space-y-4">
                        <h4 className="font-medium">Agregar Servicio Manualmente</h4>
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
                        <Button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            handleAddService()
                          }}
                          className="w-full"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Agregar Servicio
                        </Button>
                      </div>
                    </div>

                    {/* Selected services */}
                    <div className="border p-4 rounded-md">
                      <h3 className="text-lg font-medium mb-4">Servicios Seleccionados ({items.length})</h3>
                      {items.length > 0 ? (
                        <>
                          <div className="rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
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
                                  <TableRow key={item.id || index} className="border-b border-border/40">
                                    <TableCell>{item.code}</TableCell>
                                    <TableCell>{item.description}</TableCell>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                                    <TableCell>{item.days || 1}</TableCell>
                                    <TableCell>
                                      {formatCurrency(item.quantity * item.unitPrice * (item.days || 1))}
                                    </TableCell>
                                    <TableCell>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          handleRemoveService(index)
                                        }}
                                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                          <div className="mt-4 flex justify-end space-x-4">
                            <div className="text-sm">
                              Subtotal: <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                            </div>
                            <div className="text-sm">
                              IGV (18%): <span className="font-medium">{formatCurrency(totals.igv)}</span>
                            </div>
                            <div className="text-sm font-bold">
                              Total: <span>{formatCurrency(totals.total)}</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No hay servicios seleccionados. Agregue servicios desde la sección superior.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Comentarios</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="min-h-[150px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-3 pt-6">
                <Button variant="outline" onClick={() => router.push("/service-orders")} type="button" className="px-5">
                  <X className="mr-2 h-4 w-4" /> Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-5"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {id ? "Actualizando..." : "Creando..."}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {id ? "Actualizar Orden" : "Crear Orden"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

