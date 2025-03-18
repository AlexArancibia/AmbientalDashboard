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
import { Currency, QuotationStatus, type Quotation, type QuotationItem, CompanyType } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { useQuotationStore } from "@/lib/stores/useQuotationStore"
import { useClientStore } from "@/lib/stores/useClientStore"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Plus, X } from "lucide-react"
import { Clipboard, Database, FileEdit, FileText, Loader2, Package, PlusCircle, Save, ShoppingCart } from "lucide-react"
import { NewClientForm } from "@/components/clients/new-client-form"

const DEFAULT_NOTES = `Una vez aceptada la cotización envienos su confirmación por vía mail,
para iniciar con las coordinaciones del presente servicio. E-mail:
ventas@ambientalpe.com N.CUENTA. BBVA SOLES:
0011039694020045050 CCI:01139600020045050694 (B.NACIÓN) CTA.
DE DETRACCIÓN : 00591113992 Nº DE CCI: 018591000591113992`

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
  const [filteredClients, setFilteredClients] = useState(clients)
  const [localClients, setLocalClients] = useState(clients)
  const [open, setOpen] = useState(false)

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
      notes: quotation?.notes || DEFAULT_NOTES,
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

  useEffect(() => {
    const filtered = clients.filter(
      (client) =>
        client.type === CompanyType.CLIENT &&
        (client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.ruc.includes(searchTerm) ||
          client.email.toLowerCase().includes(searchTerm.toLowerCase())),
    )
    setFilteredClients(filtered)
  }, [clients, searchTerm])

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

  const handleClientCreated = (newClient: any) => {
    // Add the new client to the list and select it
    setLocalClients([...localClients, newClient])
    setFilteredClients([...filteredClients, newClient])
    form.setValue("clientId", newClient.id)
    toast({
      title: "Cliente creado",
      description: `El cliente ${newClient.name} ha sido creado exitosamente.`,
    })
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      <Card className="border-border shadow-md">
        <CardHeader className="bg-gradient-to-r from-background to-muted/50 border-b border-border">
          <CardTitle className="text-xl font-semibold flex items-center">
            {quotation?.id ? (
              <>
                <FileEdit className="mr-2 h-5 w-5 text-primary" />
                Editar Cotización
              </>
            ) : (
              <>
                <FileText className="mr-2 h-5 w-5 text-primary" />
                Crear Nueva Cotización
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-6">
                <div className="flex items-center space-x-2 mb-2">
                  <Clipboard className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium">Información General</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 bg-muted/30 rounded-lg">
                  <FormField
                    control={form.control}
                    name="number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Número de Cotización</FormLabel>
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
                        <div className="flex items-center space-x-2">
                          <Select onValueChange={field.onChange} value={field.value}  >
                            <FormControl>
                              <SelectTrigger className="border-input">
                                <SelectValue placeholder="Seleccione un cliente" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {filteredClients.map((client) => (
                                <SelectItem key={client.id} value={client.id}>
                                  {client.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                              <Button type="button" variant="outline" size="sm">
                                <Plus className="h-4 w-4 mr-1" /> Nuevo
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader>
                                <DialogTitle>Crear Nuevo Cliente</DialogTitle>
                                <DialogDescription>
                                  Complete el formulario para crear un nuevo cliente.
                                </DialogDescription>
                              </DialogHeader>
                              <NewClientForm
                                onClientCreated={handleClientCreated}
                                defaultType={CompanyType.CLIENT}
                                onClose={() => setOpen(false)}
                              />
                            </DialogContent>
                          </Dialog>
                        </div>
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
                    name="equipmentReleaseDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Fecha de Entrega</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="border-input" />
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
                        <FormLabel className="font-medium">Validez (días)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            value={field.value}
                            className="border-input"
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
                        <FormLabel className="font-medium">Estado</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-input">
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
                  <FormField
                    control={form.control}
                    name="considerDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Días Considerados</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            value={field.value}
                            className="border-input"
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
                        <FormLabel className="font-medium">Fecha de Retorno</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="border-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="monitoringLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Lugar de Monitoreo</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} className="border-input" />
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
                        <FormLabel className="font-medium">Línea de Crédito</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            value={field.value || 0}
                            className="border-input"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium">Notas Adicionales</h3>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Notas</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value || ""}
                            className="min-h-[120px] border-input"
                            placeholder="Ingrese notas o condiciones adicionales para esta cotización..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center space-x-2 mb-2">
                  <Package className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium">Servicios</h3>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                  <Tabs defaultValue="existing" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="existing" className="text-sm data-[state=active]:bg-primary/10">
                        <Database className="w-4 h-4 mr-2" />
                        Servicios Existentes
                      </TabsTrigger>
                      <TabsTrigger value="new" className="text-sm data-[state=active]:bg-primary/10">
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Nuevo Servicio
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="existing" className="space-y-4 pt-2">
                      <div className="flex items-center space-x-2 bg-background rounded-md border border-input px-3 py-2">
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <Input
                          type="search"
                          placeholder="Buscar servicio por nombre o código..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="flex-grow border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      </div>
                      <ScrollArea className="h-72 w-full rounded-md border border-input bg-background">
                        <div className="p-4 space-y-2">
                          {filteredServices.length > 0 ? (
                            filteredServices.map((service) => (
                              <div
                                key={service.id}
                                className="flex items-center justify-between p-3 hover:bg-muted rounded-lg border border-border/40 transition-colors"
                              >
                                <div>
                                  <p className="font-medium text-foreground">{service.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    <span className="inline-block bg-muted text-muted-foreground rounded px-1 mr-2">
                                      {service.code}
                                    </span>
                                    {service.description}
                                  </p>
                                </div>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="ml-2">
                                      <Plus className="w-4 h-4 mr-1" /> Agregar
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle className="flex items-center">
                                        <Package className="mr-2 h-5 w-5 text-primary" />
                                        Agregar Servicio
                                      </DialogTitle>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                      <div className="bg-muted/30 p-3 rounded-md mb-2">
                                        <h4 className="font-medium text-foreground">{service.name}</h4>
                                        <p className="text-sm text-muted-foreground">
                                          {service.code} - {service.description}
                                        </p>
                                      </div>
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
                                                className="border-input"
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
                                                className="border-input"
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
                                                className="border-input"
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                    </div>
                                    <Button onClick={() => addServiceItem(service.id)} className="w-full">
                                      <Plus className="w-4 h-4 mr-2" /> Agregar a la Cotización
                                    </Button>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            ))
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                              <Search className="h-10 w-10 text-muted-foreground mb-2" />
                              <p className="text-muted-foreground">No se encontraron servicios</p>
                              <p className="text-sm text-muted-foreground">Intente con otro término de búsqueda</p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                    <TabsContent
                      value="new"
                      className="space-y-4 pt-2 bg-background rounded-md p-4 border border-input"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="newServiceCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-medium">Código</FormLabel>
                              <FormControl>
                                <Input {...field} className="border-input" placeholder="Ej: SRV-001" />
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
                              <FormLabel className="font-medium">Nombre</FormLabel>
                              <FormControl>
                                <Input {...field} className="border-input" placeholder="Nombre del servicio" />
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
                            <FormLabel className="font-medium">Descripción</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                className="border-input"
                                placeholder="Descripción detallada del servicio"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="quantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-medium">Cantidad</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                  className="border-input"
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
                              <FormLabel className="font-medium">Días</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                  className="border-input"
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
                              <FormLabel className="font-medium">Precio Unitario</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                  className="border-input"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button type="button" onClick={addNewService} className="w-full mt-2" variant="outline">
                        <PlusCircle className="w-4 h-4 mr-2" /> Crear y Agregar Servicio
                      </Button>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

              {items.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Servicios Seleccionados</h3>
                  </div>
                  <div className="bg-background rounded-lg border border-input overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted">
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                            >
                              Código
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                            >
                              Descripción
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                            >
                              Cantidad
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                            >
                              Días
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                            >
                              Precio Unitario
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                            >
                              Total
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                              <span className="sr-only">Acciones</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-background divide-y divide-border">
                          {items.map((item, index) => (
                            <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                                {item.code}
                              </td>
                              <td className="px-6 py-4 text-sm text-foreground">{item.description}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                {item.quantity}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{item.days}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                {formatCurrency(item.unitPrice)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                                {formatCurrency(item.quantity * item.days * item.unitPrice)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeItem(index)}
                                  className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="bg-muted/30 p-4 border-t border-border">
                      <div className="flex flex-col items-end space-y-1">
                        <div className="grid grid-cols-2 gap-x-4 text-sm w-64">
                          <div className="text-muted-foreground">Subtotal:</div>
                          <div className="font-medium text-right">{formatCurrency(totals.subtotal)}</div>

                          <div className="text-muted-foreground">IGV (18%):</div>
                          <div className="font-medium text-right">{formatCurrency(totals.igv)}</div>

                          <div className="text-foreground font-semibold pt-2 border-t border-border">Total:</div>
                          <div className="font-bold text-right text-primary pt-2 border-t border-border">
                            {formatCurrency(totals.total)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-6">
                <Button variant="outline" onClick={() => router.push("/quotations")} type="button" className="px-5">
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
                      {quotation?.id ? "Actualizando..." : "Creando..."}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {quotation?.id ? "Actualizar Cotización" : "Crear Cotización"}
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

