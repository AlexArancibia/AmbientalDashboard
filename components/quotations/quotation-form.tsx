"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Currency, QuotationStatus, type Quotation, type QuotationItem } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { useQuotationStore } from "@/lib/stores/useQuotationStore"
import { useClientStore } from "@/lib/stores/useClientStore"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Plus, X } from "lucide-react"

const formSchema = z.object({
  number: z.string().min(1, { message: "El número de cotización es requerido" }),
  clientId: z.string().min(1, { message: "Por favor seleccione un cliente" }),
  currency: z.nativeEnum(Currency),
  equipmentReleaseDate: z.string().min(1, { message: "Por favor ingrese una fecha de entrega" }),
  validityDays: z.number().min(1, { message: "La validez debe ser de al menos 1 día" }),
  status: z.nativeEnum(QuotationStatus),
  notes: z.string().optional(),
  considerDays: z.number().min(1, "Los días considerados deben ser al menos 1").optional(),
  returnDate: z.string().optional(),
  monitoringLocation: z.string().optional(), // Ahora en quotation
  creditLine: z.number().optional(), // Nuevo campo
  selectedService: z.string().optional(),
  quantity: z.number().min(1, "La cantidad debe ser al menos 1"),
  days: z.number().min(1, "Los días deben ser al menos 1"),
  unitPrice: z.number().min(0, "El precio unitario no puede ser negativo"),
  // Campos para crear un nuevo servicio
  newServiceCode: z.string().optional(),
  newServiceDescription: z.string().optional(),
  newServiceName: z.string().optional(),
})

interface QuotationFormProps {
  quotation?: Quotation
}

