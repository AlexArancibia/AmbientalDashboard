"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, PencilIcon, TrashIcon, Search } from "lucide-react"
import { type Client, PaymentMethod } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ClientForm } from "./client-form"
import { useClientStore } from "@/lib/stores/useClientStore"
import { toast } from "@/components/ui/use-toast"
import type { z } from "zod"
import type { formSchema } from "./client-form"

export function ClientsTable() {
  const { clients, isLoading, error, fetchClients, createClient, updateClient, deleteClient } = useClientStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | undefined>(undefined)

  // Fetch clients on component mount
  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  // Filter clients whenever the search term or clients list changes
  useEffect(() => {
    const filtered = clients.filter(
      (client) =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.ruc.includes(searchTerm) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredClients(filtered)
  }, [clients, searchTerm])

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      })
    }
  }, [error])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const getPaymentMethodLabel = (method?: PaymentMethod) => {
    if (!method) return "Not specified"

    switch (method) {
      case PaymentMethod.EFECTIVO:
        return "Efectivo"
      case PaymentMethod.TRANSFERENCIA:
        return "Transferencia"
      case PaymentMethod.CREDITO:
        return "Crédito"
      default:
        return method
    }
  }

  const handleEditClient = (client: Client) => {
    setSelectedClient(client)
    setIsDialogOpen(true)
  }

  const handleCreateClient = () => {
    setSelectedClient(undefined)
    setIsDialogOpen(true)
  }

  const handleSubmitClient = async (data: z.infer<typeof formSchema>) => {
    setIsDialogOpen(false)

    try {
      if (selectedClient) {
        // Update existing client
        await updateClient(selectedClient.id, data)
        toast({
          title: "Cliente actualizado",
          description: "El cliente ha sido actualizado exitosamente.",
        })
      } else {
        // Create new client
        await createClient(data)
        toast({
          title: "Cliente creado",
          description: "El cliente ha sido creado exitosamente.",
        })
      }
    } catch (error) {
      console.error("Error saving client:", error)
      // Error is already handled by the store and will show a toast
    }
  }

  const handleDeleteClient = async (client: Client) => {
    if (confirm(`¿Estás seguro de que deseas eliminar al cliente ${client.name}?`)) {
      try {
        await deleteClient(client.id)
        toast({
          title: "Cliente eliminado",
          description: "El cliente ha sido eliminado exitosamente.",
        })
      } catch (error) {
        console.error("Error deleting client:", error)
        // Error is already handled by the store and will show a toast
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={handleSearch}
            className="h-9 w-[250px] md:w-[300px] lg:w-[400px]"
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {filteredClients.length} clientes
          </Badge>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreateClient}>Crear Cliente</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{selectedClient ? "Editar Cliente" : "Crear Cliente"}</DialogTitle>
                <DialogDescription>
                  {selectedClient
                    ? "Modifica los detalles del cliente aquí. Haz clic en guardar cuando termines."
                    : "Ingresa los detalles del nuevo cliente aquí."}
                </DialogDescription>
              </DialogHeader>
              <ClientForm
                client={selectedClient}
                onSubmit={handleSubmitClient}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-24">
              <p>Cargando clientes...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Razón Social</TableHead>
                  <TableHead>RUC</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Persona de Contacto</TableHead>
                  <TableHead className="hidden lg:table-cell">Método de Pago</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No se encontraron clientes.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.ruc}</TableCell>
                      <TableCell className="hidden md:table-cell">{client.email}</TableCell>
                      <TableCell className="hidden md:table-cell">{client.contactPerson || "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {getPaymentMethodLabel(client.paymentMethod as PaymentMethod)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menú</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleEditClient(client)}>
                              <PencilIcon className="mr-2 h-4 w-4" />
                              <span>Editar</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClient(client)}>
                              <TrashIcon className="mr-2 h-4 w-4" />
                              <span>Eliminar</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

