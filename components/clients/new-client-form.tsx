"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { type Client, PaymentMethod } from "@/types"

const formSchema = z.object({
  name: z.string().min(2, { message: "La razón social debe tener al menos 2 caracteres." }),
  ruc: z.string().min(11, { message: "El RUC debe tener 11 caracteres." }).max(11),
  address: z.string().min(5, { message: "La dirección debe tener al menos 5 caracteres." }),
  email: z.string().email({ message: "Correo electrónico inválido." }),
  contactPerson: z.string().optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
})

interface NewClientFormProps {
  onClientCreated: (client: Client) => void
}

export function NewClientForm({ onClientCreated }: NewClientFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      ruc: "",
      address: "",
      email: "",
      contactPerson: "",
      paymentMethod: undefined,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      // Here you would typically make an API call to create the client
      // For now, we'll simulate it with a timeout
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newClient: Client = {
        id: `client-${Date.now()}`, // Generate a temporary ID
        ...values,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      onClientCreated(newClient)
      toast({
        title: "Éxito",
        description: "El nuevo cliente ha sido creado.",
      })
      form.reset()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el cliente. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Razón Social</FormLabel>
              <FormControl>
                <Input placeholder="Razón social del cliente" {...field} />
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
                <Input placeholder="Número de RUC" {...field} />
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
                <Input placeholder="Dirección del cliente" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Correo electrónico" type="email" {...field} />
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
                <Input placeholder="Nombre de la persona de contacto" {...field} />
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
              <Select onValueChange={field.onChange} value={field.value}>
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
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creando..." : "Crear Cliente"}
        </Button>
      </form>
    </Form>
  )
}

