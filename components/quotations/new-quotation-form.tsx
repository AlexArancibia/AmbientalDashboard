"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { clients as initialClients, equipment } from "@/lib/data"
import { Currency, type Client, EquipmentStatus } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Plus, FileText, Search } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { generateQuotationPDF } from "@/lib/generateQuotationPDF"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { NewClientForm } from "@/components/clients/new-client-form"

// Actualizar el esquema del formulario para incluir el número de cotización
const formSchema = z.object({
  number: z.string().min(1, { message: "El número de cotización es requerido" }),
  clientId: z.string().min(1, { message: "Por favor seleccione un cliente" }),
  currency: z.nativeEnum(Currency),
  equipmentReleaseDate: z.string().min(1, { message: "Por favor ingrese una fecha de entrega" }),
  validityDays: z.number().min(1, { message: "La validez debe ser de al menos 1 día" }),
  considerDays: z.number().min(1, { message: "Se considera debe ser al menos 1 día" }),
  returnDate: z.string().min(1, { message: "Por favor ingrese una fecha de retorno" }),
  notes: z.string().optional(),
  selectedService: z.string().optional(),
  quantity: z.number().min(1, "La cantidad debe ser al menos 1"),
  days: z.number().min(1, "Los días deben ser al menos 1"),
  unitPrice: z.number().min(0, "El precio unitario no puede ser negativo"),
})

// Predefined services including equipment rentals
const predefinedServices = [
  { id: "srv-001", name: "Monitoreo de Calidad de Aire", code: "SRV-001", unitPrice: 1500 },
  { id: "srv-002", name: "Análisis de Muestras de Agua", code: "SRV-002", unitPrice: 1200 },
  { id: "srv-003", name: "Evaluación de Impacto Ambiental", code: "SRV-003", unitPrice: 3000 },
  { id: "srv-004", name: "Monitoreo de Ruido Ambiental", code: "SRV-004", unitPrice: 800 },
  { id: "srv-005", name: "Análisis de Vibraciones", code: "SRV-005", unitPrice: 1000 },
  ...equipment.map((equip) => ({
    id: `rent-${equip.id}`,
    name: `Servicio de alquiler de ${equip.name}`,
    code: `ALQ-${equip.code}`,
    unitPrice: 100, // Default price for equipment rental
    equipmentId: equip.id,
  })),
]

interface QuotationItem {
  id: string
  name: string
  code: string
  quantity: number
  days: number
  unitPrice: number
  isCustom?: boolean
}

const DEFAULT_NOTES = `Una vez aceptada la cotización envienos su confirmación por vía mail,
para iniciar con las coordinaciones del presente servicio. E-mail:
ventas@ambientalpe.com N.CUENTA. BBVA SOLES:
0011039694020045050 CCI:01139600020045050694 (B.NACIÓN) CTA.
DE DETRACCIÓN : 00591113992 Nº DE CCI: 018591000591113992`

