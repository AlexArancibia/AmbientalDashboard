import { create } from "zustand"
import type { PurchaseOrder } from "@/types"
import axiosClient from "@/lib/axios"

interface PurchaseOrderState {
  purchaseOrders: PurchaseOrder[]
  isLoading: boolean
  error: string | null
  fetchPurchaseOrders: () => Promise<void>
  getPurchaseOrder: (id: string) => Promise<PurchaseOrder | undefined>
  createPurchaseOrder: (purchaseOrder: Omit<PurchaseOrder, "id" | "createdAt" | "updatedAt">) => Promise<PurchaseOrder>
  updatePurchaseOrder: (id: string, purchaseOrder: Partial<PurchaseOrder>) => Promise<PurchaseOrder>
  deletePurchaseOrder: (id: string) => Promise<boolean>
}

export const usePurchaseOrderStore = create<PurchaseOrderState>((set, get) => ({
  purchaseOrders: [],
  isLoading: false,
  error: null,

  fetchPurchaseOrders: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await axiosClient.get("/api/purchase-orders")
      set({ purchaseOrders: response.data, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  getPurchaseOrder: async (id: string) => {
    const { purchaseOrders } = get()
    let purchaseOrder = purchaseOrders.find((po) => po.id === id)

    if (purchaseOrder) return purchaseOrder

    set({ isLoading: true, error: null })
    try {
      const response = await axiosClient.get(`/api/purchase-orders/${id}`)
      purchaseOrder = response.data
      set({ isLoading: false })
      return purchaseOrder
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      return undefined
    }
  },

  createPurchaseOrder: async (purchaseOrderData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await axiosClient.post("/api/purchase-orders", purchaseOrderData)
      const newPurchaseOrder = response.data
      set((state) => ({
        purchaseOrders: [...state.purchaseOrders, newPurchaseOrder],
        isLoading: false,
      }))
      return newPurchaseOrder
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create purchase order"
      set({ error: errorMessage, isLoading: false })
      throw new Error(errorMessage)
    }
  },

  updatePurchaseOrder: async (id, updatedPurchaseOrderData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await axiosClient.put(`/api/purchase-orders/${id}`, updatedPurchaseOrderData)
      const updatedPurchaseOrder = response.data
      set((state) => ({
        purchaseOrders: state.purchaseOrders.map((order) => (order.id === id ? updatedPurchaseOrder : order)),
        isLoading: false,
      }))
      return updatedPurchaseOrder
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update purchase order"
      set({ error: errorMessage, isLoading: false })
      throw new Error(errorMessage)
    }
  },

  deletePurchaseOrder: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await axiosClient.delete(`/api/purchase-orders/${id}`)
      set((state) => ({
        purchaseOrders: state.purchaseOrders.filter((order) => order.id !== id),
        isLoading: false,
      }))
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete purchase order"
      set({ error: errorMessage, isLoading: false })
      return false
    }
  },
}))

