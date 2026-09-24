/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client, TimeEntry, Invoice, FoodItem, RestoClient, FoodOrder, Expense, BusinessConfig, Coupon } from '../types';

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

// --- BM Desayunos Cony Restaurant Menu Seeds ---

export const INITIAL_FOOD_ITEMS: FoodItem[] = [
  {
    id: 'bm-chilaquiles-pollo-huevo',
    name: 'Chilaquiles Tradicionales con Pollo o Huevo',
    description: 'Totopos crujientes bañados en salsa verde o roja artesanal bien sazonada. Servidos con crema, queso, cebolla y un pan bolillo crujiente.',
    price: 50.00,
    category: 'Desayunos',
    stock: 30,
    order: 0,
    image: 'https://images.unsplash.com/photo-1626500155554-7389ee767353?auto=format&fit=crop&q=80&w=600',
    options: [
      {
        title: 'Salsa',
        choices: ['Salsa Verde 🟢', 'Salsa Roja 🔴'],
        multiselect: false
      },
      {
        title: 'Proteína',
        choices: ['Con Pollo Deshebrado 🍗', 'Con Huevo Estrellado 🍳', 'Con Huevo Revuelto'],
        multiselect: false
      },
      {
        title: 'Preparación',
        choices: ['Con Crema', 'Sin Crema', 'Con Queso', 'Sin Queso', 'Con Cebolla', 'Sin Cebolla 🧅', 'Crema y Queso Aparte 🥛'],
        multiselect: true
      },
      {
        title: 'Acompañamiento',
        choices: ['Con un pan (Bolillo) 🥖', 'Sin pan'],
        multiselect: false
      }
    ],
    extras: [
      { name: 'Huevo Estrellado Extra 🍳', price: 15.00 },
      { name: 'Pollo Deshebrado Extra 🍗', price: 20.00 },
      { name: 'Queso Cotija Extra 🧀', price: 10.00 }
    ]
  },
  {
    id: 'bm-chilaquiles-milanesa-bistec',
    name: 'Chilaquiles Tradicionales con Milanesa o Bistec',
    description: 'Totopos crujientes bañados en salsa verde o roja sazonada al momento, acompañados con milanesa dorada o tierno bistec. Servidos con crema, queso, cebolla y un pan.',
    price: 55.00,
    category: 'Desayunos',
    stock: 25,
    order: 1,
    image: 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?auto=format&fit=crop&q=80&w=600',
    options: [
      {
        title: 'Salsa',
        choices: ['Salsa Verde 🟢', 'Salsa Roja 🔴'],
        multiselect: false
      },
      {
        title: 'Carne',
        choices: ['Con Milanesa Doradita 🥩', 'Con Bistec Tierno 🥩'],
        multiselect: false
      },
      {
        title: 'Preparación',
        choices: ['Con Crema', 'Sin Crema', 'Con Queso', 'Sin Queso', 'Con Cebolla', 'Sin Cebolla 🧅', 'Crema y Queso Aparte 🥛'],
        multiselect: true
      },
      {
        title: 'Acompañamiento',
        choices: ['Con un pan (Bolillo) 🥖', 'Sin pan'],
        multiselect: false
      }
    ],
    extras: [
      { name: 'Huevo Estrellado Extra 🍳', price: 15.00 },
      { name: 'Porción de Carne Extra 🥩', price: 25.00 }
    ]
  },
  {
    id: 'bm-huevos-al-gusto-solo',
    name: 'Huevos al Gusto (2 piezas) - Solo',
    description: 'Dos blanquillos preparados al momento como tú los prefieras: revueltos o estrellados. Acompañados con frijoles refritos caseros.',
    price: 40.00,
    category: 'Desayunos',
    stock: 35,
    order: 2,
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=600',
    options: [
      {
        title: 'Término del Huevo',
        choices: ['Estrellados Tiernos 🍳', 'Estrellados Bien Cocidos', 'Revueltos al Comal'],
        multiselect: false
      },
      {
        title: 'Frijoles Refritos',
        choices: ['Con frijoles refritos', 'Frijoles aparte', 'Sin frijoles'],
        multiselect: false
      },
      {
        title: 'Salsa de Mesa',
        choices: ['Salsa Verde 🟢', 'Salsa Roja 🔴', 'Sin Salsa'],
        multiselect: false
      }
    ],
    extras: [
      { name: 'Bolillo Calientito Adicional 🥖', price: 8.00 },
      { name: 'Queso Fresco sobre Frijolitos 🧀', price: 10.00 }
    ]
  },
  {
    id: 'bm-huevos-al-gusto-ingrediente',
    name: 'Huevos al Gusto con Ingrediente (2 piezas)',
    description: 'Dos piezas de huevo al momento combinados con tu ingrediente favorito: salchicha, jamón, tocino o longaniza. Acompañados con frijoles refritos caseros.',
    price: 45.00,
    category: 'Desayunos',
    stock: 30,
    order: 3,
    image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&q=80&w=600',
    options: [
      {
        title: 'Ingrediente Principal',
        choices: ['Con Salchicha', 'Con Jamón', 'Con Tocino Doradito 🥓', 'Con Longaniza de la Casa'],
        multiselect: false
      },
      {
        title: 'Término',
        choices: ['Revueltos con el ingrediente', 'Estrellados con el ingrediente aparte'],
        multiselect: false
      },
      {
        title: 'Frijoles Refritos',
        choices: ['Con frijoles refritos', 'Frijoles aparte', 'Sin frijoles'],
        multiselect: false
      }
    ],
    extras: [
      { name: 'Huevo Extra (3era pieza) 🍳', price: 15.00 },
      { name: 'Bolillo Adicional 🥖', price: 8.00 }
    ]
  },
  {
    id: 'bm-enchiladas-verdes',
    name: 'Enchiladas Verdes (4 piezas)',
    description: 'Cuatro tortillas de maíz pasadas por comal rellenas de pollo deshebrado, bañadas en salsa verde esmeralda sazonada. Servidas con pollo, crema, queso, cebolla y un pan.',
    price: 45.00,
    category: 'Desayunos',
    stock: 25,
    order: 4,
    image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&q=80&w=600',
    options: [
      {
        title: 'Preparación',
        choices: ['Con Crema', 'Sin Crema', 'Con Queso', 'Sin Queso', 'Con Cebolla', 'Sin Cebolla 🧅'],
        multiselect: true
      },
      {
        title: 'Acompañamiento',
        choices: ['Con un pan (Bolillo) 🥖', 'Sin pan'],
        multiselect: false
      }
    ],
    extras: [
      { name: 'Pollo Deshebrado Extra 🍗', price: 20.00 },
      { name: 'Queso Gratinado Extra 🧀', price: 12.00 }
    ]
  },
  {
    id: 'bm-enchiladas-mole',
    name: 'Enchiladas de Mole (4 piezas)',
    description: 'Cuatro tortillas rellenas de pollo suave, bañadas en delicioso mole tradicional artesanal con toque de ajonjolí. Servidas con pollo, crema, queso, cebolla y un pan.',
    price: 55.00,
    category: 'Desayunos',
    stock: 20,
    order: 5,
    image: 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?auto=format&fit=crop&q=80&w=600',
    options: [
      {
        title: 'Preparación',
        choices: ['Con Crema', 'Sin Crema', 'Con Queso', 'Sin Queso', 'Con Cebolla', 'Sin Cebolla 🧅'],
        multiselect: true
      },
      {
        title: 'Acompañamiento',
        choices: ['Con un pan (Bolillo) 🥖', 'Sin pan'],
        multiselect: false
      }
    ],
    extras: [
      { name: 'Pollo Deshebrado Extra 🍗', price: 20.00 },
      { name: 'Bolillo Adicional 🥖', price: 8.00 }
    ]
  },
  {
    id: 'bm-cuernito-tradicional',
    name: 'Cuernito Tradicional',
    description: 'Cuernito hojaldrado tostadito a la plancha con mantequilla, relleno de jamón y quesillo derretido que hace hebra al primer mordisco.',
    price: 35.00,
    category: 'Antojitos',
    stock: 25,
    order: 6,
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=600',
    options: [
      {
        title: 'Preparación',
        choices: ['Con Mayonesa', 'Sin Mayonesa', 'Con Chiles en Vinagre', 'Chiles Aparte', 'Sin Picante'],
        multiselect: true
      }
    ],
    extras: [
      { name: 'Quesillo Extra 🧀', price: 10.00 },
      { name: 'Jamón Adicional', price: 8.00 }
    ]
  },
  {
    id: 'bm-sincronizada-tradicional',
    name: 'Sincronizada Tradicional',
    description: 'Doble tortilla de harina doradita al comal hasta quedar crujiente, rellena de jamón y quesillo fundido. Acompañada con jamón, quesillo y pico de gallo.',
    price: 30.00,
    category: 'Antojitos',
    stock: 30,
    order: 7,
    image: 'https://images.unsplash.com/photo-1618040996337-56904b7850b9?auto=format&fit=crop&q=80&w=600',
    options: [
      {
        title: 'Pico de Gallo',
        choices: ['Con Pico de Gallo Fresco 🍅', 'Pico de Gallo Aparte', 'Sin Pico de Gallo'],
        multiselect: false
      },
      {
        title: 'Salsa',
        choices: ['Salsa Verde 🟢', 'Salsa Roja 🔴', 'Sin Salsa'],
        multiselect: false
      }
    ],
    extras: [
      { name: 'Quesillo Extra Fundido 🧀', price: 10.00 }
    ]
  },
  {
    id: 'bm-molletes-jamon',
    name: 'Molletes de Jamón Quesillo (2 piezas)',
    description: 'Dos mitades de bolillo crujiente untadas con frijolitos refritos caseros y abundante quesillo gratinado al punto dorado. Acompañados con pico de gallo.',
    price: 35.00,
    category: 'Antojitos',
    stock: 25,
    order: 8,
    image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&q=80&w=600',
    options: [
      {
        title: 'Pico de Gallo',
        choices: ['Con Pico de Gallo 🍅', 'Pico de Gallo Aparte', 'Sin Pico de Gallo'],
        multiselect: false
      },
      {
        title: 'Término',
        choices: ['Bien Doraditos al Comal 🥖', 'Término Suave'],
        multiselect: false
      }
    ],
    extras: [
      { name: 'Queso Extra Gratinado 🧀', price: 10.00 }
    ]
  },
  {
    id: 'bm-molletes-salchicha-pierna',
    name: 'Molletes con Salchicha o Pierna (2 piezas)',
    description: 'Dos mitades de bolillo con base de frijolitos refritos caseros, queso derretido y tu guisado de salchicha o pierna. Acompañados con pico de gallo.',
    price: 40.00,
    category: 'Antojitos',
    stock: 20,
    order: 9,
    image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&q=80&w=600',
    options: [
      {
        title: 'Guisado de Mollete',
        choices: ['Con Salchicha Dorada', 'Con Pierna Adobada'],
        multiselect: false
      },
      {
        title: 'Pico de Gallo',
        choices: ['Con Pico de Gallo 🍅', 'Pico de Gallo Aparte', 'Sin Pico de Gallo'],
        multiselect: false
      }
    ],
    extras: [
      { name: 'Huevo Estrellado Arriba 🍳', price: 15.00 },
      { name: 'Queso Extra 🧀', price: 10.00 }
    ]
  },
  {
    id: 'bm-hotdogs-tocino',
    name: 'Hotdogs con Tocino',
    description: 'Salchicha envuelta con tocino dorado, montada en pan suave al vapor con mayonesa, jitomate, cebolla, cátsup, mostaza, rajas o chipotle.',
    price: 25.00,
    category: 'Antojitos',
    stock: 35,
    order: 10,
    image: 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?auto=format&fit=crop&q=80&w=600',
    options: [
      {
        title: 'Picante',
        choices: ['Con Rajas en Escabeche 🌶️', 'Con Chipotle', 'Sin Picante'],
        multiselect: false
      },
      {
        title: 'Aderezos y Verdura',
        choices: ['Con Todo (Mayonesa, Catsup, Mostaza, Jitomate, Cebolla)', 'Sin Cebolla 🧅', 'Sin Mostaza', 'Solo Mayonesa y Catsup'],
        multiselect: true
      }
    ],
    extras: [
      { name: 'Salchicha con Tocino Extra 🥓', price: 15.00 }
    ]
  },
  {
    id: 'bm-torta-clasica',
    name: 'Torta Tradicional (Jamón, Salchicha, Pierna o Huevo Solo)',
    description: 'Telera tostadita en comal con mayonesa, frijolitos refritos caseros untados, quesillo derretido, jitomate, cebolla y tu guisado favorito caliente.',
    price: 35.00,
    category: 'Tortas y Sándwiches',
    stock: 30,
    order: 11,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600',
    options: [
      {
        title: 'Relleno de Torta',
        choices: ['Torta de Jamón', 'Torta de Salchicha', 'Torta de Pierna', 'Torta de Huevo Solo'],
        multiselect: false
      },
      {
        title: 'Picante',
        choices: ['Con Rajas en Vinagre', 'Con Chipotle', 'Sin Picante'],
        multiselect: false
      },
      {
        title: 'Ingredientes al Gusto',
        choices: ['Con Todo (Frijoles, Mayonesa, Jitomate, Cebolla)', 'Sin Cebolla 🧅', 'Sin Mayonesa', 'Sin Frijoles'],
        multiselect: true
      }
    ],
    extras: [
      { name: 'Quesillo Extra Fundido 🧀', price: 10.00 }
    ]
  },
  {
    id: 'bm-torta-milanesa-huevo-preparado',
    name: 'Torta de Milanesa (Res/Pollo) o Huevo Preparado',
    description: 'Telera bien servida en comal con mayonesa, frijoles, quesillo fundido, jitomate, cebolla y tu elección de milanesa de res, pollo o huevo con guisado.',
    price: 40.00,
    category: 'Tortas y Sándwiches',
    stock: 25,
    order: 12,
    image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&q=80&w=600',
    options: [
      {
        title: 'Relleno Especial',
        choices: ['Milanesa de Res 🥩', 'Milanesa de Pollo 🍗', 'Huevo con Salchicha', 'Huevo con Jamón', 'Huevo con Tocino 🥓', 'Huevo con Longaniza'],
        multiselect: false
      },
      {
        title: 'Picante',
        choices: ['Con Rajas en Vinagre', 'Con Chipotle', 'Sin Picante'],
        multiselect: false
      },
      {
        title: 'Ingredientes al Gusto',
        choices: ['Con Todo (Frijoles, Mayonesa, Jitomate, Cebolla)', 'Sin Cebolla 🧅', 'Sin Mayonesa'],
        multiselect: true
      }
    ],
    extras: [
      { name: 'Quesillo Extra Fundido 🧀', price: 10.00 }
    ]
  },
  {
    id: 'bm-sandwich-clasico',
    name: 'Sándwich Clásico (Jamón, Salchicha, Pierna o Huevo Solo)',
    description: 'Pan de caja tostado a la plancha con mantequilla, mayonesa, quesillo derretido y jitomate fresco. Tostadito, ligero y llenador.',
    price: 30.00,
    category: 'Tortas y Sándwiches',
    stock: 30,
    order: 13,
    image: 'https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&q=80&w=600',
    options: [
      {
        title: 'Relleno de Sándwich',
        choices: ['Sándwich de Jamón', 'Sándwich de Salchicha', 'Sándwich de Pierna', 'Sándwich de Huevo Solo'],
        multiselect: false
      },
      {
        title: 'Preparación',
        choices: ['Con Todo (Mayonesa, Jitomate, Quesillo)', 'Sin Mayonesa', 'Sin Jitomate', 'Bien Tostado 🍞'],
        multiselect: true
      },
      {
        title: 'Picante',
        choices: ['Chiles aparte', 'Sin chiles'],
        multiselect: false
      }
    ],
    extras: [
      { name: 'Queso Extra 🧀', price: 8.00 }
    ]
  },
  {
    id: 'bm-sandwich-milanesa-huevo-preparado',
    name: 'Sándwich de Milanesa (Res/Pollo) o Huevo Preparado',
    description: 'Pan blanco tostado a la plancha con mantequilla, quesillo fundido, jitomate fresco y tu proteína favorita: milanesa tierna o huevo preparado.',
    price: 35.00,
    category: 'Tortas y Sándwiches',
    stock: 25,
    order: 14,
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=600',
    options: [
      {
        title: 'Relleno Especial',
        choices: ['Milanesa de Res 🥩', 'Milanesa de Pollo 🍗', 'Huevo con Salchicha', 'Huevo con Jamón', 'Huevo con Tocino 🥓', 'Huevo con Longaniza'],
        multiselect: false
      },
      {
        title: 'Preparación',
        choices: ['Con Todo (Mayonesa, Jitomate, Quesillo)', 'Sin Mayonesa', 'Sin Jitomate'],
        multiselect: true
      }
    ],
    extras: [
      { name: 'Queso Extra 🧀', price: 8.00 }
    ]
  },
  {
    id: 'bm-licuado-medio-litro',
    name: 'Licuado Natural (1/2 Litro)',
    description: 'Cremoso vaso de 500ml preparado al instante con leche fría y fruta 100% natural. Sabores: Plátano, Fresa, Mamey, Guayaba, Avena, Granola, Chocolate.',
    price: 35.00,
    category: 'Bebidas',
    stock: 40,
    order: 15,
    image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&q=80&w=600',
    options: [
      {
        title: 'Sabor a Elegir',
        choices: ['Plátano 🍌', 'Fresa 🍓', 'Mamey 🧡', 'Guayaba', 'Avena 🌾', 'Granola', 'Chocolate 🍫'],
        multiselect: false
      },
      {
        title: 'Endulzante',
        choices: ['Normal (Dulce Tradicional)', 'Poco Dulce', 'Sin Azúcar'],
        multiselect: false
      }
    ],
    extras: [
      { name: 'Avena Extra 🌾', price: 5.00 },
      { name: 'Granola y Miel 🍯', price: 8.00 }
    ]
  },
  {
    id: 'bm-licuado-litro',
    name: 'Licuado Natural (1 Litro)',
    description: 'Vaso grande de 1 Litro de licuado cremoso y bien frío con fruta natural y leche fresca. ¡La mejor energía para tu mañana!',
    price: 55.00,
    category: 'Bebidas',
    stock: 30,
    order: 16,
    image: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&q=80&w=600',
    options: [
      {
        title: 'Sabor a Elegir',
        choices: ['Plátano 🍌', 'Fresa 🍓', 'Mamey 🧡', 'Guayaba', 'Avena 🌾', 'Granola', 'Chocolate 🍫', 'Combinado (2 frutas)'],
        multiselect: false
      },
      {
        title: 'Endulzante',
        choices: ['Normal (Dulce Tradicional)', 'Poco Dulce', 'Sin Azúcar'],
        multiselect: false
      }
    ],
    extras: [
      { name: 'Extra Granola y Miel 🍯', price: 8.00 },
      { name: 'Cucharada de Avena 🌾', price: 5.00 }
    ]
  },
  {
    id: 'bm-cafe-de-olla',
    name: 'Café de Olla Tradicional',
    description: 'Café de grano aromático hervido a fuego lento con canela en raja y piloncillo. Calientito, reconfortante y con el auténtico sazón de casa.',
    price: 18.00,
    category: 'Bebidas',
    stock: 50,
    order: 17,
    image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&q=80&w=600',
    options: [
      {
        title: 'Dulzor y Preparación',
        choices: ['Dulzor Tradicional con Piloncillo 🍯', 'Menos Dulce', 'Con un toque de leche 🥛'],
        multiselect: false
      }
    ],
    extras: [
      { name: 'Tamaño Grande (+$4.00) ☕', price: 4.00 }
    ]
  },
  {
    id: 'bm-cafe-especialidad',
    name: 'Café de Especialidad (Capuchino, Vainilla, Latte, Moka)',
    description: 'Café espresso con leche cremada y espuma aterciopelada en tu sabor favorito: Capuchino, Vainilla, Latte o Moka.',
    price: 22.00,
    category: 'Bebidas',
    stock: 40,
    order: 18,
    image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&q=80&w=600',
    options: [
      {
        title: 'Especialidad',
        choices: ['Capuchino Clásico ☕', 'Vainilla Aromática', 'Latte Suave 🥛', 'Moka Chocolatero 🍫'],
        multiselect: false
      },
      {
        title: 'Toque Final',
        choices: ['Con Canela en Polvo', 'Con Cacao / Chocolate', 'Sin Espolvorear'],
        multiselect: false
      }
    ],
    extras: [
      { name: 'Tamaño Grande (+$4.00) ☕', price: 4.00 }
    ]
  },
  {
    id: 'bm-hotcakes',
    name: 'Hotcakes Esponjosos (3 piezas)',
    description: 'Tres piezas esponjosas recién salidas de la plancha, servidas con mantequilla y bañadas con tus toppings favoritos: mermeladas, lechera, maple, nutella.',
    price: 45.00,
    category: 'Para Endulzar el Día',
    stock: 25,
    order: 19,
    image: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&q=80&w=600',
    options: [
      {
        title: 'Toppings a Elegir',
        choices: ['Miel Maple 🍁', 'Lechera 🥛', 'Nutella 🍫', 'Mermelada de Fresa 🍓', 'Miel Maple + Lechera', 'Nutella + Lechera'],
        multiselect: false
      },
      {
        title: 'Presentación',
        choices: ['Bañados en el plato', 'Toppings por separado en vasito'],
        multiselect: false
      }
    ],
    extras: [
      { name: 'Porción de Mantequilla Extra', price: 5.00 },
      { name: 'Topping Adicional Extra', price: 10.00 }
    ]
  },
  {
    id: 'bm-coctel-fruta',
    name: 'Coctel de Fruta Fresca',
    description: 'Tazón de fruta fresca seleccionada de temporada picada al momento. Acompañado con miel, granola y chantilly.',
    price: 50.00,
    category: 'Para Endulzar el Día',
    stock: 20,
    order: 20,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600',
    options: [
      {
        title: 'Acompañamientos',
        choices: ['Con Todo (Miel, Granola y Chantilly)', 'Sin Chantilly', 'Sin Miel 🍯', 'Sin Granola 🌾', 'Todo en recipientes por separado'],
        multiselect: false
      }
    ],
    extras: [
      { name: 'Chantilly Extra', price: 8.00 },
      { name: 'Granola y Miel Extra 🍯', price: 10.00 }
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
  whatsappPhone: '525511358258', // Teléfono BM Desayunos Cony 55-1135-8258
  deliveryPhone: '525511358258',
  scheduleStart: '08:00',
  scheduleEnd: '12:00',
  isOpenManual: true,
  is24Hours: false,
  ticketFooter: '¡Gracias por desayunar en BM Desayunos Cony! Preparaciones al momento con sabor de hogar. ♥️',
  deliveryFee: 15.00,
  suggestedTip: 10.00,
  defaultOpeningStock: 25,
  brandLogo: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200',
  businessName: 'BM Desayunos Cony',
  slogan: 'Preparaciones al momento',
  address: 'Servicio a Domicilio y Local (WhatsApp: 55-1135-8258)',
  themeColor: '#f59e0b'
};

export const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'coup-1',
    code: 'CONYLOVE10',
    discountPercentage: 10,
    description: '10% de descuento en todo tu desayuno al comal',
    minPurchase: 80,
    isActive: true,
    targetTier: 'all',
    createdAt: '2026-09-01T08:00:00Z'
  },
  {
    id: 'coup-2',
    code: 'VIPCONY15',
    discountPercentage: 15,
    description: '15% de descuento exclusivo para Comensales VIP y Clientes Frecuentes',
    minPurchase: 120,
    isActive: true,
    targetTier: 'estrella',
    createdAt: '2026-09-01T08:00:00Z'
  },
  {
    id: 'coup-3',
    code: 'DESAYUNO20',
    discountPercentage: 20,
    description: '20% de bienvenida en tu primera orden',
    minPurchase: 100,
    isActive: true,
    targetTier: 'nuevo',
    createdAt: '2026-09-01T08:00:00Z'
  }
];
