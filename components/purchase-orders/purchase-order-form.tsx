"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Currency, PurchaseOrderStatus, type PurchaseOrder, type PurchaseOrderItem, CompanyType } from "@/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, X, Loader2, Save, Search } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { useClientStore } from "@/lib/stores/useClientStore"
import { useUserStore } from "@/lib/stores/useUserStore"
import { ScrollArea } from "@/components/ui/scroll-area"

const formSchema = z.object({
  number: z.string().min(1, { message: "El número de orden es requerido" }),
  date: z.string().min(1, { message: "La fecha es requerida" }),
  clientId: z.string().min(1, { message: "El proveedor es requerido" }),
  description: z.string().optional(),
  currency: z.nativeEnum(Currency),
  paymentTerms: z.string().optional(),
  gestorId: z.string().min(1, { message: "El gestor es requerido" }),
  attendantName: z.string().optional(),
  status: z.nativeEnum(PurchaseOrderStatus),
  comments: z.string().optional(),
})

const purchaseItemSchema = z.object({
  code: z.string().min(1, "El código es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  quantity: z.number().min(1, "La cantidad debe ser al menos 1"),
  unitPrice: z.number().min(0, "El precio unitario no puede ser negativo"),
  name: z.string().min(1, "El nombre es requerido"),
})

interface PurchaseOrderFormProps {
  purchaseOrderId?: string
  initialData?: Partial<PurchaseOrder>
  onSubmit: (data: Omit<PurchaseOrder, "id" | "createdAt" | "updatedAt" | "deletedAt">) => Promise<void>
}

const formatDateForInput = (date: Date | string | undefined): string => {
  if (!date) return ""
  const d = new Date(date)
  return d.toISOString().split("T")[0]
}

export function PurchaseOrderForm({ purchaseOrderId, initialData, onSubmit }: PurchaseOrderFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [items, setItems] = useState<PurchaseOrderItem[]>(initialData?.items || [])
  const [totals, setTotals] = useState({ subtotal: 0, igv: 0, total: 0 })
  const [searchTerm, setSearchTerm] = useState("")
  const [products, setProducts] = useState<any[]>([])
  const [newItem, setNewItem] = useState<Partial<PurchaseOrderItem>>({})

  const { clients, fetchClients } = useClientStore()
  const { users, fetchUsers } = useUserStore()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      number:
        initialData?.number ||
        `OC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
      date: initialData?.date ? formatDateForInput(initialData.date) : new Date().toISOString().split("T")[0],
      clientId: initialData?.clientId || "",
      description: initialData?.description || "",
      currency: initialData?.currency || Currency.PEN,
      paymentTerms: initialData?.paymentTerms || "",
      gestorId: initialData?.gestorId || "",
      attendantName: initialData?.attendantName || "",
      status: initialData?.status || PurchaseOrderStatus.PENDING,
      comments: initialData?.comments || "",
    },
  })

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        await Promise.all([fetchClients(), fetchUsers()])

        // Fetch products or services (mock data for now)
        // In a real app, you would fetch from an API
        setProducts([
          { id: "1", code: "PROD-001", description: "Producto 1", unitPrice: 100 },
          { id: "2", code: "PROD-002", description: "Producto 2", unitPrice: 200 },
          { id: "3", code: "PROD-003", description: "Producto 3", unitPrice: 300 },
        ])
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [fetchClients, fetchUsers])

  useEffect(() => {
    const subtotal = items.reduce((acc, item) => acc + (item.total || 0), 0)
    const igv = subtotal * 0.18
    const total = subtotal + igv
    setTotals({ subtotal, igv, total })
  }, [items])

  const handleAddItem = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
    }

    if (!newItem.name) {
      newItem.name = newItem.description
    }

    const result = purchaseItemSchema.safeParse(newItem)
    if (result.success) {
      const total = result.data.quantity * result.data.unitPrice
      setItems([
        ...items,
        {
          ...result.data,
          id: `temp-${Date.now()}`,
          purchaseOrderId: purchaseOrderId || "temp",
          total,
        },
      ])
      setNewItem({})
    } else {
      toast({
        title: "Error",
        description: "Por favor, complete todos los campos del ítem correctamente.",
        variant: "destructive",
      })
    }
  }

  const handleRemoveItem = (index: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
    }
    setItems(items.filter((_, i) => i !== index))
  }

  const filteredProducts = products.filter(
    (product) =>
      product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatCurrency = (amount: number) => {
    const currency = form.getValues("currency")
    const symbol = currency === Currency.PEN ? "S/. " : "$ "
    return symbol + amount.toFixed(2)
  }

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos un ítem a la orden de compra",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const client = clients.find((c) => c.id === values.clientId)
      const gestor = users.find((u) => u.id === values.gestorId)

      if (!client || !gestor) {
        throw new Error("Proveedor o gestor no encontrado")
      }

      const purchaseOrderData: Omit<PurchaseOrder, "id" | "createdAt" | "updatedAt" | "deletedAt"> = {
        number: values.number,
        date: new Date(values.date),
        clientId: values.clientId,
        client: client,
        description: values.description,
        currency: values.currency,
        paymentTerms: values.paymentTerms,
        gestorId: values.gestorId,
        gestor: gestor,
        attendantName: values.attendantName,
        items: items.map((item) => ({
          ...item,
          name: item.name || item.description,
          code: item.code || `ITEM-${Math.random().toString(36).substring(7)}`,
        })),
        subtotal: totals.subtotal,
        igv: totals.igv,
        total: totals.total,
        status: values.status,
        comments: values.comments,
      }

      await onSubmit(purchaseOrderData)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      toast({
        title: "Error",
        description: `Ocurrió un error al guardar la orden de compra: ${errorMessage}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      <Card className="border-border shadow-md">
        <CardHeader className="bg-gradient-to-r from-background to-muted/50 border-b border-border">
          <CardTitle className="text-xl font-semibold">
            {purchaseOrderId ? "Editar Orden de Compra" : "Crear Nueva Orden de Compra"}
          </CardTitle>
          <CardDescription>
            {purchaseOrderId
              ? "Actualice los detalles de la orden de compra"
              : "Complete los detalles para crear una nueva orden de compra"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
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
                        <FormLabel className="font-medium">Proveedor</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-input">
                              <SelectValue placeholder="Seleccione un proveedor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients
                              .filter((client) => client.type === CompanyType.PROVIDER)
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
                            <SelectItem value={PurchaseOrderStatus.IN_PROGRESS}>En Progreso</SelectItem>
                            <SelectItem value={PurchaseOrderStatus.PENDING}>Pendiente</SelectItem>
                            <SelectItem value={PurchaseOrderStatus.COMPLETED}>Aprobada</SelectItem>
                            <SelectItem value={PurchaseOrderStatus.CANCELLED}>Rechazada</SelectItem>
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
                        <FormLabel className="font-medium">Nombre del Atendiente</FormLabel>
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
                          placeholder="Ingrese una descripción para esta orden de compra..."
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
                    <CardTitle>Ítems</CardTitle>
                    <CardDescription>Busque y agregue ítems a la orden</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Search and add items */}
                    <div className="space-y-4 border p-4 rounded-md">
                      <div className="flex items-center space-x-2">
                        <Search className="h-4 w-4" />
                        <Input
                          type="text"
                          placeholder="Buscar producto..."
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
                            {filteredProducts.length > 0 ? (
                              filteredProducts.map((product) => (
                                <TableRow key={product.id} className="hover:bg-muted/50 transition-colors">
                                  <TableCell>{product.code}</TableCell>
                                  <TableCell>{product.description}</TableCell>
                                  <TableCell>{formatCurrency(product.unitPrice)}</TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      type="button"
                                      onClick={() =>
                                        setNewItem({
                                          code: product.code,
                                          description: product.description,
                                          name: product.description,
                                          unitPrice: product.unitPrice,
                                          quantity: 1,
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
                                  No se encontraron productos
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </ScrollArea>

                      <div className="space-y-4">
                        <h4 className="font-medium">Agregar Ítem Manualmente</h4>
                        <div className="grid grid-cols-5 gap-4">
                          <Input
                            placeholder="Código"
                            value={newItem.code || ""}
                            onChange={(e) => setNewItem({ ...newItem, code: e.target.value })}
                          />
                          <Input
                            placeholder="Descripción"
                            value={newItem.description || ""}
                            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                          />
                          <Input
                            placeholder="Nombre"
                            value={newItem.name || ""}
                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                          />
                          <Input
                            type="number"
                            placeholder="Cantidad"
                            value={newItem.quantity || ""}
                            onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                          />
                          <Input
                            type="number"
                            placeholder="Precio Unitario"
                            value={newItem.unitPrice || ""}
                            onChange={(e) => setNewItem({ ...newItem, unitPrice: Number(e.target.value) })}
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            handleAddItem()
                          }}
                          className="w-full"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Agregar Ítem
                        </Button>
                      </div>
                    </div>

                    {/* Selected items */}
                    <div className="border p-4 rounded-md">
                      <h3 className="text-lg font-medium mb-4">Ítems Seleccionados ({items.length})</h3>
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
                                    <TableCell>{formatCurrency(item.quantity * item.unitPrice)}</TableCell>
                                    <TableCell>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          handleRemoveItem(index)
                                        }}
                                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                      >
                                        <Trash2 className="h-4 w-4" />
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
                          No hay ítems seleccionados. Agregue ítems desde la sección superior.
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
                <Button
                  variant="outline"
                  onClick={() => router.push("/purchase-orders")}
                  type="button"
                  className="px-5"
                >
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
                      {purchaseOrderId ? "Actualizando..." : "Creando..."}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {purchaseOrderId ? "Actualizar Orden" : "Crear Orden"}
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

