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
import { PaymentMethod, type Client, CompanyType } from "@/types"

// Modifica el esquema de validación para manejar startDate como string
export const formSchema = z.object({
  name: z.string().min(1, { message: "La razón social es requerida" }),
  ruc: z.string().min(11, { message: "El RUC debe tener al menos 11 caracteres" }),
  address: z.string().min(1, { message: "La dirección es requerida" }),
  type: z.nativeEnum(CompanyType),
  email: z.string().email({ message: "Ingrese un email válido" }),
  contactPerson: z.string().optional(),
  creditLine: z.number().optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  startDate: z.string().optional(), // Mantener como string para el input de tipo date
})

interface ClientFormProps {
  client?: Partial<Client>
  onSubmit: (data: z.infer<typeof formSchema>) => void
  onCancel: () => void
  defaultType?: CompanyType
}

export function ClientForm({ client, onSubmit, onCancel, defaultType }: ClientFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Determinar el tipo basado en defaultType o el tipo existente del cliente
  const entityType = defaultType || client?.type || CompanyType.CLIENT

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: client?.name || "",
      ruc: client?.ruc || "",
      address: client?.address || "",
      type: entityType, // Usar el tipo determinado
      email: client?.email || "",
      contactPerson: client?.contactPerson || "",
      creditLine: client?.creditLine || undefined,
      paymentMethod: client?.paymentMethod as PaymentMethod | undefined,
      startDate: client?.startDate ? new Date(client.startDate).toISOString().split("T")[0] : "",
    },
  })

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    try {
      // Asegurarse de que el tipo sea el correcto antes de enviar
      const dataToSubmit = {
        ...values,
        type: entityType,
      }
      await onSubmit(dataToSubmit)
    } catch (error) {
      console.error("Error submitting form:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Campo type oculto - se establece automáticamente */}
        <input type="hidden" {...form.register("type")} value={entityType} />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
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
                  {...field}
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                />
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
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de Inicio</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel} type="button">
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </form>
    </Form>
  )
}

