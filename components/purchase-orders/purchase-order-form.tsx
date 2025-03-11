"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Currency, PurchaseOrderStatus, type PurchaseOrder, type PurchaseOrderItem } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { useClientStore } from "@/lib/stores/useClientStore"
import { useUserStore } from "@/lib/stores/useUserStore"

const formSchema = z.object({
  number: z.string().min(1, { message: "El número de orden es requerido" }),
  date: z.string().min(1, { message: "La fecha es requerida" }),
  clientId: z.string().min(1, { message: "El cliente es requerido" }),
  description: z.string().optional(),
  currency: z.nativeEnum(Currency),
  paymentTerms: z.string().optional(),
  gestorId: z.string().min(1, { message: "El gestor es requerido" }),
  attendantName: z.string().optional(),
  status: z.nativeEnum(PurchaseOrderStatus),
  comments: z.string().optional(),
})

interface PurchaseOrderFormProps {
  purchaseOrderId?: string
  initialData?: Partial<PurchaseOrder>
  onSubmit: (data: Omit<PurchaseOrder, "id" | "createdAt" | "updatedAt" | "deletedAt">) => Promise<void>
}

export function PurchaseOrderForm({ purchaseOrderId, initialData, onSubmit }: PurchaseOrderFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [items, setItems] = useState<PurchaseOrderItem[]>(initialData?.items || [])
  const [totals, setTotals] = useState({ subtotal: 0, igv: 0, total: 0 })
  const [newItem, setNewItem] = useState<Partial<PurchaseOrderItem>>({})

  const { clients, fetchClients } = useClientStore()
  const { users, fetchUsers } = useUserStore()

  useEffect(() => {
    fetchClients()
    fetchUsers()
  }, [fetchClients, fetchUsers])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      number:
        initialData?.number ||
        `OC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
      date: initialData?.date
        ? new Date(initialData.date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      clientId: initialData?.clientId || "",
      description: initialData?.description || "",
      currency: initialData?.currency || Currency.PEN,
      paymentTerms: initialData?.paymentTerms || "",
      gestorId: initialData?.gestorId || "",
      attendantName: initialData?.attendantName || "",
      status: initialData?.status || PurchaseOrderStatus.DRAFT,
      comments: initialData?.comments || "",
    },
  })

  useEffect(() => {
    const subtotal = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0)
    const igv = subtotal * 0.18
    const total = subtotal + igv
    setTotals({ subtotal, igv, total })
  }, [items])

  const addItem = () => {
    if (!newItem.code || !newItem.description || !newItem.quantity || !newItem.unitPrice || !newItem.name) {
      toast({
        title: "Error",
        description: "Todos los campos del ítem son requeridos",
        variant: "destructive",
      })
      return
    }

    const total = newItem.quantity! * newItem.unitPrice!
    const item: PurchaseOrderItem = {
      id: `temp-${Date.now()}`,
      code: newItem.code,
      purchaseOrderId: purchaseOrderId || "",
      description: newItem.description,
      quantity: newItem.quantity,
      unitPrice: newItem.unitPrice,
      name: newItem.name,
      total,
    }

    setItems([...items, item])
    setNewItem({})
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
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
        throw new Error("Cliente o gestor no encontrado")
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
          total: item.quantity * item.unitPrice,
        })),
        subtotal: totals.subtotal,
        igv: totals.igv,
        total: totals.total,
        status: values.status,
        comments: values.comments,
      }

      await onSubmit(purchaseOrderData)

      router.push("/purchase-orders")
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Ocurrió un error al procesar la orden de compra.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Orden</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
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
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione una moneda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={Currency.PEN}>PEN</SelectItem>
                        <SelectItem value={Currency.USD}>USD</SelectItem>
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
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(PurchaseOrderStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
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
                  <FormLabel>Nombre del Atendiente</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ítems de la Orden</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
              <Button type="button" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" /> Agregar Ítem
              </Button>
            </div>

            <Table className="mt-4">
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Precio Unitario</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.code}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.unitPrice}</TableCell>
                    <TableCell>{(item.quantity * item.unitPrice).toFixed(2)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => removeItem(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      No hay ítems agregados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>IGV:</span>
                <span>{totals.igv.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>{totals.total.toFixed(2)}</span>
              </div>
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

        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={() => router.push("/purchase-orders")}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Guardando..." : purchaseOrderId ? "Actualizar Orden de Compra" : "Crear Orden de Compra"}
          </Button>
        </div>
      </form>
    </Form>
  )
}

