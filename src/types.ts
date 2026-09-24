/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- Required Billing / Time Tracking Types ---
export interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  hourlyRate: number;
  currency: string;
}

export interface TimeEntry {
  id: string;
  clientId: string;
  description: string;
  durationMinutes: number;
  hourlyRate: number;
  isBilled: boolean;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  items: InvoiceItem[];
}

export type TabType = 'dashboard' | 'operations' | 'records' | 'settings';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

// --- Required Desayunos Cony Restaurant Types ---
export interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image: string;
  hidden?: boolean; // Si true, el platillo se oculta del menú para los comensales
  order?: number;
  options?: {
    title: string;
    choices: string[];
    multiselect: boolean;
  }[];
  extras?: {
    name: string;
    price: number;
  }[];
  extrasMultiselect?: boolean; // Si true permite múltiples extras, si false selección única (máximo 1)
}

export interface RestoClient {
  id: string;
  phone: string;
  name: string;
  address: string;
  orderCount: number;
  totalSpent: number;
  tier: 'frecuente' | 'honor' | 'estrella' | 'nuevo';
}

export interface Expense {
  id: string;
  concept: string;
  amount: number;
  date: string;
}

export interface Coupon {
  id: string;
  code: string; // e.g. "CONYLOVE10", uppercase
  discountPercentage: number; // Percentage discount, e.g. 10 for 10%
  description: string;
  minPurchase?: number; // Minimum order subtotal in MXN to apply
  isActive: boolean;
  targetTier?: 'all' | 'estrella' | 'honor' | 'frecuente' | 'nuevo';
  createdAt?: string;
}

export interface FoodOrder {
  id: string;
  orderNumber: string;
  clientName: string;
  clientPhone: string;
  deliveryType: 'domicilio' | 'local';
  address?: string;
  notes?: string;
  items: {
    itemId: string;
    name: string;
    quantity: number;
    price: number;
    selectedOptions: { [key: string]: string[] };
    selectedExtras: { name: string; price: number }[];
  }[];
  subtotal: number;
  couponCode?: string;
  discountPercentage?: number;
  discountAmount?: number;
  deliveryFee: number;
  tip: number;
  total: number;
  paymentMethod: 'efectivo' | 'transferencia';
  status: 'recibido' | 'preparando' | 'listo' | 'camino' | 'entregado' | 'cancelado';
  createdAt: string; // ISO string
  slaLimitTime: string; // ISO string
  isGolden?: boolean;
}

export interface BusinessConfig {
  whatsappPhone: string;
  deliveryPhone?: string; // Teléfono móvil/WhatsApp del repartidor/mensajero
  scheduleStart: string; // e.g. "07:30"
  scheduleEnd: string; // e.g. "13:30"
  isOpenManual: boolean;
  is24Hours?: boolean;
  ticketFooter: string;
  deliveryFee: number;
  brandLogo: string;
  suggestedTip?: number;
  defaultOpeningStock?: number; // Porciones de apertura de platillos configurables por el dueño
  businessName?: string;
  slogan?: string;
  address?: string;
  themeColor?: string;
}
