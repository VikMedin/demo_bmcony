/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client, TimeEntry, Invoice, FoodItem, RestoClient, FoodOrder, Expense, BusinessConfig } from '../types';

// --- Required Billing / Time Tracking Seeds ---
export const INITIAL_CLIENTS: Client[] = [
  { id: 'c1', name: 'Laura Martínez', email: 'laura@acme.com', company: 'Acme Design Corp', hourlyRate: 65, currency: 'USD' },
  { id: 'c2', name: 'Carlos Gómez', email: 'carlos@techsoft.io', company: 'TechSoft Solutions', hourlyRate: 80, currency: 'USD' },
  { id: 'c3', name: 'Elena Rostova', email: 'elena@creative.net', company: 'Creative Agency', hourlyRate: 50, currency: 'EUR' }
];

export const INITIAL_TIME_ENTRIES: TimeEntry[] = [
  { id: 't1', clientId: 'c1', description: 'Rediseño de Landing Page en Figma', durationMinutes: 180, hourlyRate: 65, isBilled: false, createdAt: '2026-08-15T10:00:00Z' },
  { id: 't2', clientId: 'c2', description: 'Integración API Stripe y Middleware', durationMinutes: 240, hourlyRate: 80, isBilled: true, createdAt: '2026-08-16T14:30:00Z' },
  { id: 't3', clientId: 'c1', description: 'Ajustes UX Mobile y Pruebas', durationMinutes: 90, hourlyRate: 65, isBilled: false, createdAt: '2026-08-17T09:15:00Z' }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-101',
    invoiceNumber: 'INV-2026-001',
    clientId: 'c2',
    clientName: 'TechSoft Solutions',
    issueDate: '2026-08-01',
    dueDate: '2026-08-15',
    subtotal: 320,
    taxRate: 16,
    taxAmount: 51.20,
    total: 371.20,
    status: 'paid',
    items: [
      { id: 'itm-1', description: 'Integración API Stripe y Middleware (4 hrs @ $80/hr)', quantity: 4, unitPrice: 80, amount: 320 }
    ]
  },
  {
    id: 'inv-102',
    invoiceNumber: 'INV-2026-002',
    clientId: 'c1',
    clientName: 'Acme Design Corp',
    issueDate: '2026-08-10',
    dueDate: '2026-08-25',
    subtotal: 195,
    taxRate: 16,
    taxAmount: 31.20,
    total: 226.20,
    status: 'sent',
    items: [
      { id: 'itm-2', description: 'Rediseño de Landing Page en Figma (3 hrs @ $65/hr)', quantity: 3, unitPrice: 65, amount: 195 }
    ]
  }
];

// --- Desayunos Cony Restaurant Seeds ---

