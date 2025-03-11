import { create } from "zustand"
import type { Equipment } from "@/types"
import axiosClient from "@/lib/axios"

interface EquipmentState {
  equipment: Equipment[]
  isLoading: boolean
  error: string | null
  fetchEquipment: () => Promise<void>
  getEquipment: (id: string) => Promise<Equipment | undefined>
  createEquipment: (equipment: Omit<Equipment, "id" | "createdAt" | "updatedAt">) => Promise<void>
  updateEquipment: (id: string, equipment: Partial<Equipment>) => Promise<void>
  deleteEquipment: (id: string) => Promise<void>
}

export const useEquipmentStore = create<EquipmentState>((set, get) => ({
  equipment: [],
  isLoading: false,
  error: null,

  fetchEquipment: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await axiosClient.get("/api/equipment")
      set({ equipment: response.data, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  getEquipment: async (id: string) => {
    // First check if we already have it in the store
    const { equipment } = get()
    let item = equipment.find((e) => e.id === id)

    if (item) return item

    // If not, fetch it
    set({ isLoading: true, error: null })
    try {
      const response = await axiosClient.get(`/api/equipment/${id}`)
      item = response.data
      set({ isLoading: false })
      return item
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      return undefined
    }
  },

  createEquipment: async (equipmentData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await axiosClient.post("/api/equipment", equipmentData)
      const newEquipment = response.data
      set((state) => ({
        equipment: [...state.equipment, newEquipment],
        isLoading: false,
      }))
      return newEquipment
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create equipment"
      set({ error: errorMessage, isLoading: false })
      throw new Error(errorMessage)
    }
  },

  updateEquipment: async (id, updatedEquipmentData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await axiosClient.put(`/api/equipment/${id}`, updatedEquipmentData)
      const updatedEquipment = response.data
      set((state) => ({
        equipment: state.equipment.map((item) => (item.id === id ? updatedEquipment : item)),
        isLoading: false,
      }))
      return updatedEquipment
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update equipment"
      set({ error: errorMessage, isLoading: false })
      throw new Error(errorMessage)
    }
  },

  deleteEquipment: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await axiosClient.delete(`/api/equipment/${id}`)
      set((state) => ({
        equipment: state.equipment.filter((item) => item.id !== id),
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete equipment"
      set({ error: errorMessage, isLoading: false })
      throw new Error(errorMessage)
    }
  },
}))

