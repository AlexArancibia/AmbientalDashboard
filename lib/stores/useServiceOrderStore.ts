import { create } from "zustand"
import type { ServiceOrder } from "@/types"
import axiosClient from "@/lib/axios"

interface ServiceOrderState {
  serviceOrders: ServiceOrder[]
  isLoading: boolean
  error: string | null
  fetchServiceOrders: () => Promise<void>
  getServiceOrder: (id: string) => Promise<ServiceOrder | undefined>
  createServiceOrder: (serviceOrder: Omit<ServiceOrder, "id" | "createdAt" | "updatedAt">) => Promise<ServiceOrder>
  updateServiceOrder: (id: string, serviceOrder: Partial<ServiceOrder>) => Promise<ServiceOrder>
  deleteServiceOrder: (id: string) => Promise<boolean>
  getNextServiceOrderNumber: () => Promise<string>
}

export const useServiceOrderStore = create<ServiceOrderState>((set, get) => ({
  serviceOrders: [],
  isLoading: false,
  error: null,

  fetchServiceOrders: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await axiosClient.get("/api/service-orders")
      set({ serviceOrders: response.data, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  getServiceOrder: async (id: string) => {
    const { serviceOrders } = get()
    let serviceOrder = serviceOrders.find((so) => so.id === id)

    if (serviceOrder) return serviceOrder

    set({ isLoading: true, error: null })
    try {
      const response = await axiosClient.get(`/api/service-orders/${id}`)
      serviceOrder = response.data
      set({ isLoading: false })
      return serviceOrder
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      return undefined
    }
  },

  createServiceOrder: async (serviceOrderData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await axiosClient.post("/api/service-orders", serviceOrderData)
      const newServiceOrder = response.data
      set((state) => ({
        serviceOrders: [...state.serviceOrders, newServiceOrder],
        isLoading: false,
      }))
      return newServiceOrder
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create service order"
      set({ error: errorMessage, isLoading: false })
      throw new Error(errorMessage)
    }
  },

  updateServiceOrder: async (id, updatedServiceOrderData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await axiosClient.put(`/api/service-orders/${id}`, updatedServiceOrderData)
      const updatedServiceOrder = response.data
      set((state) => ({
        serviceOrders: state.serviceOrders.map((order) => (order.id === id ? updatedServiceOrder : order)),
        isLoading: false,
      }))
      return updatedServiceOrder
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update service order"
      set({ error: errorMessage, isLoading: false })
      throw new Error(errorMessage)
    }
  },

  deleteServiceOrder: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await axiosClient.delete(`/api/service-orders/${id}`)
      set((state) => ({
        serviceOrders: state.serviceOrders.filter((order) => order.id !== id),
        isLoading: false,
      }))
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete service order"
      set({ error: errorMessage, isLoading: false })
      return false
    }
  },

  getNextServiceOrderNumber: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await axiosClient.get("/api/service-orders/next-number")

      // Check if response and response.data exist
      if (!response || !response.data) {
        throw new Error("Invalid response from server")
      }

      // Check if nextNumber exists in the response
      if (!response.data.nextNumber) {
        throw new Error("Next number not found in response")
      }

      set({ isLoading: false })
      return response.data.nextNumber
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch next service order number"
      console.error("Error fetching next service order number:", errorMessage)
      set({ error: errorMessage, isLoading: false })

      // Fallback to a default number if the API call fails
      return "OS-001"
    }
  },
}))

