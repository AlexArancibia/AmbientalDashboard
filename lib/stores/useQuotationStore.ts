import { create } from "zustand"
import type { Quotation } from "@/types"
import axiosClient from "@/lib/axios"

interface QuotationState {
  quotations: Quotation[]
  isLoading: boolean
  error: string | null
  fetchQuotations: () => Promise<void>
  getQuotation: (id: string) => Promise<Quotation | undefined>
  createQuotation: (
    quotation: Omit<Quotation, "id" | "createdAt" | "updatedAt" | "client" | "items"> & {
      clientId: string
      items: Array<{
        description: string
        code: string
        quantity: number
        days: number
        unitPrice: number
      }>
    },
  ) => Promise<Quotation | undefined>
  updateQuotation: (
    id: string,
    quotation: Partial<Omit<Quotation, "items">> & {
      items?: Array<{
        description: string
        code: string
        quantity: number
        days: number
        unitPrice: number
      }>
    },
  ) => Promise<Quotation | undefined>
  deleteQuotation: (id: string) => Promise<boolean>
  resetState: () => void
  getNextQuotationNumber: () => Promise<string>
}

export const useQuotationStore = create<QuotationState>((set, get) => ({
  quotations: [],
  isLoading: false,
  error: null,

  fetchQuotations: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await axiosClient.get("/api/quotations")
      set({ quotations: response.data, isLoading: false })
      return response.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido al obtener cotizaciones"
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },

  getQuotation: async (id: string) => {
    // First check if we already have it in the store
    const { quotations } = get()
    let quotation = quotations.find((q) => q.id === id)

    if (quotation) return quotation

    // If not, fetch it
    set({ isLoading: true, error: null })
    try {
      const response = await axiosClient.get(`/api/quotations/${id}`)
      quotation = response.data

      // Update the quotations array with the fetched quotation
      set((state) => ({
        quotations: state.quotations.some((q) => q.id === id)
          ? state.quotations.map((q) => (q.id === id ? quotation! : q))
          : [...state.quotations, quotation!],
        isLoading: false,
      }))

      return quotation
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Error desconocido al obtener cotización ${id}`
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },

  createQuotation: async (quotationData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await axiosClient.post("/api/quotations", quotationData)
      const newQuotation = response.data
      set((state) => ({
        quotations: [...state.quotations, newQuotation],
        isLoading: false,
      }))
      return newQuotation
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido al crear cotización"
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },

  updateQuotation: async (id, updatedQuotationData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await axiosClient.put(`/api/quotations/${id}`, updatedQuotationData)
      const updatedQuotation = response.data
      set((state) => ({
        quotations: state.quotations.map((quotation) =>
          quotation.id === id ? { ...quotation, ...updatedQuotation } : quotation,
        ),
        isLoading: false,
      }))
      return updatedQuotation
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Error desconocido al actualizar cotización ${id}`
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },

  deleteQuotation: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await axiosClient.delete(`/api/quotations/${id}`)
      set((state) => ({
        quotations: state.quotations.filter((quotation) => quotation.id !== id),
        isLoading: false,
      }))
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Error desconocido al eliminar cotización ${id}`
      set({ error: errorMessage, isLoading: false })
      throw error
    }
  },

  getNextQuotationNumber: async () => {
    const { quotations } = get()
    const currentYear = new Date().getFullYear()

    if (quotations.length === 0) {
      return `COT-${currentYear}-001`
    }

    const sortedQuotations = [...quotations].sort((a, b) => b.number.localeCompare(a.number))

    const lastQuotation = sortedQuotations[0]
    const [prefix, year, number] = lastQuotation.number.split("-")

    if (Number.parseInt(year) < currentYear) {
      return `COT-${currentYear}-001`
    }

    const nextNumber = (Number.parseInt(number) + 1).toString().padStart(3, "0")
    return `COT-${currentYear}-${nextNumber}`
  },

  resetState: () => {
    set({
      quotations: [],
      isLoading: false,
      error: null,
    })
  },
}))