export const INITIAL_FOOD_ITEMS: FoodItem[] = [
  {
    id: 'f1',
    name: 'Chilaquiles Cony Especiales',
    description: 'Chilaquiles crujientes con salsa verde o roja artesanal, crema fresca, queso cotija, cebolla morada y frijoles refritos a un costado.',
    price: 95.00,
    category: 'Chilaquiles',
    stock: 25,
    order: 0,
    image: 'https://images.unsplash.com/photo-1626500155554-7389ee767353?auto=format&fit=crop&q=80&w=600',
    options: [
      {
        title: 'Salsa',
        choices: ['Salsa Verde 🟢', 'Salsa Roja 🔴', 'Salsa Campechana (Mitad y Mitad) 🤝'],
        multiselect: false
      },
      {
        title: 'Preparación',
        choices: ['Con Cebolla', 'Sin Cebolla 🧅', 'Crema y Queso Aparte 🥛'],
        multiselect: true
      }
    ],
    extras: [
      { name: 'Huevo Estrellado Extra 🍳', price: 15.00 },
      { name: 'Pollo Deshebrado Extra 🍗', price: 25.00 },
      { name: 'Queso Extra 🧀', price: 12.00 }
    ]
  },
  {
    id: 'f2',
    name: 'Huevos Divorciados o al Gusto',
    description: 'Dos huevos estrellados sobre tortilla frita, bañados uno en salsa verde y otro en roja, acompañados de frijoles refritos con totopos.',
    price: 85.00,
    category: 'Huevos',
    stock: 20,
    order: 1,
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=600',
    options: [
      {
        title: 'Término del Huevo',
        choices: ['Tiernos 🍳', 'Bien Cocidos', 'Huevos Revueltos con Jamón', 'Huevos a la Mexicana 🇲🇽'],
        multiselect: false
      }
    ],
    extras: [
      { name: 'Bolillo Adicional 🥖', price: 8.00 },
      { name: 'Porción de Tocino 🥓', price: 20.00 }
    ]
  },
  {
    id: 'f3',
    name: 'Molletes Sencillos con Pico de Gallo',
    description: 'Tres mitades de bolillo crujiente untadas con frijoles refritos de la casa, queso gratinado tipo manchego y pico de gallo fresco al lado.',
    price: 70.00,
    category: 'Antojitos',
    stock: 18,
    order: 2,
    image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&q=80&w=600',
    options: [
      {
        title: 'Modificadores',
        choices: ['Sin Pico de Gallo 🍅', 'Bien Doraditos 🥖'],
        multiselect: true
      }
    ],
    extras: [
      { name: 'Chorizo Extra 🐷', price: 15.00 },
      { name: 'Huevo Extra 🍳', price: 15.00 }
    ]
  },
  {
    id: 'f4',
    name: 'Café de Olla Tradicional',
    description: 'Café aromatizado con canela y piloncillo en olla de barro, receta secreta de Doña Cony.',
    price: 25.00,
    category: 'Bebidas',
    stock: 50,
    order: 3,
    image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&q=80&w=600',
    options: [
      {
        title: 'Endulzante',
        choices: ['Como viene (Dulce Tradicional) 🍯', 'Sin Piloncillo (Negro)', 'Con un toque de leche 🥛'],
        multiselect: false
      }
    ]
  },
  {
    id: 'f5',
    name: 'Licuado Nutritivo de Plátano o Fresa',
    description: 'Licuado fresco preparado al momento con leche entera, canela en polvo y fruta natural.',
    price: 35.00,
    category: 'Bebidas',
    stock: 15,
    order: 4,
    image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&q=80&w=600',
    options: [
      {
        title: 'Sabor',
        choices: ['Plátano 🍌', 'Fresa 🍓', 'Chocomilk 🍫', 'Mixto 🍓🍌'],
        multiselect: false
      },
      {
        title: 'Tipo de Leche',
        choices: ['Leche Entera', 'Leche Deslactosada 🥛', 'Leche de Almendras (+$10) 🌾'],
        multiselect: false
      }
    ],
    extras: [
      { name: 'Avena Extra 🌾', price: 5.00 },
      { name: 'Granola y Miel 🍯', price: 8.00 }
    ]
  }
];

export const INITIAL_RESTO_CLIENTS: RestoClient[] = [
  {
    id: 'c1', phone: '5512345678',
    name: 'Laura Martínez',
    address: 'Av. Juárez #123, Col. Centro, CDMX',
    orderCount: 12,
    totalSpent: 1450.00,
    tier: 'estrella' // VIP (> 10)
  },
  {
    id: 'c2', phone: '5523456789',
    name: 'Carlos Gómez',
    address: 'Calle Pino Suárez #45, Interior 4, Col. Guerrero, CDMX',
    orderCount: 8,
    totalSpent: 850.00,
    tier: 'honor' // Comensal de honor (6-10)
  },
  {
    id: 'c3', phone: '5534567890',
    name: 'Elena Rostova',
    address: 'Paseo de la Reforma #230, Piso 10, CDMX',
    orderCount: 4,
    totalSpent: 380.00,
    tier: 'frecuente' // Frecuente (3-5)
  },
  {
    id: 'c4', phone: '5545678901',
    name: 'Sofía Ruiz',
    address: 'Av. Insurgentes Sur #987, Col. Del Valle, CDMX',
    orderCount: 1,
    totalSpent: 130.00,
    tier: 'nuevo' // Nuevo (<3)
  }
];

// Helper to construct absolute ISO strings for dynamic SLA calculations
const getPastISOTime = (minutesAgo: number) => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - minutesAgo);
  return d.toISOString();
};