export function NewQuotationForm() {
  const [items, setItems] = useState<QuotationItem[]>([])
  const [isNewClientDialogOpen, setIsNewClientDialogOpen] = useState(false)
  const [clients, setClients] = useState(initialClients)
  const [searchTerm, setSearchTerm] = useState("")
  const [customService, setCustomService] = useState({
    description: "",
    code: "",
    quantity: 1,
    days: 1,
    unitPrice: 0,
  })

  // Actualizar los valores por defecto para incluir un número de cotización generado automáticamente
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      number: `COT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
      clientId: "",
      currency: Currency.PEN,
      equipmentReleaseDate: "",
      validityDays: 15,
      considerDays: 1,
      returnDate: "",
      notes: DEFAULT_NOTES,
      selectedService: "",
      quantity: 1,
      days: 1,
      unitPrice: 0,
    },
  })

  const filteredServices = predefinedServices.filter(
    (service) =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.code.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const addPredefinedService = (serviceId: string) => {
    const service = predefinedServices.find((s) => s.id === serviceId)
    if (!service) return

    const { quantity, days } = form.getValues()

    setItems([
      ...items,
      {
        id: service.id,
        name: service.name,
        code: service.code,
        quantity: quantity,
        days: days,
        unitPrice: service.unitPrice,
        isCustom: false,
      },
    ])

    // Reset form fields
    form.setValue("quantity", 1)
    form.setValue("days", 1)
  }

  const addCustomService = () => {
    if (!customService.description || customService.quantity < 1 || customService.days < 1) return

    setItems([
      ...items,
      {
        id: `custom-${Date.now()}`,
        name: customService.description,
        code: customService.code || `SRV-${Date.now()}`,
        quantity: customService.quantity,
        days: customService.days,
        unitPrice: customService.unitPrice,
        isCustom: true,
      },
    ])

    // Reset form fields
    setCustomService({
      description: "",
      code: "",
      quantity: 1,
      days: 1,
      unitPrice: 0,
    })
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const calculateTotals = () => {
    const subtotal = items.reduce((acc, item) => acc + item.quantity * item.days * item.unitPrice, 0)
    const igv = subtotal * 0.18
    const total = subtotal + igv
    return { subtotal, igv, total }
  }

  const { subtotal, igv, total } = calculateTotals()

  const handleNewClientCreated = (newClient: Client) => {
    setClients((prevClients) => [...prevClients, newClient])
    form.setValue("clientId", newClient.id)
    setIsNewClientDialogOpen(false)
    toast({
      title: "Cliente creado",
      description: `El cliente ${newClient.name} ha sido creado exitosamente.`,
    })
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos un servicio a la cotización",
        variant: "destructive",
      })
      return
    }

    const client = clients.find((c) => c.id === values.clientId)
    if (!client) {
      toast({
        title: "Error",
        description: "Cliente seleccionado no encontrado",
        variant: "destructive",
      })
      return
    }

    // Create a mock equipment object for each service to maintain compatibility with the PDF generator
    const mockEquipmentItems = items.map((item) => ({
      id: `temp-${Math.random()}`,
      quotationId: "temp",
      equipmentId: item.id,
      equipment: {
        id: item.id,
        name: item.name,
        code: item.code,
        type: "Servicio",
        description: item.name,
        status: EquipmentStatus.BUENO,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      quantity: item.quantity,
      days: item.days,
      unitPrice: item.unitPrice,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))

    const quotation = {
      id: "temp",
      number: values.number,
      date: new Date(),
      clientId: values.clientId,
      client,
      currency: values.currency,
      equipmentReleaseDate: new Date(values.equipmentReleaseDate),
      items: mockEquipmentItems,
      subtotal,
      igv,
      total,
      validityDays: values.validityDays,
      considerDays: values.considerDays,
      returnDate: values.returnDate ? new Date(values.returnDate) : undefined,
      status: "DRAFT" as const,
      notes: values.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const doc = generateQuotationPDF(quotation)
    doc.save(`cotizacion_${quotation.number}.pdf`)

    toast({
      title: "Cotización generada",
      description: `La cotización ${quotation.number} ha sido generada exitosamente.`,
    })
  }

  const handleServiceSelection = (serviceId: string) => {
    const service = predefinedServices.find((s) => s.id === serviceId)
    if (service) {
      form.setValue("unitPrice", service.unitPrice)
      addPredefinedService(serviceId)
    }
  }

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="shadow-md">
            <CardHeader className="bg-muted">
              <CardTitle className="text-lg font-semibold">Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {/* Agregar el campo de número de cotización en el formulario */}
              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Número de Cotización</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-background" />
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
                    <FormLabel className="text-sm font-medium">Cliente</FormLabel>
                    <div className="flex items-center space-x-2">
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
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
                      <Dialog open={isNewClientDialogOpen} onOpenChange={setIsNewClientDialogOpen}>
                        <DialogTrigger asChild>
                          <Button type="button" variant="outline">
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Cliente
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Crear Nuevo Cliente</DialogTitle>
                            <DialogDescription>
                              Ingrese los detalles del nuevo cliente. Haga clic en guardar cuando termine.
                            </DialogDescription>
                          </DialogHeader>
                          <NewClientForm onClientCreated={handleNewClientCreated} />
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
                    <FormLabel className="text-sm font-medium">Moneda</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="equipmentReleaseDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Fecha de Entrega</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ""} className="bg-background" />
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
                      <FormLabel className="text-sm font-medium">Debe volver</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ""} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="validityDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Validez de Cotización</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          value={field.value}
                          className="bg-background"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="considerDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Se considera</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          value={field.value}
                          className="bg-background"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="bg-muted">
              <CardTitle className="text-lg font-semibold">Agregar Servicios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-2">Servicios Predefinidos</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar servicios..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-background"
                    />
                  </div>

                  <div className="grid gap-2 max-h-60 overflow-y-auto">
                    {filteredServices.map((service) => (
                      <div key={service.id} className="flex items-center justify-between border p-3 rounded-md">
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-muted-foreground">Código: {service.code}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {form.getValues("currency") === Currency.PEN ? "S/. " : "$ "}
                            {service.unitPrice.toFixed(2)}
                          </p>
                          <Button type="button" size="sm" onClick={() => handleServiceSelection(service.id)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {filteredServices.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">No se encontraron servicios</p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Cantidad</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              value={field.value}
                              className="bg-background"
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
                          <FormLabel className="text-sm font-medium">Días</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              value={field.value}
                              className="bg-background"
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
                          <FormLabel className="text-sm font-medium">Precio Unitario</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              value={field.value}
                              className="bg-background"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium mb-2">Agregar Servicio Personalizado</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium">Descripción</label>
                      <Input
                        placeholder="Descripción del servicio"
                        value={customService.description}
                        onChange={(e) => setCustomService({ ...customService, description: e.target.value })}
                        className="bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Código</label>
                      <Input
                        placeholder="Código del servicio"
                        value={customService.code}
                        onChange={(e) => setCustomService({ ...customService, code: e.target.value })}
                        className="bg-background"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3 mt-2">
                    <div>
                      <label className="text-sm font-medium">Cantidad</label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Cantidad"
                        value={customService.quantity}
                        onChange={(e) => setCustomService({ ...customService, quantity: Number(e.target.value) })}
                        className="bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Días</label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Días"
                        value={customService.days}
                        onChange={(e) => setCustomService({ ...customService, days: Number(e.target.value) })}
                        className="bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Precio Unitario</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Precio unitario"
                        value={customService.unitPrice}
                        onChange={(e) => setCustomService({ ...customService, unitPrice: Number(e.target.value) })}
                        className="bg-background"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={addCustomService}
                    className="w-full mt-4"
                    disabled={!customService.description || customService.quantity < 1 || customService.days < 1}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Agregar Servicio Personalizado
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="bg-muted">
              <CardTitle className="text-lg font-semibold">Servicios Seleccionados</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Días</TableHead>
                    <TableHead>Precio Unitario</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.code}</p>
                        </div>
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.days}</TableCell>
                      <TableCell>
                        {form.getValues("currency") === Currency.PEN ? "S/. " : "$ "}
                        {item.unitPrice.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {form.getValues("currency") === Currency.PEN ? "S/. " : "$ "}
                        {(item.quantity * item.days * item.unitPrice).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeItem(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No hay servicios agregados
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="mt-6 flex justify-end">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Subtotal:</span>
                    <span className="font-semibold">
                      {form.getValues("currency") === Currency.PEN ? "S/. " : "$ "}
                      {subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">IGV (18%):</span>
                    <span className="font-semibold">
                      {form.getValues("currency") === Currency.PEN ? "S/. " : "$ "}
                      {igv.toFixed(2)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-medium">Total:</span>
                    <span className="font-bold text-lg">
                      {form.getValues("currency") === Currency.PEN ? "S/. " : "$ "}
                      {total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="bg-muted">
              <CardTitle className="text-lg font-semibold">Notas Adicionales</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Notas</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} className="bg-background" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 text-lg">
              <FileText className="mr-2 h-5 w-5" /> Generar Cotización PDF
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

