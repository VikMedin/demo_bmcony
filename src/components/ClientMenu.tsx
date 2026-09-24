/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShoppingBag, Plus, Minus, X, Check, Clock, AlertTriangle, MessageSquare } from 'lucide-react';
import { FoodItem, FoodOrder, BusinessConfig } from '../types';

interface ClientMenuProps {
  foodItems: FoodItem[];
  config: BusinessConfig;
  onPlaceOrder: (order: FoodOrder) => void;
  triggerToast: (type: 'success' | 'error' | 'info', title: string, description?: string) => void;
}

export const ClientMenu: React.FC<ClientMenuProps> = ({
  foodItems,
  config,
  onPlaceOrder,
  triggerToast
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [isAdded, setIsAdded] = useState<boolean>(false);
  const [cart, setCart] = useState<{
    item: FoodItem;
    quantity: number;
    selectedOptions: { [key: string]: string[] };
    selectedExtras: { name: string; price: number }[];
    id: string; // unique cart line id
  }[]>([]);

  // Modifiers Modal State
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [modalOptions, setModalOptions] = useState<{ [key: string]: string[] }>({});
  const [modalExtras, setModalExtras] = useState<{ name: string; price: number }[]>([]);

  // Cross Selling State
  const [showCrossSell, setShowCrossSell] = useState<boolean>(false);
  const [crossSellItem, setCrossSellItem] = useState<FoodItem | null>(null);

  // Checkout State
  const [showCheckout, setShowCheckout] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [deliveryType, setDeliveryType] = useState<'domicilio' | 'local'>('domicilio');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia'>('efectivo');

  // Verify Schedule & Manual Switch
  const isCurrentlyOpen = (() => {
    if (!config.isOpenManual) return false;
    
    // Check hours
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    
    const [startH, startM] = config.scheduleStart.split(':').map(Number);
    const [endH, endM] = config.scheduleEnd.split(':').map(Number);
    
    const nowInMinutes = currentHour * 60 + currentMin;
    const startInMinutes = startH * 60 + startM;
    const endInMinutes = endH * 60 + endM;
    
    return nowInMinutes >= startInMinutes && nowInMinutes <= endInMinutes;
  })();

  const sortedFoodItems = [...foodItems].sort((a, b) => {
    const orderA = typeof a.order === 'number' ? a.order : 9999;
    const orderB = typeof b.order === 'number' ? b.order : 9999;
    return orderA - orderB;
  });

  const categories = ['Todos', ...Array.from(new Set(sortedFoodItems.map(f => f.category)))];

  const filteredItems = sortedFoodItems.filter(item => {
    if (activeCategory === 'Todos') return true;
    return item.category === activeCategory;
  });

  const openModifiers = (item: FoodItem) => {
    if (!isCurrentlyOpen) {
      triggerToast('error', 'Establecimiento Cerrado', 'Nuestro comal descansa en este momento.');
      return;
    }
    if (item.stock <= 0) {
      triggerToast('error', 'Platillo Agotado', 'Lo sentimos, ya no quedan porciones disponibles.');
      return;
    }
    setSelectedFood(item);
    setIsAdded(false);
    
    // Pre-select first choice for single-select options
    const initialOps: { [key: string]: string[] } = {};
    if (item.options) {
      item.options.forEach(op => {
        if (!op.multiselect && op.choices.length > 0) {
          initialOps[op.title] = [op.choices[0]];
        } else {
          initialOps[op.title] = [];
        }
      });
    }
    setModalOptions(initialOps);
    setModalExtras([]);
  };

  const handleToggleOption = (title: string, choice: string, multiselect: boolean) => {
    setModalOptions(prev => {
      const current = prev[title] || [];
      if (multiselect) {
        if (current.includes(choice)) {
          return { ...prev, [title]: current.filter(c => c !== choice) };
        } else {
          return { ...prev, [title]: [...current, choice] };
        }
      } else {
        return { ...prev, [title]: [choice] };
      }
    });
  };

  const handleToggleExtra = (extra: { name: string; price: number }) => {
    setModalExtras(prev => {
      if (prev.some(e => e.name === extra.name)) {
        return prev.filter(e => e.name !== extra.name);
      } else {
        return [...prev, extra];
      }
    });
  };

  const addModifiersToCart = () => {
    if (!selectedFood) return;

    // Check if item has options and ensure single selects are filled
    if (selectedFood.options) {
      for (const op of selectedFood.options) {
        if (!op.multiselect && (!modalOptions[op.title] || modalOptions[op.title].length === 0)) {
          triggerToast('error', 'Opción Requerida', `Por favor selecciona una opción para "${op.title}"`);
          return;
        }
      }
    }

    const cartId = `${selectedFood.id}-${Date.now()}`;
    const cartItem = {
      item: selectedFood,
      quantity: 1,
      selectedOptions: modalOptions,
      selectedExtras: modalExtras,
      id: cartId
    };

    setCart(prev => [...prev, cartItem]);
    setIsAdded(true);
    triggerToast('success', 'Agregado al Carrito', `${selectedFood.name} listo en tu orden.`);

    // Trigger cross-selling logic
    // Suggest a sweet beverage or side that isn't currently in the cart
    const coffee = foodItems.find(f => f.id === 'f4'); // Café de olla
    const shake = foodItems.find(f => f.id === 'f5'); // Licuado
    const suggested = coffee || shake;
    
    if (suggested && !cart.some(c => c.item.id === suggested.id) && Math.random() > 0.3) {
      setCrossSellItem(suggested);
      setShowCrossSell(true);
    }
  };

  const handleAddCrossSell = () => {
    if (!crossSellItem) return;
    const cartId = `${crossSellItem.id}-${Date.now()}`;
    setCart(prev => [
      ...prev,
      {
        item: crossSellItem,
        quantity: 1,
        selectedOptions: {},
        selectedExtras: [],
        id: cartId
      }
    ]);
    setShowCrossSell(false);
    setCrossSellItem(null);
    triggerToast('success', 'Sugerencia Agregada', 'Se ha sumado a tu carrito, ¡excelente elección! 🤤');
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart(prev =>
      prev
        .map(c => {
          if (c.id === id) {
            const newQty = c.quantity + delta;
            if (newQty <= 0) return null;
            return { ...c, quantity: newQty };
          }
          return c;
        })
        .filter((c): c is typeof c => c !== null)
    );
  };

  const calculateSubtotal = () => {
    return cart.reduce((acc, c) => {
      const basePrice = c.item.price;
      const extrasPrice = c.selectedExtras.reduce((sum, e) => sum + e.price, 0);
      return acc + (basePrice + extrasPrice) * c.quantity;
    }, 0);
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      triggerToast('error', 'Carrito Vacío', 'Agrega deliciosos platillos antes de ordenar.');
      return;
    }
    if (!customerName || !customerPhone) {
      triggerToast('error', 'Campos Faltantes', 'Tu nombre y teléfono son obligatorios.');
      return;
    }
    if (deliveryType === 'domicilio' && !deliveryAddress) {
      triggerToast('error', 'Dirección requerida', 'Por favor ingresa la dirección para el envío.');
      return;
    }

    const sub = calculateSubtotal();
    const fee = deliveryType === 'domicilio' ? config.deliveryFee : 0;
    const tipVal = 10; // default suggest tip
    const tot = sub + fee + tipVal;

    const newOrder: FoodOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: `DC-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: customerName,
      clientPhone: customerPhone,
      deliveryType,
      address: deliveryType === 'domicilio' ? deliveryAddress : undefined,
      notes,
      items: cart.map(c => ({
        itemId: c.item.id,
        name: c.item.name,
        quantity: c.quantity,
        price: c.item.price,
        selectedOptions: c.selectedOptions,
        selectedExtras: c.selectedExtras
      })),
      subtotal: sub,
      deliveryFee: fee,
      tip: tipVal,
      total: tot,
      paymentMethod,
      status: 'recibido',
      createdAt: new Date().toISOString(),
      slaLimitTime: new Date(Date.now() + 20 * 60 * 1000).toISOString() // 20 min limit
    };

    onPlaceOrder(newOrder);

    // BUILD STRUCTURED WHATSAPP MESSAGE
    const formattedPhone = config.whatsappPhone.replace(/\D/g, '');
    let text = `*☕ DESAYUNOS CONY - NUEVO PEDIDO ☕*\n`;
    text += `===============================\n`;
    text += `👤 *Cliente:* ${customerName}\n`;
    text += `📞 *Teléfono:* ${customerPhone}\n`;
    text += `🛵 *Tipo:* ${deliveryType === 'domicilio' ? 'Entrega a Domicilio 🏡' : 'Retiro en Local 🏪'}\n`;
    if (deliveryType === 'domicilio') {
      text += `📍 *Dirección:* ${deliveryAddress}\n`;
    }
    if (notes) {
      text += `📝 *Notas:* ${notes}\n`;
    }
    text += `===============================\n`;
    text += `🛒 *DETALLE DEL PEDIDO:*\n\n`;

    cart.forEach(c => {
      text += `• ${c.quantity}x *${c.item.name}* ($${c.item.price.toFixed(2)} MXN)\n`;
      Object.entries(c.selectedOptions).forEach(([title, choices]) => {
        if ((choices as string[]).length > 0) {
          text += `   ↳ _${title}:_ ${(choices as string[]).join(', ')}\n`;
        }
      });
      c.selectedExtras.forEach(ex => {
        text += `   ↳ _Extra:_ ${ex.name} (+$${ex.price.toFixed(2)} MXN)\n`;
      });
      text += `\n`;
    });

    text += `===============================\n`;
    text += `💵 *Subtotal:* $${sub.toFixed(2)} MXN\n`;
    if (deliveryType === 'domicilio') {
      text += `🛵 *Envío:* $${fee.toFixed(2)} MXN\n`;
    }
    text += `💖 *Propina sugerida:* $${tipVal.toFixed(2)} MXN\n`;
    text += `💰 *TOTAL A PAGAR:* $${tot.toFixed(2)} MXN\n`;
    text += `💳 *Método:* ${paymentMethod === 'efectivo' ? '💵 Efectivo contra entrega' : '🏦 Transferencia Bancaria'}\n\n`;
    text += `_¡Muchísimas gracias por tu apoyo! En breve confirmaremos tu orden en cocina._ 🍳✨`;

    const encodedText = encodeURIComponent(text);
    const waUrl = `https://wa.me/${formattedPhone}?text=${encodedText}`;

    // Open WhatsApp
    window.open(waUrl, '_blank');

    // Clean Cart & Checkout states
    setCart([]);
    setShowCheckout(false);
    setCustomerName('');
    setCustomerPhone('');
    setDeliveryAddress('');
    setNotes('');

    triggerToast('success', 'Pedido Generado con Éxito', 'Te hemos redirigido a WhatsApp para enviar tu comanda.');
  };

  const totalCartCount = cart.reduce((acc, c) => acc + c.quantity, 0);
  const sub = calculateSubtotal();

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6" id="comensal-view">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-amber-50 border border-amber-200 rounded-2xl p-6 md:p-8 mb-8 flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Cocina Mexicana Tradicional
          </div>
          <h1 className="text-3xl md:text-4xl font-serif text-amber-950 font-bold tracking-tight">
            Desayunos Cony
          </h1>
          <p className="mt-2 text-gray-700 max-w-xl text-sm md:text-base leading-relaxed">
            Ordena tus desayunos favoritos al comal y recíbelos al instante. Pedidos automáticos por WhatsApp, directo, rápido y sin intermediarios.
          </p>
        </div>
        <div className="shrink-0 flex flex-col items-center gap-1.5 bg-white p-4 rounded-xl border border-amber-100 shadow-sm">
          <Clock className="w-5 h-5 text-amber-600" />
          <span className="text-xs text-gray-500 font-medium">Horario de Servicio</span>
          <span className="text-sm font-bold text-amber-950">
            {config.scheduleStart} AM - {config.scheduleEnd} PM
          </span>
          {isCurrentlyOpen ? (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold mt-1">
              Abierto Ahora
            </span>
          ) : (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold mt-1">
              Cerrado
            </span>
          )}
        </div>
      </div>

      {/* Closed Validador Alert */}
      {!isCurrentlyOpen && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-xl mb-8 flex gap-4 items-start shadow-sm">
          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-bold text-amber-950">¡Hola! Nuestro comal descansa hoy</h3>
            <p className="text-sm text-gray-700 mt-1 leading-relaxed">
              Te esperamos de lunes a domingo de <strong className="text-amber-950">7:30 AM a 1:30 PM</strong> para tus desayunos favoritos. En este momento los pedidos de compra están inhabilitados.
            </p>
          </div>
        </div>
      )}

      {/* Categories Tabs & Shopping Bag */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b border-gray-100 pb-4">
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeCategory === cat
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {totalCartCount > 0 && (
          <button
            onClick={() => setShowCheckout(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-transform hover:scale-[1.02]"
          >
            <ShoppingBag className="w-4 h-4" />
            Ver Carrito ({totalCartCount} platillos)
          </button>
        )}
      </div>

      {/* Menu Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {filteredItems.map(item => {
          const isAgotado = item.stock <= 0;
          const hasImage = Boolean(item.image && item.image.trim() !== '');

          return (
            <div
              key={item.id}
              className={`bg-white border rounded-2xl overflow-hidden flex flex-col transition-all hover:shadow-md ${
                isAgotado ? 'opacity-70 border-gray-200' : 'border-gray-200/80'
              }`}
            >
              {hasImage ? (
                <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                  {isAgotado && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                      <span className="px-4 py-1.5 rounded-full bg-rose-600 text-white text-xs font-bold uppercase tracking-wider">
                        Agotado por hoy
                      </span>
                    </div>
                  )}
                  {!isAgotado && item.stock <= 5 && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-white text-[10px] font-bold uppercase">
                        ¡Solo {item.stock} piezas!
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 bg-white/95 px-2.5 py-1 rounded-lg shadow-xs text-xs font-bold text-amber-950">
                    {item.category}
                  </div>
                </div>
              ) : (
                /* Card without photo: only show information, clean layout */
                <div className="px-5 pt-5 pb-1 flex items-center justify-between gap-2">
                  <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 text-xs font-bold border border-amber-200/60">
                    {item.category}
                  </span>
                  {isAgotado ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold uppercase">
                      Agotado por hoy
                    </span>
                  ) : item.stock <= 5 ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">
                      ¡Solo {item.stock} piezas!
                    </span>
                  ) : null}
                </div>
              )}

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-serif font-bold text-lg text-amber-950 leading-tight">
                      {item.name}
                    </h3>
                    <span className="font-bold text-amber-600 shrink-0">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 leading-relaxed line-clamp-3">
                    {item.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between gap-4">
                  <span className="text-[11px] text-gray-400 font-medium">
                    Precios en MXN
                  </span>
                  <button
                    onClick={() => openModifiers(item)}
                    disabled={isAgotado || !isCurrentlyOpen}
                    className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition-colors ${
                      isAgotado || !isCurrentlyOpen
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-amber-100 text-amber-900 hover:bg-amber-500 hover:text-white'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Agregar
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modifiers Modal */}
      {selectedFood && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col animate-scale-up">
            {isAdded ? (
              <div className="p-8 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4 animate-bounce-short">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                
                <h3 className="font-serif font-bold text-2xl text-amber-950 mb-2">
                  ¡Agregado al Carrito!
                </h3>
                <p className="text-sm text-gray-600 max-w-sm mb-8">
                  Hemos sumado <strong className="text-amber-950">{selectedFood.name}</strong> a tu pedido con todas tus especificaciones de preparación.
                </p>

                <div className="flex items-center gap-4 w-full">
                  {/* Button 1: Pasar a Pago */}
                  <button
                    onClick={() => {
                      setShowCheckout(true);
                      setSelectedFood(null);
                      setIsAdded(false);
                    }}
                    className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-transform active:scale-[0.98] shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Pasar a Pago
                  </button>

                  {/* Button 2: 1:1 square button with a plus sign and notification globe */}
                  <button
                    onClick={() => {
                      setSelectedFood(null);
                      setIsAdded(false);
                    }}
                    className="w-14 h-14 shrink-0 flex items-center justify-center relative rounded-xl border-2 border-amber-500 bg-amber-50 hover:bg-amber-100 text-amber-950 transition-transform active:scale-[0.98] shadow-xs cursor-pointer"
                    title="Seguir Comprando"
                  >
                    <Plus className="w-6 h-6 text-amber-800" />
                    {totalCartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-rose-600 text-white text-[10px] font-extrabold w-5 h-5 flex items-center justify-center rounded-full shadow-md animate-pulse">
                        {totalCartCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="p-5 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-amber-950">Ajustar Platillo</h3>
                    <p className="text-xs text-gray-500">{selectedFood.name}</p>
                  </div>
                  <button
                    onClick={() => setSelectedFood(null)}
                    className="p-1 rounded-full hover:bg-amber-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-amber-900" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
                  {/* Options */}
                  {selectedFood.options?.map(option => (
                    <div key={option.title} className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-amber-950">{option.title}</h4>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {option.multiselect ? 'Múltiple' : 'Selecciona una'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {option.choices.map(choice => {
                          const isSelected = (modalOptions[option.title] || []).includes(choice);
                          return (
                            <button
                              key={choice}
                              type="button"
                              onClick={() =>
                                handleToggleOption(option.title, choice, option.multiselect)
                              }
                              className={`p-2.5 rounded-xl border text-xs text-left font-medium transition-all flex items-center justify-between ${
                                isSelected
                                  ? 'border-amber-500 bg-amber-50 text-amber-900 font-semibold'
                                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              {choice}
                              {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Extras */}
                  {selectedFood.extras && selectedFood.extras.length > 0 && (
                    <div className="space-y-2.5">
                      <h4 className="font-bold text-sm text-amber-950">¿Gustas algún ingrediente extra?</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedFood.extras.map(extra => {
                          const isSelected = modalExtras.some(e => e.name === extra.name);
                          return (
                            <button
                              key={extra.name}
                              type="button"
                              onClick={() => handleToggleExtra(extra)}
                              className={`p-2.5 rounded-xl border text-xs text-left transition-all flex items-center justify-between ${
                                isSelected
                                  ? 'border-amber-500 bg-amber-50 text-amber-900 font-semibold'
                                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              <div>
                                <p className="font-medium">{extra.name}</p>
                                <p className="text-[10px] text-amber-600">+${extra.price.toFixed(2)} MXN</p>
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] text-gray-400 font-medium">Precio final estimado</p>
                    <p className="font-bold text-amber-600 text-lg">
                      $
                      {(
                        selectedFood.price +
                        modalExtras.reduce((sum, e) => sum + e.price, 0)
                      ).toFixed(2)}{' '}
                      MXN
                    </p>
                  </div>
                  <button
                    onClick={addModifiersToCart}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Agregar al Pedido
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Cross-Selling Banner / Modal */}
      {showCrossSell && crossSellItem && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl border border-amber-100 animate-scale-up">
            <ShoppingBag className="w-12 h-12 text-amber-500 mx-auto mb-4 animate-bounce-short" />
            <h3 className="font-serif font-bold text-xl text-amber-950">¿Te gustaría agregar bebida?</h3>
            <p className="text-xs text-gray-600 mt-2">
              Prueba un rico <strong className="text-amber-950">{crossSellItem.name}</strong> por solo <strong className="text-amber-600">${crossSellItem.price.toFixed(2)} MXN</strong> más para acompañar tus chilaquiles.
            </p>
            
            <div className="mt-4 rounded-xl overflow-hidden border border-gray-100 max-h-32">
              <img src={crossSellItem.image} alt={crossSellItem.name} className="w-full h-full object-cover" />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setShowCrossSell(false);
                  setCrossSellItem(null);
                }}
                className="py-2.5 border border-gray-200 text-gray-500 rounded-xl text-xs font-bold hover:bg-gray-50"
              >
                No, gracias
              </button>
              <button
                onClick={handleAddCrossSell}
                className="py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                ¡Sí, se antoja! 🥛
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Sidebar / Modal Drawer */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 bg-black/55 flex justify-end backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg h-full flex flex-col shadow-2xl overflow-hidden animate-slide-left">
            <div className="p-5 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-800" />
                <h3 className="font-serif font-bold text-lg text-amber-950">Tu Comanda</h3>
              </div>
              <button
                onClick={() => setShowCheckout(false)}
                className="p-1 rounded-full hover:bg-amber-100 text-amber-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Cart List */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-gray-400 uppercase tracking-wider">Productos Seleccionados</h4>
                {cart.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">No hay productos en tu carrito.</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {cart.map(c => {
                      const extrasTotal = c.selectedExtras.reduce((sum, e) => sum + e.price, 0);
                      const rowTotal = (c.item.price + extrasTotal) * c.quantity;
                      return (
                        <div key={c.id} className="py-3.5 flex items-start gap-3">
                          <img
                            src={c.item.image}
                            alt={c.item.name}
                            className="w-12 h-12 rounded-lg object-cover bg-gray-100 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-xs text-amber-950 truncate">{c.item.name}</h5>
                            {/* Options strings */}
                            {Object.entries(c.selectedOptions).map(([title, choices]) => {
                              if ((choices as string[]).length === 0) return null;
                              return (
                                <p key={title} className="text-[10px] text-gray-400">
                                  {title}: {(choices as string[]).join(', ')}
                                </p>
                              );
                            })}
                            {/* Extras list */}
                            {c.selectedExtras.map(ex => (
                              <p key={ex.name} className="text-[10px] text-amber-600">
                                + {ex.name} (+${ex.price} MXN)
                              </p>
                            ))}
                            <div className="flex items-center gap-1.5 mt-2">
                              <button
                                onClick={() => updateCartQty(c.id, -1)}
                                className="p-1 border border-gray-200 hover:border-amber-300 rounded-md text-gray-500"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-bold px-2">{c.quantity}</span>
                              <button
                                onClick={() => updateCartQty(c.id, 1)}
                                className="p-1 border border-gray-200 hover:border-amber-300 rounded-md text-gray-500"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-bold text-amber-950 whitespace-nowrap">${rowTotal.toFixed(2)}</p>
                            <button
                              onClick={() => updateCartQty(c.id, -c.quantity)}
                              className="text-[10px] text-rose-500 hover:underline mt-1.5"
                            >
                              Quitar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Checkout Form */}
              {cart.length > 0 && (
                <form onSubmit={handleCheckoutSubmit} className="space-y-4 pt-4 border-t border-gray-100">
                  <h4 className="font-bold text-xs text-gray-400 uppercase tracking-wider">Datos de Entrega</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre Completo *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Juan Pérez"
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Celular de Contacto *</label>
                      <input
                        type="tel"
                        required
                        placeholder="Ej. 5512345678"
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                        className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Delivery Mode Tabs */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('domicilio')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        deliveryType === 'domicilio'
                          ? 'border-amber-500 bg-amber-50 text-amber-900'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      A Domicilio 🛵
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryType('local')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        deliveryType === 'local'
                          ? 'border-amber-500 bg-amber-50 text-amber-900'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      Retirar en Local 🏪
                    </button>
                  </div>

                  {deliveryType === 'domicilio' && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Dirección de Envío *</label>
                      <textarea
                        required
                        rows={2}
                        placeholder="Calle, número, colonia, referencias visuales para el mensajero..."
                        value={deliveryAddress}
                        onChange={e => setDeliveryAddress(e.target.value)}
                        className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Notas de Cocina u Horario Especial (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej. Sin picante / Entregar después de las 9 AM"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Método de Pago</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('efectivo')}
                        className={`p-2 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                          paymentMethod === 'efectivo'
                            ? 'border-amber-500 bg-amber-50/50 text-amber-900'
                            : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        💵 Efectivo
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('transferencia')}
                        className={`p-2 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                          paymentMethod === 'transferencia'
                            ? 'border-amber-500 bg-amber-50/50 text-amber-900'
                            : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        🏦 Transferencia
                      </button>
                    </div>
                  </div>

                  {/* Math Breakdown */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-1.5 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-bold text-gray-800">${sub.toFixed(2)} MXN</span>
                    </div>
                    {deliveryType === 'domicilio' && (
                      <div className="flex justify-between">
                        <span>Envío a Domicilio:</span>
                        <span className="font-bold text-gray-800">${config.deliveryFee.toFixed(2)} MXN</span>
                      </div>
                    )}
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Propina Sugerida:</span>
                      <span>$10.00 MXN</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-amber-950 pt-2 border-t border-gray-200">
                      <span>TOTAL ESTIMADO:</span>
                      <span>${(sub + (deliveryType === 'domicilio' ? config.deliveryFee : 0) + 10).toFixed(2)} MXN</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.01]"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Enviar Pedido por WhatsApp Gratis
                  </button>
                  <p className="text-[10px] text-gray-400 text-center leading-normal">
                    Al dar clic se abrirá un chat directo con el comercio con tu pedido redactado perfectamente. ¡No necesitas registrar cuentas ni pagar de más!
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
