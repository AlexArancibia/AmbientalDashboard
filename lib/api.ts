// Client-side API utility functions

// Generic fetch function with error handling
async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options)

  if (!response.ok) {
    // Try to parse error message from response
    try {
      const errorData = await response.json()
      throw new Error(errorData.error || `API error: ${response.status}`)
    } catch (e) {
      throw new Error(`API error: ${response.status}`)
    }
  }

  return response.json()
}

// Clients
export async function getClientsApi() {
  return fetchAPI<Client[]>("/api/clients")
}

export async function getClientApi(id: string) {
  return fetchAPI<Client>(`/api/clients/${id}`)
}

export async function createClientApi(client: Omit<Client, "id" | "createdAt" | "updatedAt">) {
  return fetchAPI<Client>("/api/clients", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(client),
  })
}

export async function updateClientApi(id: string, client: Partial<Client>) {
  return fetchAPI<Client>(`/api/clients/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(client),
  })
}

export async function deleteClientApi(id: string) {
  return fetchAPI<{ success: boolean }>(`/api/clients/${id}`, {
    method: "DELETE",
  })
}

// Equipment
export async function getEquipmentApi() {
  return fetchAPI<Equipment[]>("/api/equipment")
}

export async function getEquipmentItemApi(id: string) {
  return fetchAPI<Equipment>(`/api/equipment/${id}`)
}

export async function createEquipmentApi(equipment: Omit<Equipment, "id" | "createdAt" | "updatedAt">) {
  return fetchAPI<Equipment>("/api/equipment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(equipment),
  })
}

export async function updateEquipmentApi(id: string, equipment: Partial<Equipment>) {
  return fetchAPI<Equipment>(`/api/equipment/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(equipment),
  })
}

export async function deleteEquipmentApi(id: string) {
  return fetchAPI<{ success: boolean }>(`/api/equipment/${id}`, {
    method: "DELETE",
  })
}

// Quotations
export async function getQuotationsApi() {
  return fetchAPI<Quotation[]>("/api/quotations")
}

export async function getQuotationApi(id: string) {
  return fetchAPI<Quotation>(`/api/quotations/${id}`)
}

export async function createQuotationApi(
  quotation: Omit<Quotation, "id" | "createdAt" | "updatedAt" | "client" | "items"> & {
    items: Omit<QuotationItem, "id" | "quotationId" | "equipment" | "createdAt" | "updatedAt">[]
  },
) {
  return fetchAPI<Quotation>("/api/quotations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(quotation),
  })
}

export async function updateQuotationApi(id: string, quotation: Partial<Quotation>) {
  return fetchAPI<Quotation>(`/api/quotations/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(quotation),
  })
}

export async function deleteQuotationApi(id: string) {
  return fetchAPI<{ success: boolean }>(`/api/quotations/${id}`, {
    method: "DELETE",
  })
}

// Service Orders
export async function getServiceOrdersApi() {
  return fetchAPI<ServiceOrder[]>("/api/service-orders")
}

export async function getServiceOrderApi(id: string) {
  return fetchAPI<ServiceOrder>(`/api/service-orders/${id}`)
}

export async function createServiceOrderApi(
  order: Omit<ServiceOrder, "id" | "createdAt" | "updatedAt" | "client" | "gestor" | "items"> & {
    items: Omit<ServiceOrderItem, "id" | "serviceOrderId">[]
  },
) {
  return fetchAPI<ServiceOrder>("/api/service-orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(order),
  })
}

export async function updateServiceOrderApi(id: string, order: Partial<ServiceOrder>) {
  return fetchAPI<ServiceOrder>(`/api/service-orders/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(order),
  })
}

export async function deleteServiceOrderApi(id: string) {
  return fetchAPI<{ success: boolean }>(`/api/service-orders/${id}`, {
    method: "DELETE",
  })
}

// Purchase Orders
export async function getPurchaseOrdersApi() {
  return fetchAPI<PurchaseOrder[]>("/api/purchase-orders")
}

export async function getPurchaseOrderApi(id: string) {
  return fetchAPI<PurchaseOrder>(`/api/purchase-orders/${id}`)
}

export async function createPurchaseOrderApi(
  order: Omit<PurchaseOrder, "id" | "createdAt" | "updatedAt" | "client" | "items"> & {
    items: Omit<PurchaseOrderItem, "id" | "purchaseOrderId">[]
  },
) {
  return fetchAPI<PurchaseOrder>("/api/purchase-orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(order),
  })
}

export async function updatePurchaseOrderApi(id: string, order: Partial<PurchaseOrder>) {
  return fetchAPI<PurchaseOrder>(`/api/purchase-orders/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(order),
  })
}

export async function deletePurchaseOrderApi(id: string) {
  return fetchAPI<{ success: boolean }>(`/api/purchase-orders/${id}`, {
    method: "DELETE",
  })
}

// Users
export async function getUsersApi() {
  return fetchAPI<User[]>("/api/users")
}

export async function getUserApi(id: string) {
  return fetchAPI<Omit<User, "password">>(`/api/users/${id}`)
}

export async function createUserApi(user: Omit<User, "id" | "createdAt" | "updatedAt">) {
  return fetchAPI<Omit<User, "password">>("/api/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  })
}

export async function updateUserApi(id: string, user: Partial<User>) {
  return fetchAPI<Omit<User, "password">>(`/api/users/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  })
}

export async function deleteUserApi(id: string) {
  return fetchAPI<{ success: boolean }>(`/api/users/${id}`, {
    method: "DELETE",
  })
}

// Import types
import type {
  Client,
  Equipment,
  Quotation,
  QuotationItem,
  ServiceOrder,
  ServiceOrderItem,
  PurchaseOrder,
  PurchaseOrderItem,
  User,
} from "@/types"

