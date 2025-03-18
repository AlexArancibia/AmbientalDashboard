"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PaymentMethod, CompanyType, type Client } from "@/types"
import { format } from "date-fns"

const formSchema = z.object({
  name: z.string().min(1, { message: "La razón social es requerida" }),
  ruc: z.string().min(11, { message: "El RUC debe tener 11 dígitos" }).max(11),
  address: z.string().min(1, { message: "La dirección es requerida" }),
  type: z.nativeEnum(CompanyType, { message: "El tipo de empresa es requerido" }),
  email: z.string().email({ message: "Correo electrónico inválido" }),
  contactPerson: z.string().optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
})

interface ClientDetailsProps {
  client: Client
  onUpdate: (data: Partial<Client>) => Promise<void>
}

export function ClientDetails({ client, onUpdate }: ClientDetailsProps) {
  const [isEditing, setIsEditing] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: client.name,
      ruc: client.ruc,
      address: client.address,
      type: client.type,
      email: client.email,
      contactPerson: client.contactPerson || "",
      paymentMethod: client.paymentMethod,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await onUpdate(values)
      setIsEditing(false)
    } catch (error) {
      console.error("Failed to update client:", error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalles del Cliente</CardTitle>
        <CardDescription>Información detallada del cliente</CardDescription>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razón Social</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ruc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RUC</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={CompanyType.CLIENT}>Cliente</SelectItem>
                        <SelectItem value={CompanyType.PROVIDER}>Proveedor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Persona de Contacto</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de Pago</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un método de pago" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={PaymentMethod.EFECTIVO}>Efectivo</SelectItem>
                        <SelectItem value={PaymentMethod.TRANSFERENCIA}>Transferencia</SelectItem>
                        <SelectItem value={PaymentMethod.CREDITO}>Crédito</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Guardar Cambios</Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold">Razón Social</h3>
                <p>{client.name}</p>
              </div>
              <div>
                <h3 className="font-semibold">RUC</h3>
                <p>{client.ruc}</p>
              </div>
              <div>
                <h3 className="font-semibold">Dirección</h3>
                <p>{client.address}</p>
              </div>
              <div>
                <h3 className="font-semibold">Tipo</h3>
                <p>{client.type === CompanyType.CLIENT ? "Cliente" : "Proveedor"}</p>
              </div>
              <div>
                <h3 className="font-semibold">Correo Electrónico</h3>
                <p>{client.email}</p>
              </div>
              <div>
                <h3 className="font-semibold">Persona de Contacto</h3>
                <p>{client.contactPerson || "N/A"}</p>
              </div>
              <div>
                <h3 className="font-semibold">Método de Pago</h3>
                <p>{client.paymentMethod || "N/A"}</p>
              </div>
              <div>
                <h3 className="font-semibold">Fecha de Inicio</h3>
                <p>{client.startDate ? format(new Date(client.startDate), "dd/MM/yyyy") : "N/A"}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setIsEditing(true)}>Editar</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