export const INITIAL_FOOD_ORDERS: FoodOrder[] = [
  {
    id: 'ord-1',
    orderNumber: 'DC-0001',
    clientName: 'Laura Martínez',
    clientPhone: '5512345678',
    deliveryType: 'domicilio',
    address: 'Av. Juárez #123, Col. Centro, CDMX',
    notes: 'Por favor mandar servilletas y salsa de la que pica mucho.',
    items: [
      {
        itemId: 'f1',
        name: 'Chilaquiles Cony Especiales',
        quantity: 1,
        price: 95.00,
        selectedOptions: { 'Salsa': ['Salsa Verde 🟢'], 'Preparación': ['Con Cebolla'] },
        selectedExtras: [{ name: 'Huevo Estrellado Extra 🍳', price: 15.00 }]
      },
      {
        itemId: 'f4',
        name: 'Café de Olla Tradicional',
        quantity: 1,
        price: 25.00,
        selectedOptions: { 'Endulzante': ['Como viene (Dulce Tradicional) 🍯'] },
        selectedExtras: []
      }
    ],
    subtotal: 135.00,
    deliveryFee: 15.00,
    tip: 10.00,
    total: 160.00,
    paymentMethod: 'transferencia',
    status: 'recibido', // Green SLA because it is 3 min ago
    createdAt: getPastISOTime(3),
    slaLimitTime: getPastISOTime(-17), // 20m from creation
    isGolden: true
  },
  {
    id: 'ord-2',
    orderNumber: 'DC-0002',
    clientName: 'Carlos Gómez',
    clientPhone: '5523456789',
    deliveryType: 'local',
    notes: 'Paso por ellos a las 8:15 AM exacto',
    items: [
      {
        itemId: 'f2',
        name: 'Huevos Divorciados o al Gusto',
        quantity: 1,
        price: 85.00,
        selectedOptions: { 'Término del Huevo': ['Huevos Revueltos con Jamón'] },
        selectedExtras: [{ name: 'Bolillo Adicional 🥖', price: 8.00 }]
      },
      {
        itemId: 'f5',
        name: 'Licuado Nutritivo de Plátano o Fresa',
        quantity: 1,
        price: 35.00,
        selectedOptions: { 'Sabor': ['Plátano 🍌'], 'Tipo de Leche': ['Leche Entera'] },
        selectedExtras: []
      }
    ],
    subtotal: 128.00,
    deliveryFee: 0.00,
    tip: 5.00,
    total: 133.00,
    paymentMethod: 'efectivo',
    status: 'preparando', // Yellow SLA since 13 min ago
    createdAt: getPastISOTime(13),
    slaLimitTime: getPastISOTime(7),
    isGolden: false
  },
  {
    id: 'ord-3',
    orderNumber: 'DC-0003',
    clientName: 'Elena Rostova',
    clientPhone: '5534567890',
    deliveryType: 'domicilio',
    address: 'Paseo de la Reforma #230, Piso 10',
    notes: 'Entregar en recepción a nombre de Elena',
    items: [
      {
        itemId: 'f3',
        name: 'Molletes Sencillos con Pico de Gallo',
        quantity: 1,
        price: 70.00,
        selectedOptions: { 'Modificadores': ['Bien Doraditos 🥖'] },
        selectedExtras: [{ name: 'Chorizo Extra 🐷', price: 15.00 }]
      }
    ],
    subtotal: 85.00,
    deliveryFee: 20.00,
    tip: 10.00,
    total: 115.00,
    paymentMethod: 'efectivo',
    status: 'recibido', // Red SLA since 25 min ago
    createdAt: getPastISOTime(25),
    slaLimitTime: getPastISOTime(19),
    isGolden: false
  },
  {
    id: 'ord-4',
    orderNumber: 'DC-0004',
    clientName: 'Alejandro Cruz',
    clientPhone: '5588776655',
    deliveryType: 'domicilio',
    address: 'Calle Violetas #502, Col. Guerrero, CDMX',
    notes: 'Tocar fuerte timbre blanco de portón gris.',
    items: [
      {
        itemId: 'f1',
        name: 'Chilaquiles Cony Especiales',
        quantity: 1,
        price: 95.00,
        selectedOptions: { 'Salsa': ['Salsa Roja 🔴'], 'Preparación': ['Sin Cebolla 🧅'] },
        selectedExtras: []
      }
    ],
    subtotal: 95.00,
    deliveryFee: 15.00,
    tip: 10.00,
    total: 120.00,
    paymentMethod: 'efectivo',
    status: 'camino', // Only visible for Deliverer (Mensajero)
    createdAt: getPastISOTime(35),
    slaLimitTime: getPastISOTime(5),
    isGolden: false
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  { id: 'exp-1', concept: 'Compra de Jitomate, Cebolla y Cilantro en Central de Abasto', amount: 280.00, date: '2026-09-04' },
  { id: 'exp-2', concept: 'Caja de Huevo Blanco El Calvario (30 Docenas)', amount: 460.00, date: '2026-09-04' },
  { id: 'exp-3', concept: 'Gas LP Tanque de 20kg Suministro', amount: 395.00, date: '2026-09-03' }
];

export const DEFAULT_BUSINESS_CONFIG: BusinessConfig = {
  whatsappPhone: '525512345678', // Default Mexican number
  scheduleStart: '07:30',
  scheduleEnd: '13:30',
  isOpenManual: true,
  ticketFooter: '¡Gracias por desayunar con Doña Cony! Hecho con amor mexicano. ♥️',
  deliveryFee: 15.00,
  brandLogo: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200'
};
