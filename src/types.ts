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
  scheduleStart: string; // e.g. "07:30"
  scheduleEnd: string; // e.g. "13:30"
  isOpenManual: boolean;
  ticketFooter: string;
  deliveryFee: number;
  brandLogo: string;
}
