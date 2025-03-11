export enum PaymentMethod {
  EFECTIVO = "EFECTIVO",
  TRANSFERENCIA = "TRANSFERENCIA",
  CREDITO = "CREDITO",
}

export enum Currency {
  PEN = "PEN",
  USD = "USD",
}

export enum EquipmentStatus {
  BUENO = "BUENO",
  REGULAR = "REGULAR",
  MALO = "MALO",
}

export enum QuotationStatus {
  DRAFT = "DRAFT",
  SENT = "SENT",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED",
}

export enum ServiceOrderStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum PurchaseOrderStatus {
  DRAFT = "DRAFT",
  SENT = "SENT",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  RECEIVED = "RECEIVED",
}

export interface Client {
  id: string
  name: string
  ruc: string
  address: string
  email: string
  contactPerson?: string
  creditLine?: number
  paymentMethod?: PaymentMethod
  startDate?: Date
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

export type EquipmentComponents = {
  [key: string]: string
}

export interface Equipment {
  id: string
  name: string
  type: string
  code: string
  description: string
  components?: EquipmentComponents
  status: EquipmentStatus
  isCalibrated?: boolean
  calibrationDate?: Date
  serialNumber?: string
  observations?: string
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

export interface QuotationItem {
  id: string
  quotationId: string
  description: string
  code: string
  quantity: number
  days: number
  unitPrice: number
  name: string
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

export interface Quotation {
  id: string
  number: string
  date: Date
  clientId: string
  client: Client
  currency: Currency
  equipmentReleaseDate: Date
  items: QuotationItem[]
  subtotal: number
  igv: number
  total: number
  validityDays: number
  status: QuotationStatus
  notes?: string
  considerDays?: number
  returnDate?: Date
  monitoringLocation?: string
  creditLine?: number
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

export interface ServiceOrderItem {
  id: string
  serviceOrderId: string
  code: string
  description: string
  quantity: number
  unitPrice: number
  days?: number
  name: string
  total?: number // Calculated field for UI
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}

export interface ServiceOrder {
  id: string
  number: string
  date: Date
  clientId: string
  client: Client
  description?: string
  currency: Currency
  paymentTerms?: string
  gestorId: string
  gestor: User
  attendantName?: string
  items: ServiceOrderItem[]
  subtotal: number
  igv: number
  total: number
  comments?: string
  status: ServiceOrderStatus
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

export type User = {
  id: string
  name: string
  email: string
  password?: string // Hacemos el password opcional
  position?: string
  department?: string
  role?: string
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

export interface PurchaseOrderItem {
  id: string
  code: string
  purchaseOrderId: string
  description: string
  quantity: number
  unitPrice: number
  name: string
  total?: number // Calculated field for UI
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}

export interface PurchaseOrder {
  id: string
  number: string
  date: Date
  clientId: string
  client: Client
  description?: string
  currency: Currency
  paymentTerms?: string
  gestorId: string
  gestor: User
  attendantName?: string
  items: PurchaseOrderItem[]
  subtotal: number
  igv: number
  total: number
  comments?: string
  status: PurchaseOrderStatus
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

export interface Company {
  id: string
  name: string
  ruc: string
  address: string
  email: string
  phone: string
  logo?: string
}

export interface BankAccount {
  id: string
  companyId: string
  bankName: string
  accountNumber: string
  accountType: string
  currency: Currency
  isDefault: boolean
}