export function QuotationForm({ quotation }: QuotationFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const { updateQuotation, createQuotation, getNextQuotationNumber } = useQuotationStore()
  const { clients, fetchClients } = useClientStore()

  const [items, setItems] = useState<QuotationItem[]>(quotation?.items || [])
  const [totals, setTotals] = useState({ subtotal: 0, igv: 0, total: 0 })
  const [searchTerm, setSearchTerm] = useState("")
  const [services, setServices] = useState<any[]>([])
  const [showNewServiceForm, setShowNewServiceForm] = useState(false)

  // Format date for the form input if it exists
  const formatDateForInput = (date: Date | string | undefined) => {
    if (!date) return ""
    const d = new Date(date)
    return d.toISOString().split("T")[0]
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      number: quotation?.number || "",
      clientId: quotation?.clientId || "",
      currency: (quotation?.currency as Currency) || Currency.PEN,
      equipmentReleaseDate: formatDateForInput(quotation?.equipmentReleaseDate) || "",
      validityDays: quotation?.validityDays || 15,
      status: (quotation?.status as QuotationStatus) || QuotationStatus.DRAFT,
      notes: quotation?.notes || "",
      considerDays: quotation?.considerDays || 1,
      returnDate: formatDateForInput(quotation?.returnDate) || "",
      monitoringLocation: quotation?.monitoringLocation || "", // Ahora desde quotation
      creditLine: quotation?.creditLine || 0, // Nuevo campo
      selectedService: "",
      quantity: 1,
      days: 1,
      unitPrice: 0,
      newServiceCode: "",
      newServiceDescription: "",
      newServiceName: "",
    },
  })

  useEffect(() => {
    const fetchData = async () => {
      await fetchClients()

      // Cargar servicios
      try {
        const response = await fetch("/api/services")
        if (response.ok) {
          const data = await response.json()
          setServices(data)
        } else {
          console.error("Error al cargar servicios")
        }
      } catch (error) {
        console.error("Error al cargar servicios:", error)
      }

      if (!quotation) {
        const nextNumber = await getNextQuotationNumber()
        form.setValue("number", nextNumber)
      }
    }

    fetchData()
  }, [fetchClients, getNextQuotationNumber, quotation, form])

  // Calculate totals whenever items change
  useEffect(() => {
    const subtotal = items.reduce((acc, item) => acc + item.quantity * item.days * item.unitPrice, 0)
    const igv = subtotal * 0.18
    const total = subtotal + igv
    setTotals({ subtotal, igv, total })
  }, [items])

  // Filter services based on search term
  const filteredServices = services.filter(
    (service) =>
      service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.name && service.name.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const addServiceItem = (serviceId: string) => {
    const selectedService = services.find((s) => s.id === serviceId)
    if (!selectedService) return

    const { quantity, days, unitPrice } = form.getValues()

    setItems([
      ...items,
      {
        id: `temp-${Date.now()}`,
        quotationId: quotation?.id || "temp",
        description: selectedService.description,
        code: selectedService.code,
        name: selectedService.name,
        quantity,
        days,
        unitPrice: unitPrice || selectedService.unitPrice,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])

    // Reset form fields
    form.setValue("quantity", 1)
    form.setValue("days", 1)
    form.setValue("unitPrice", 0)
    form.setValue("selectedService", "")
  }

  const addNewService = async () => {
    const { newServiceCode, newServiceDescription, newServiceName, unitPrice, quantity, days } = form.getValues()

    if (!newServiceCode || !newServiceDescription || !newServiceName || !unitPrice) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos del nuevo servicio",
        variant: "destructive",
      })
      return
    }

    try {
      // Crear el nuevo servicio en la API
      const response = await fetch("/api/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: newServiceCode,
          description: newServiceDescription,
          name: newServiceName,
          unitPrice,
          quantity,
          days,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al crear el servicio")
      }

      const newService = await response.json()

      // Agregar el servicio a la lista local
      setServices([newService, ...services])

      // Agregar el servicio a los items de la cotización
      setItems([
        ...items,
        {
          id: `temp-${Date.now()}`,
          quotationId: quotation?.id || "temp",
          description: newServiceDescription,
          code: newServiceCode,
          name: newServiceName,
          quantity: quantity || 1,
          days: days || 1,
          unitPrice,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ])

      // Limpiar el formulario
      form.setValue("newServiceCode", "")
      form.setValue("newServiceDescription", "")
      form.setValue("newServiceName", "")
      form.setValue("unitPrice", 0)
      setShowNewServiceForm(false)

      toast({
        title: "Servicio creado",
        description: "El servicio ha sido creado y agregado a la cotización",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al crear el servicio",
        variant: "destructive",
      })
    }
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleServiceSelection = (serviceId: string) => {
    const selectedService = services.find((s) => s.id === serviceId)
    if (selectedService) {
      form.setValue("selectedService", serviceId)
      form.setValue("unitPrice", selectedService.unitPrice)
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos un servicio a la cotización",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Preparar datos de la cotización
      const quotationData = {
        number: values.number,
        clientId: values.clientId,
        currency: values.currency,
        equipmentReleaseDate: new Date(values.equipmentReleaseDate),
        validityDays: values.validityDays,
        status: values.status,
        notes: values.notes,
        considerDays: values.considerDays,
        returnDate: values.returnDate ? new Date(values.returnDate) : undefined,
        monitoringLocation: values.monitoringLocation, // Ahora desde quotation
        creditLine: values.creditLine, // Nuevo campo
        subtotal: totals.subtotal,
        igv: totals.igv,
        total: totals.total,
        items: items.map((item) => ({
          description: item.description,
          code: item.code,
          name: item.name,
          quantity: item.quantity,
          days: item.days,
          unitPrice: item.unitPrice,
        })),
      }

      if (quotation?.id) {
        // Actualizar cotización existente
        const result = await updateQuotation(quotation.id, quotationData as any)
        if (result) {
          toast({
            title: "Cotización actualizada",
            description: "La cotización ha sido actualizada exitosamente.",
          })
          // Navegar de vuelta a la lista de cotizaciones
          router.push("/quotations")
        }
      } else {
        // Crear nueva cotización
        const result = await createQuotation(quotationData as any)
        if (result) {
          toast({
            title: "Cotización creada",
            description: "La cotización ha sido creada exitosamente.",
          })
          // Navegar de vuelta a la lista de cotizaciones
          router.push("/quotations")
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      toast({
        title: "Error",
        description: `Ocurrió un error al guardar la cotización: ${errorMessage}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    const currency = form.watch("currency")
    const symbol = currency === Currency.PEN ? "S/. " : "$ "
    return symbol + amount.toFixed(2)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{quotation?.id ? "Editar Cotización" : "Crear Nueva Cotización"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Cotización</FormLabel>
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
                name="equipmentReleaseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Entrega</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="validityDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Validez (días)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        value={field.value}
                      />
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
                        <SelectItem value={QuotationStatus.DRAFT}>Borrador</SelectItem>
                        <SelectItem value={QuotationStatus.SENT}>Enviada</SelectItem>
                        <SelectItem value={QuotationStatus.ACCEPTED}>Aceptada</SelectItem>
                        <SelectItem value={QuotationStatus.REJECTED}>Rechazada</SelectItem>
                        <SelectItem value={QuotationStatus.EXPIRED}>Expirada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Campos añadidos para considerDays y returnDate */}
              <FormField
                control={form.control}
                name="considerDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Días Considerados</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="returnDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Retorno</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Nuevos campos: monitoringLocation y creditLine */}
              <FormField
                control={form.control}
                name="monitoringLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lugar de Monitoreo</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="creditLine"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Línea de Crédito</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        value={field.value || 0}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* New Services Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Servicios</h3>
              <Tabs defaultValue="existing" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="existing">Servicios Existentes</TabsTrigger>
                  <TabsTrigger value="new">Nuevo Servicio</TabsTrigger>
                </TabsList>
                <TabsContent value="existing" className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Search className="w-4 h-4 text-gray-500" />
                    <Input
                      type="search"
                      placeholder="Buscar servicio..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-grow"
                    />
                  </div>
                  <ScrollArea className="h-72 w-full rounded-md border">
                    <div className="p-4 space-y-2">
                      {filteredServices.map((service) => (
                        <div
                          key={service.id}
                          className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{service.name}</p>
                            <p className="text-sm text-gray-500">
                              {service.code} - {service.description}
                            </p>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Plus className="w-4 h-4 mr-1" /> Agregar
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Agregar Servicio</DialogTitle>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <FormField
                                  control={form.control}
                                  name="quantity"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Cantidad</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min="1"
                                          {...field}
                                          onChange={(e) => field.onChange(Number(e.target.value))}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="days"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Días</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min="1"
                                          {...field}
                                          onChange={(e) => field.onChange(Number(e.target.value))}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="unitPrice"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Precio Unitario</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          {...field}
                                          onChange={(e) => field.onChange(Number(e.target.value))}
                                          value={field.value || service.unitPrice}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <Button onClick={() => addServiceItem(service.id)}>Agregar a la Cotización</Button>
                            </DialogContent>
                          </Dialog>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="new" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="newServiceCode"
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
                      name="newServiceName"
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
                  </div>
                  <FormField
                    control={form.control}
                    name="newServiceDescription"
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
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cantidad</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="days"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Días</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="unitPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Precio Unitario</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="button" onClick={addNewService}>
                    Crear y Agregar Servicio
                  </Button>
                </TabsContent>
              </Tabs>
            </div>

            {/* Selected Services Section */}
            {items.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Servicios Seleccionados</h3>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Código
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Descripción
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Cantidad
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Días
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Precio Unitario
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Total
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Acciones</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {items.map((item, index) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.code}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.description}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.days}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(item.quantity * item.days * item.unitPrice)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button variant="ghost" size="sm" onClick={() => removeItem(index)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end space-x-4 text-sm">
                  <div>
                    Subtotal: <span className="font-semibold">{formatCurrency(totals.subtotal)}</span>
                  </div>
                  <div>
                    IGV (18%): <span className="font-semibold">{formatCurrency(totals.igv)}</span>
                  </div>
                  <div>
                    Total: <span className="font-semibold">{formatCurrency(totals.total)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => router.push("/quotations")} type="button">
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Guardando..." : quotation?.id ? "Actualizar Cotización" : "Crear Cotización"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

