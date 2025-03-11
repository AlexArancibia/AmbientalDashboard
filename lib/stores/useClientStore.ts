import { create } from "zustand"
import type { Client } from "@/types"

interface ClientStore {
  clients: Client[]
  isLoading: boolean
  error: string | null
  fetchClients: () => Promise<void>
  createClient: (client: Omit<Client, "id" | "createdAt" | "updatedAt">) => Promise<Client>
  updateClient: (id: string, client: Partial<Client>) => Promise<Client>
  deleteClient: (id: string) => Promise<boolean>
}

export const useClientStore = create<ClientStore>((set, get) => ({
  clients: [],
  isLoading: false,
  error: null,

  fetchClients: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch("/api/clients")
      if (!response.ok) {
        throw new Error("Failed to fetch clients")
      }
      const clients = await response.json()
      set({ clients, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  createClient: async (clientData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientData),
      })
      if (!response.ok) {
        throw new Error("Failed to create client")
      }
      const newClient = await response.json()
      set((state) => ({ clients: [...state.clients, newClient], isLoading: false }))
      return newClient
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  updateClient: async (id, clientData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientData),
      })
      if (!response.ok) {
        throw new Error("Failed to update client")
      }
      const updatedClient = await response.json()
      set((state) => ({
        clients: state.clients.map((client) => (client.id === id ? updatedClient : client)),
        isLoading: false,
      }))
      return updatedClient
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  deleteClient: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`/api/clients/${id}`, { method: "DELETE" })
      if (!response.ok) {
        throw new Error("Failed to delete client")
      }
      set((state) => ({
        clients: state.clients.filter((client) => client.id !== id),
        isLoading: false,
      }))
      return true
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      return false
    }
  },
}))

