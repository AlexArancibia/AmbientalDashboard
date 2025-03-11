"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { ClientDetails } from "@/components/clients/client-details"
import { useClientStore } from "@/lib/stores/useClientStore"
import { Skeleton } from "@/components/ui/skeleton"
import type { Client } from "@/types"

export default function ClientDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { clients, fetchClients, updateClient } = useClientStore()
  const [loading, setLoading] = useState(true)
  const [client, setClient] = useState<Client | null>(null)

  useEffect(() => {
    const fetchClientData = async () => {
      setLoading(true)
      try {
        if (clients.length === 0) {
          await fetchClients()
        }
        const foundClient = clients.find((c) => c.id === id)
        setClient(foundClient || null)
      } catch (error) {
        console.error("Failed to fetch client:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchClientData()
  }, [id, clients, fetchClients])

  const handleUpdateClient = async (updatedData: Partial<Client>) => {
    if (client) {
      try {
        const updatedClient = await updateClient(client.id, updatedData)
        setClient(updatedClient)
      } catch (error) {
        console.error("Failed to update client:", error)
      }
    }
  }

  if (loading) {
    return (
      <DashboardShell>
        <DashboardHeader heading="Loading..." text="Please wait" />
        <div className="grid gap-10">
          <Skeleton className="h-[450px]" />
        </div>
      </DashboardShell>
    )
  }

  if (!client) {
    return (
      <DashboardShell>
        <DashboardHeader heading="Client Not Found" text="The requested client could not be found." />
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <DashboardHeader heading={client.name} text={`RUC: ${client.ruc}`} />
      <ClientDetails client={client} onUpdate={handleUpdateClient} />
    </DashboardShell>
  )
}

  