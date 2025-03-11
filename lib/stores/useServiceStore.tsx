import { create } from "zustand"
import axiosClient from "@/lib/axios"

export interface Service {
  id: string
  name: string
  code: string
  description?: string
  category?: string
  unitPrice: number
  createdAt: Date
  updatedAt: Date
}

interface ServiceState {
  services: Service[]
  isLoading: boolean
  error: string | null
  fetchServices: () => Promise<void>
  getService: (id: string) => Promise<Service | undefined>
  createService: (service: Omit<Service, "id" | "createdAt" | "updatedAt">) => Promise<Service | undefined>
  updateService: (id: string, service: Partial<Service>) => Promise<Service | undefined>
  deleteService: (id: string) => Promise<boolean>
}

export const useServiceStore = create<ServiceState>((set, get) => ({
  services: [],
  isLoading: false,
  error: null,

  fetchServices: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await axiosClient.get("/api/services")
      set({ services: response.data, isLoading: false })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido al obtener servicios"
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },

  getService: async (id: string) => {
    const { services } = get()
    let service = services.find((s) => s.id === id)

    if (service) return service

    set({ isLoading: true, error: null })
    try {
      const response = await axiosClient.get(`/api/services/${id}`)
      service = response.data
      set({ isLoading: false })
      return service
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Error desconocido al obtener servicio ${id}`
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },

  createService: async (serviceData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await axiosClient.post("/api/services", serviceData)
      const newService = response.data
      set((state) => ({
        services: [...state.services, newService],
        isLoading: false,
      }))
      return newService
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido al crear servicio"
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },

  updateService: async (id, updatedServiceData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await axiosClient.put(`/api/services/${id}`, updatedServiceData)
      const updatedService = response.data
      set((state) => ({
        services: state.services.map((service) => (service.id === id ? updatedService : service)),
        isLoading: false,
      }))
      return updatedService
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Error desconocido al actualizar servicio ${id}`
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },

  deleteService: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await axiosClient.delete(`/api/services/${id}`)
      set((state) => ({
        services: state.services.filter((service) => service.id !== id),
        isLoading: false,
      }))
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Error desconocido al eliminar servicio ${id}`
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },
}))

