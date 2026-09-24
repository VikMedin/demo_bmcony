/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { ShoppingBag, Plus, Minus, X, Check, Clock, AlertTriangle, MessageSquare, ExternalLink, CheckCircle, Coffee, MapPin, Heart, Tag, Sparkles } from 'lucide-react';
import { FoodItem, FoodOrder, BusinessConfig, Coupon } from '../types';

const DEFAULT_BEVERAGE_IMAGE = 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&q=80&w=800';


interface ClientMenuProps {
  foodItems: FoodItem[];
  config: BusinessConfig;
  coupons?: Coupon[];
  onPlaceOrder: (order: FoodOrder) => void;
  triggerToast: (type: 'success' | 'error' | 'info', title: string, description?: string) => void;
}

export const ClientMenu: React.FC<ClientMenuProps> = ({
  foodItems,
  config,
  coupons = [],
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
  const [modalQuantity, setModalQuantity] = useState<number>(1);

  // Cross Selling State
  const [showCrossSell, setShowCrossSell] = useState<boolean>(false);
  const [crossSellItem, setCrossSellItem] = useState<FoodItem | null>(null);

  // Checkout State
  const [showCheckout, setShowCheckout] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [deliveryType, setDeliveryType] = useState<'domicilio' | 'local'>('domicilio');
  
  // Separate Address Fields
  const [addrStreet, setAddrStreet] = useState<string>('');
  const [addrExtNum, setAddrExtNum] = useState<string>('');
  const [addrIntNum, setAddrIntNum] = useState<string>('');
  const [addrColonia, setAddrColonia] = useState<string>('');
  const [addrAlcaldia, setAddrAlcaldia] = useState<string>('');
  const [addrZip, setAddrZip] = useState<string>('');
  const [addrState, setAddrState] = useState<string>('CDMX');

  const [notes, setNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia'>('efectivo');

  // Customer Tip Selection State (Not added automatically, toggleable & editable)
  const [includeTip, setIncludeTip] = useState<boolean>(false);
  const [customTip, setCustomTip] = useState<string>('');

  // Discount Coupon State
  const [couponInput, setCouponInput] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponFeedback, setCouponFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleApplyCoupon = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = couponInput.trim().toUpperCase();

    if (!cleanCode) {
      setCouponFeedback({ type: 'error', message: 'Por favor ingresa un código de cupón.' });
      return;
    }

    const currentSub = cart.reduce((acc, c) => {
      const extrasSum = c.selectedExtras ? c.selectedExtras.reduce((s, ex) => s + ex.price, 0) : 0;
      return acc + (c.item.price + extrasSum) * c.quantity;
    }, 0);

    const found = coupons.find(c => c.code.trim().toUpperCase() === cleanCode && c.isActive);

    if (!found) {
      setCouponFeedback({
        type: 'error',
        message: `El cupón "${cleanCode}" no es válido o no está activo actualmente.`
      });
      return;
    }

    if (found.minPurchase && found.minPurchase > 0 && currentSub < found.minPurchase) {
      setCouponFeedback({
        type: 'error',
        message: `Compra mínima requerida para este cupón: $${found.minPurchase.toFixed(2)} MXN (tu subtotal actual es $${currentSub.toFixed(2)} MXN).`
      });
      return;
    }

    const discountVal = (currentSub * found.discountPercentage) / 100;
    setAppliedCoupon(found);
    setCouponFeedback({
      type: 'success',
      message: `¡Cupón ${found.code} aplicado! (-${found.discountPercentage}%) Descuento de -$${discountVal.toFixed(2)} MXN.`
    });
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponFeedback(null);
  };

  // Confirmation & Dispatch Screen State
  const [submittedOrder, setSubmittedOrder] = useState<{
    order: FoodOrder;
    waUrl: string;
    text: string;
  } | null>(null);

  // Helper to parse time strings like "07:30", "7:30", "00:01", "00.01", "24:00", "24.00"
  const parseTimeToMinutes = (timeStr?: string): number => {
    if (!timeStr) return 0;
    const clean = String(timeStr).trim().replace(/\./g, ':');
    const parts = clean.split(':').map(p => parseInt(p, 10));
    const h = isNaN(parts[0]) ? 0 : parts[0];
    const m = isNaN(parts[1]) ? 0 : parts[1];
    return h * 60 + m;
  };

  // Helper to format schedule text cleanly
  const formatScheduleDisplay = (cfg: BusinessConfig): string => {
    const is24h = Boolean(cfg?.is24Hours);
    
    if (is24h) {
      return 'Abierto las 24 Horas (Todo el día)';
    }

    const startClean = (cfg?.scheduleStart || '07:30').trim().replace(/\./g, ':');
    const endClean = (cfg?.scheduleEnd || '13:30').trim().replace(/\./g, ':');
    return `${startClean} - ${endClean} hrs`;
  };

  // Verify Schedule & Manual Switch
  const isCurrentlyOpen = (() => {
    // 1. Manual pause switch: If explicitly turned OFF (Pausar comal), the store is CLOSED immediately!
    // The owner's manual pause takes absolute precedence over all schedules and 24h mode.
    if (config?.isOpenManual === false) return false;

    // 2. If 24 hours open is active, it is always open!
    if (config?.is24Hours) return true;

    const startMin = parseTimeToMinutes(config?.scheduleStart);
    const endMin = parseTimeToMinutes(config?.scheduleEnd);

    const now = new Date();
    const nowInMinutes = now.getHours() * 60 + now.getMinutes();

    // Normal schedule check
    if (endMin > startMin) {
      return nowInMinutes >= startMin && nowInMinutes <= endMin;
    } else if (endMin < startMin) {
      // Overnight schedule (e.g. 20:00 to 04:00)
      return nowInMinutes >= startMin || nowInMinutes <= endMin;
    } else {
      return true;
    }
  })();

  const visibleFoodItems = foodItems.filter(item => !item.hidden);

  const sortedFoodItems = [...visibleFoodItems].sort((a, b) => {
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
      triggerToast('error', 'Platillo Agotado', 'Lo sentimos, este platillo se encuentra agotado por hoy.');
      return;
    }
    setSelectedFood(item);
    setIsAdded(false);
    setModalQuantity(1);
    
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
      const isMultiselect = selectedFood?.extrasMultiselect !== false;
      if (!isMultiselect) {
        if (prev.some(e => e.name === extra.name)) {
          return [];
        } else {
          return [extra];
        }
      } else {
        if (prev.some(e => e.name === extra.name)) {
          return prev.filter(e => e.name !== extra.name);
        } else {
          return [...prev, extra];
        }
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
      quantity: modalQuantity,
      selectedOptions: modalOptions,
      selectedExtras: modalExtras,
      id: cartId
    };

    setCart(prev => [...prev, cartItem]);
    setIsAdded(true);
    triggerToast(
      'success',
      'Agregado al Carrito',
      `${modalQuantity > 1 ? `${modalQuantity}x ` : ''}${selectedFood.name} listo en tu orden.`
    );

    // Trigger cross-selling logic
    // Suggest a sweet beverage or side that isn't currently in the cart
    const coffee = foodItems.find(f => 
      !cart.some(c => c.item.id === f.id) && 
      f.id !== selectedFood.id && 
      (f.category === 'Bebidas' || f.name.toLowerCase().includes('café') || f.name.toLowerCase().includes('cafe')) &&
      (f.stock === undefined || f.stock > 0)
    );
    const shake = foodItems.find(f => 
      !cart.some(c => c.item.id === f.id) && 
      f.id !== selectedFood.id && 
      (f.name.toLowerCase().includes('licuado') || f.category === 'Bebidas') &&
      (f.stock === undefined || f.stock > 0)
    );
    const suggested = coffee || shake;
    
    if (suggested && !cart.some(c => c.item.id === suggested.id) && Math.random() > 0.4) {
      setCrossSellItem(suggested);
      setShowCrossSell(true);
    }
  };

  const handleAddCrossSell = () => {
    if (!crossSellItem) return;
    const initialOps: { [key: string]: string[] } = {};
    if (crossSellItem.options) {
      crossSellItem.options.forEach(op => {
        if (!op.multiselect && op.choices.length > 0) {
          initialOps[op.title] = [op.choices[0]];
        } else {
          initialOps[op.title] = [];
        }
      });
    }

    const cartId = `${crossSellItem.id}-${Date.now()}`;
    setCart(prev => [
      ...prev,
      {
        item: crossSellItem,
        quantity: 1,
        selectedOptions: initialOps,
        selectedExtras: [],
        id: cartId
      }
    ]);
    setShowCrossSell(false);
    setCrossSellItem(null);
    triggerToast('success', 'Sugerencia Agregada', 'Se ha sumado a tu carrito, ¡excelente elección! 🤤');
  };

  // Sugerencias de compra para la ventana de pasar a pago / revisión
  const checkoutSuggestions = useMemo(() => {
    // Excluir platillos que ya están en el carrito o que estén agotados
    const available = foodItems.filter(f => 
      !cart.some(c => c.item.id === f.id) && (f.stock === undefined || f.stock > 0)
    );

    // Priorizar Bebidas y Postres/Para Endulzar el Día
    const drinks = available.filter(f => 
      f.category === 'Bebidas' || 
      f.name.toLowerCase().includes('café') || 
      f.name.toLowerCase().includes('cafe') || 
      f.name.toLowerCase().includes('licuado') ||
      f.name.toLowerCase().includes('chocolate') ||
      f.name.toLowerCase().includes('refresco')
    );
    const sweets = available.filter(f => 
      f.category === 'Para Endulzar el Día' || 
      f.category.toLowerCase().includes('postre') ||
      f.category.toLowerCase().includes('dulce')
    );
    const others = available.filter(f => !drinks.includes(f) && !sweets.includes(f));

    // Combinar con variedad (primero bebidas, luego postres, luego otros)
    const combined = [...drinks, ...sweets, ...others];
    return combined.slice(0, 3);
  }, [foodItems, cart]);

  // Agregar sugerencia rápidamente desde la ventana de pago
  const handleQuickAddSuggestion = (item: FoodItem) => {
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

    const cartId = `${item.id}-${Date.now()}`;
    const newCartItem = {
      item,
      quantity: 1,
      selectedOptions: initialOps,
      selectedExtras: [],
      id: cartId
    };

    setCart(prev => [...prev, newCartItem]);
    triggerToast(
      'success',
      'Sugerencia Agregada',
      `Se ha sumado ${item.name} a tu pedido. ¡Excelente complemento!`
    );
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
    if (!customerName.trim() || !customerPhone.trim()) {
      triggerToast('error', 'Campos Faltantes', 'Tu nombre y teléfono de contacto son obligatorios.');
      return;
    }
    if (deliveryType === 'domicilio') {
      if (!addrStreet.trim() || !addrExtNum.trim() || !addrColonia.trim() || !addrAlcaldia.trim() || !addrZip.trim() || !addrState.trim()) {
        triggerToast('error', 'Dirección Incompleta', 'Por favor llena los campos obligatorios de entrega: Calle, Núm. Exterior, Colonia, Alcaldía, C.P. y Estado.');
        return;
      }
    }

    const formattedAddress = deliveryType === 'domicilio'
      ? `Calle ${addrStreet.trim()} #${addrExtNum.trim()}${addrIntNum.trim() ? `, Int. ${addrIntNum.trim()}` : ''}, Col. ${addrColonia.trim()}, Alc./Mun. ${addrAlcaldia.trim()}, C.P. ${addrZip.trim()}, ${addrState.trim()}`
      : 'Retiro en Local';

    const sub = calculateSubtotal();
    const discountAmount = appliedCoupon ? (sub * appliedCoupon.discountPercentage) / 100 : 0;
    const subAfterDiscount = Math.max(0, sub - discountAmount);
    const fee = deliveryType === 'domicilio' ? (Number(config?.deliveryFee) || 0) : 0;
    const effectiveTip = includeTip
      ? (parseFloat(customTip) >= 0 && !isNaN(parseFloat(customTip)) ? parseFloat(customTip) : 0)
      : 0;
    const tot = subAfterDiscount + fee + effectiveTip;

    const newOrder: FoodOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: `DC-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: customerName.trim(),
      clientPhone: customerPhone.trim(),
      deliveryType,
      address: formattedAddress,
      notes: notes.trim() || '',
      items: cart.map(c => ({
        itemId: c.item.id,
        name: c.item.name,
        quantity: c.quantity,
        price: c.item.price,
        selectedOptions: c.selectedOptions || {},
        selectedExtras: c.selectedExtras || []
      })),
      subtotal: sub,
      couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      discountPercentage: appliedCoupon ? appliedCoupon.discountPercentage : undefined,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      deliveryFee: fee,
      tip: effectiveTip,
      total: tot,
      paymentMethod,
      status: 'recibido',
      createdAt: new Date().toISOString(),
      slaLimitTime: new Date(Date.now() + 20 * 60 * 1000).toISOString() // 20 min limit
    };

    // 1. Send order directly to kitchen & system state
    onPlaceOrder(newOrder);

    // 2. Build structured WhatsApp message
    const rawPhone = config?.whatsappPhone || '525512345678';
    const formattedPhone = String(rawPhone).replace(/\D/g, '') || '525512345678';
    let text = `*☕ DESAYUNOS CONY - NUEVO PEDIDO ☕*\n`;
    text += `*Folio:* #${newOrder.orderNumber}\n`;
    text += `===============================\n`;
    text += `👤 *Cliente:* ${customerName.trim()}\n`;
    text += `📞 *Teléfono:* ${customerPhone.trim()}\n`;
    text += `🛵 *Tipo:* ${deliveryType === 'domicilio' ? 'Entrega a Domicilio 🏡' : 'Retiro en Local 🏪'}\n`;
    if (deliveryType === 'domicilio') {
      text += `📍 *Dirección de Entrega:*\n`;
      text += `   • Calle: ${addrStreet.trim()} #${addrExtNum.trim()}${addrIntNum.trim() ? ` (Int. ${addrIntNum.trim()})` : ''}\n`;
      text += `   • Colonia: ${addrColonia.trim()}\n`;
      text += `   • Alcaldía/Mun: ${addrAlcaldia.trim()}\n`;
      text += `   • C.P.: ${addrZip.trim()}\n`;
      text += `   • Estado: ${addrState.trim()}\n`;
    }
    if (notes.trim()) {
      text += `📝 *Notas:* ${notes.trim()}\n`;
    }
    text += `===============================\n`;
    text += `🛒 *DETALLE DEL PEDIDO:*\n\n`;

    cart.forEach(c => {
      text += `• ${c.quantity}x *${c.item.name}* ($${c.item.price.toFixed(2)} MXN)\n`;
      if (c.selectedOptions) {
        Object.entries(c.selectedOptions).forEach(([title, choices]) => {
          if (Array.isArray(choices) && choices.length > 0) {
            text += `   ↳ _${title}:_ ${choices.join(', ')}\n`;
          }
        });
      }
      if (c.selectedExtras && c.selectedExtras.length > 0) {
        c.selectedExtras.forEach(ex => {
          text += `   ↳ _Extra:_ ${ex.name} (+$${ex.price.toFixed(2)} MXN)\n`;
        });
      }
      text += `\n`;
    });

    text += `===============================\n`;
    text += `💵 *Subtotal:* $${sub.toFixed(2)} MXN\n`;
    if (appliedCoupon && discountAmount > 0) {
      text += `🏷️ *Cupón Aplicado (${appliedCoupon.code} -${appliedCoupon.discountPercentage}%):* -$${discountAmount.toFixed(2)} MXN\n`;
    }
    if (deliveryType === 'domicilio') {
      text += `🛵 *Envío:* $${fee.toFixed(2)} MXN\n`;
    }
    if (effectiveTip > 0) {
      text += `💖 *Propina voluntaria:* $${effectiveTip.toFixed(2)} MXN\n`;
    } else {
      text += `💖 *Propina:* $0.00 MXN\n`;
    }
    text += `💰 *TOTAL A PAGAR:* $${tot.toFixed(2)} MXN\n`;
    text += `💳 *Método:* ${paymentMethod === 'efectivo' ? '💵 Efectivo contra entrega' : '🏦 Transferencia Bancaria'}\n\n`;
    text += `_¡Muchísimas gracias por tu compra! Tu comanda ha entrado en la cocina de Doña Cony._ 🍳✨`;

    const encodedText = encodeURIComponent(text);
    const waUrl = `https://wa.me/${formattedPhone}?text=${encodedText}`;

    // 3. Save to submitted order state to transition immediately to Comanda Registrada view
    setSubmittedOrder({ order: newOrder, waUrl, text });
    setCart([]);
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponFeedback(null);
    triggerToast('success', '¡Comanda Registrada en Cocina!', `Folio #${newOrder.orderNumber} listo para confirmación.`);
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
        <div className="shrink-0 flex flex-col items-center gap-1.5 bg-white p-4 rounded-xl border border-amber-100 shadow-sm min-w-[200px]">
          <Clock className="w-5 h-5 text-amber-600" />
          <span className="text-xs text-gray-500 font-medium">Horario de Servicio</span>
          <span className="text-sm font-bold text-amber-950 text-center">
            {formatScheduleDisplay(config)}
          </span>
          {isCurrentlyOpen ? (
            <span className="text-xs px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              Abierto Ahora
            </span>
          ) : (
            <span className="text-xs px-3 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
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
            <h3 className="text-base font-bold text-amber-950">¡Hola! Nuestro comal descansa en este momento</h3>
            <p className="text-sm text-gray-700 mt-1 leading-relaxed">
              {config.isOpenManual === false ? (
                <span>El establecimiento ha sido pausado temporalmente por el personal. En este momento los pedidos de compra están inhabilitados.</span>
              ) : (
                <span>
                  Te esperamos en nuestro horario habitual de <strong className="text-amber-950">{formatScheduleDisplay(config)}</strong> para tus desayunos favoritos. En este momento los pedidos de compra están inhabilitados.
                </span>
              )}
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
                  {isAgotado && (
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold uppercase">
                      Agotado por hoy
                    </span>
                  )}
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
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div
            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col animate-scale-up"
            style={{ maxWidth: '520px' }}
          >
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
                  {/* Button 1: Pasar a Pago / Volver al Pedido */}
                  <button
                    onClick={() => {
                      setShowCheckout(true);
                      setSelectedFood(null);
                      setIsAdded(false);
                    }}
                    className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-transform active:scale-[0.98] shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    {showCheckout ? 'Volver al Pedido y Pagar' : 'Pasar a Pago'}
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
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-amber-950">¿Gustas algún ingrediente extra?</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          selectedFood.extrasMultiselect !== false
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}>
                          {selectedFood.extrasMultiselect !== false ? 'Múltiple' : 'Selecciona máx. 1 (Única)'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedFood.extras.map(extra => {
                          const isSelected = modalExtras.some(e => e.name === extra.name);
                          const isMultiselect = selectedFood.extrasMultiselect !== false;
                          return (
                            <button
                              key={extra.name}
                              type="button"
                              onClick={() => handleToggleExtra(extra)}
                              className={`p-2.5 rounded-xl border text-xs text-left transition-all flex items-center justify-between ${
                                isSelected
                                  ? 'border-amber-500 bg-amber-50 text-amber-900 font-semibold shadow-xs'
                                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              <div>
                                <p className="font-medium">{extra.name}</p>
                                <p className="text-[10px] text-amber-600">+${extra.price.toFixed(2)} MXN</p>
                              </div>
                              {isSelected ? (
                                isMultiselect ? (
                                  <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                                    ✓
                                  </div>
                                )
                              ) : (
                                !isMultiselect && (
                                  <div className="w-4 h-4 rounded-full border border-gray-300 shrink-0" />
                                )
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Selector de Porciones */}
                  <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-3.5 space-y-1.5">
                    <label className="block text-xs font-bold text-amber-950">
                      Porciones a Seleccionar *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={selectedFood.stock > 0 ? selectedFood.stock : 999}
                      step="1"
                      value={modalQuantity}
                      onChange={(e) => {
                        const val = Math.max(1, parseInt(e.target.value) || 1);
                        const maxLimit = selectedFood.stock > 0 ? selectedFood.stock : 999;
                        setModalQuantity(Math.min(maxLimit, val));
                      }}
                      className="w-full p-2.5 border border-amber-200 bg-white rounded-xl text-xs font-bold text-gray-800 focus:ring-1 focus:ring-amber-500 focus:outline-hidden shadow-2xs"
                    />
                    <p className="text-[9.5px] text-gray-400">
                      Monto de porciones deseadas para este platillo (puedes escribir o ajustar con las flechas).
                    </p>
                  </div>
                </div>

                <div className="p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] text-gray-400 font-medium">
                      Precio final ({modalQuantity} {modalQuantity === 1 ? 'porción' : 'porciones'})
                    </p>
                    <p className="font-bold text-amber-600 text-lg">
                      $
                      {(
                        (selectedFood.price +
                          modalExtras.reduce((sum, e) => sum + e.price, 0)) *
                        modalQuantity
                      ).toFixed(2)}{' '}
                      MXN
                    </p>
                  </div>
                  <button
                    onClick={addModifiersToCart}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
                  >
                    Agregar {modalQuantity > 1 ? `(${modalQuantity} porciones)` : ''} al Pedido
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Cross-Selling Modal (Proportion 4:3, responsive on mobile) */}
      {showCrossSell && crossSellItem && (
        <div className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs">
          <div
            className="relative bg-white rounded-3xl overflow-hidden shadow-2xl border border-amber-200/80 w-full flex flex-col transition-all"
            style={{ maxWidth: '460px' }}
          >
            {/* Top 4:3 Ratio Image Showcase */}
            <div className="relative w-full aspect-[4/3] max-h-56 sm:max-h-64 bg-amber-50 overflow-hidden group">
              <img
                src={crossSellItem.image || DEFAULT_BEVERAGE_IMAGE}
                alt={crossSellItem.name}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_BEVERAGE_IMAGE;
                }}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              
              {/* Soft Gradient for text legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />

              {/* Dismiss / Close X Button */}
              <button
                type="button"
                onClick={() => {
                  setShowCrossSell(false);
                  setCrossSellItem(null);
                }}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/45 hover:bg-black/70 text-white backdrop-blur-md transition-colors cursor-pointer"
                title="Cerrar sugerencia"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Floating Top Badge */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-amber-600/90 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md backdrop-blur-xs">
                <Coffee className="w-3.5 h-3.5" />
                <span>¿Gusta una bebida?</span>
              </div>

              {/* Bottom Image Overlay Details */}
              <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2 text-white">
                <div className="min-w-0">
                  <h4 className="font-serif font-bold text-base sm:text-lg drop-shadow-md text-amber-50 truncate">
                    {crossSellItem.name}
                  </h4>
                  <p className="text-[11px] text-amber-200 drop-shadow-sm font-medium">
                    Acompañamiento ideal para tu desayuno
                  </p>
                </div>
                <span className="bg-emerald-600 text-white font-extrabold text-xs sm:text-sm px-3 py-1 rounded-xl shadow-lg shrink-0">
                  +${crossSellItem.price.toFixed(2)} MXN
                </span>
              </div>
            </div>

            {/* Modal Body & Action Buttons */}
            <div className="p-4 sm:p-5 flex flex-col justify-between gap-3 sm:gap-4 text-center">
              <div>
                <p className="text-xs text-gray-600 leading-relaxed max-w-sm mx-auto">
                  {crossSellItem.description || `Disfruta un delicioso ${crossSellItem.name} calientito con receta casera tradicional de Doña Cony.`}
                </p>
              </div>

              {/* Touch-Friendly Responsive Buttons */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowCrossSell(false);
                    setCrossSellItem(null);
                  }}
                  className="py-3 px-3 border border-gray-200 text-gray-600 hover:text-gray-900 rounded-xl text-xs font-bold hover:bg-gray-100/80 active:scale-[0.98] transition-all cursor-pointer min-h-[46px]"
                >
                  No, gracias
                </button>
                <button
                  type="button"
                  onClick={handleAddCrossSell}
                  className="py-3 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[46px]"
                >
                  <span>¡Sí, se antoja!</span>
                  <span className="text-sm">☕</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Sidebar / Modal Drawer */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 bg-black/55 flex justify-end backdrop-blur-xs">
          <div
            className="bg-white w-full max-w-lg h-full flex flex-col shadow-2xl overflow-hidden animate-slide-left"
            style={{ maxWidth: '520px' }}
          >
            <div className="p-5 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-800" />
                <h3 className="font-serif font-bold text-lg text-amber-950">
                  {submittedOrder ? 'Comanda Registrada' : 'Tu Comanda'}
                </h3>
              </div>
              <button
                onClick={() => {
                  if (submittedOrder) setSubmittedOrder(null);
                  setShowCheckout(false);
                }}
                className="p-1 rounded-full hover:bg-amber-100 text-amber-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submittedOrder ? (
              /* PANTALLA DE CONFIRMACIÓN Y ENVÍO DE COMANDA */
              <div className="flex-1 overflow-y-auto p-6 space-y-5 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner mt-2">
                  <CheckCircle className="w-9 h-9" />
                </div>

                <div>
                  <span className="inline-block px-3.5 py-1 bg-amber-100 text-amber-900 font-extrabold text-xs rounded-full mb-2 tracking-wide">
                    Folio de Cocina #{submittedOrder.order.orderNumber}
                  </span>
                  <h3 className="font-serif font-bold text-xl text-amber-950">
                    ¡Comanda Registrada en Cocina!
                  </h3>
                  <p className="text-xs text-gray-600 mt-1.5 max-w-sm mx-auto leading-relaxed">
                    Tu pedido ya entró en el sistema de cocina Doña Cony. Haz clic abajo para enviar los detalles por WhatsApp al restaurante y coordinar la entrega.
                  </p>
                </div>

                {/* BOTÓN Y MENSAJE DE CONFIRMACIÓN POR WHATSAPP */}
                <div className="w-full bg-emerald-50/90 border border-emerald-200/90 rounded-2xl p-4 text-center space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-950 font-bold text-xs">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>¿Tienes alguna duda o deseas confirmar tu entrega?</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-snug">
                    Toca el botón para enviar tu comanda al WhatsApp del restaurante y coordinar tu pedido directamente con el comal:
                  </p>
                  <a
                    href={submittedOrder.waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <span>💬 Confirmar mi Pedido por WhatsApp</span>
                    <ExternalLink className="w-4 h-4 opacity-85" />
                  </a>
                </div>

                {/* RESUMEN DEL PEDIDO */}
                <div className="w-full bg-amber-50/50 rounded-xl p-4 border border-amber-200/60 text-left space-y-2 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-amber-200/50">
                    <span className="font-bold text-amber-950">Resumen de la Orden</span>
                    <span className="text-emerald-700 font-extrabold text-sm">
                      ${submittedOrder.order.total.toFixed(2)} MXN
                    </span>
                  </div>
                  <p className="text-gray-700"><strong>Cliente:</strong> {submittedOrder.order.clientName}</p>
                  <p className="text-gray-700"><strong>Teléfono:</strong> {submittedOrder.order.clientPhone}</p>
                  <p className="text-gray-700">
                    <strong>Tipo:</strong> {submittedOrder.order.deliveryType === 'domicilio' ? 'Entrega a Domicilio 🛵' : 'Retiro en Local 🏪'}
                  </p>
                  {submittedOrder.order.address && (
                    <p className="text-gray-700"><strong>Dirección:</strong> {submittedOrder.order.address}</p>
                  )}
                  {submittedOrder.order.notes && (
                    <p className="text-gray-600 italic"><strong>Notas:</strong> {submittedOrder.order.notes}</p>
                  )}
                  {submittedOrder.order.couponCode && (
                    <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-800 flex items-center justify-between text-[11px] font-bold">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Cupón: {submittedOrder.order.couponCode} (-{submittedOrder.order.discountPercentage}%)</span>
                      </span>
                      <span>-${(submittedOrder.order.discountAmount || 0).toFixed(2)} MXN</span>
                    </div>
                  )}
                  <div className="pt-2 text-[11px] text-gray-600 space-y-1 border-t border-amber-200/40 mt-2">
                    {submittedOrder.order.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{it.quantity}x {it.name}</span>
                        <span className="font-semibold">${(it.price * it.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSubmittedOrder(null);
                    setShowCheckout(false);
                    setCustomerName('');
                    setCustomerPhone('');
                    setAddrStreet('');
                    setAddrExtNum('');
                    setAddrIntNum('');
                    setAddrColonia('');
                    setAddrAlcaldia('');
                    setAddrZip('');
                    setAddrState('CDMX');
                    setNotes('');
                    setIncludeTip(false);
                    setCustomTip('');
                  }}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Entendido / Volver a la Carta
                </button>
              </div>
            ) : (
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

                {/* Sugerencias de Compra en Ventana de Pasar a Pago / Revisión */}
                {cart.length > 0 && checkoutSuggestions.length > 0 && (
                  <div className="p-4 bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-amber-100/40 rounded-2xl border border-amber-200/90 space-y-3 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs font-bold shadow-xs shrink-0">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-amber-950 uppercase tracking-wider">
                          Sugerencias de Compra
                        </h4>
                        <p className="text-[10px] text-amber-800/80">
                          ¿Se te antoja complementar tu pedido con una rica bebida o antojito?
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {checkoutSuggestions.map(sugg => {
                        const hasImage = Boolean(sugg.image && sugg.image.trim() !== '');
                        const hasOptions = Boolean(sugg.options && sugg.options.length > 0);

                        return (
                          <div
                            key={sugg.id}
                            className="bg-white p-2.5 rounded-xl border border-amber-200/70 hover:border-amber-400 flex items-center justify-between gap-3 shadow-2xs transition-all"
                          >
                            <div
                              className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                              onClick={() => {
                                if (hasOptions) {
                                  openModifiers(sugg);
                                } else {
                                  handleQuickAddSuggestion(sugg);
                                }
                              }}
                            >
                              <img
                                src={hasImage ? sugg.image : DEFAULT_BEVERAGE_IMAGE}
                                alt={sugg.name}
                                className="w-12 h-12 rounded-lg object-cover bg-amber-50 shrink-0 border border-amber-100"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = DEFAULT_BEVERAGE_IMAGE;
                                }}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h5 className="font-bold text-xs text-gray-900 truncate hover:text-amber-900 transition-colors">
                                    {sugg.name}
                                  </h5>
                                  <span className="text-[9px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded-md">
                                    {sugg.category}
                                  </span>
                                </div>
                                <p className="text-[10px] text-gray-500 line-clamp-1">
                                  {sugg.description || 'Delicioso acompañamiento casero tradicional.'}
                                </p>
                                <p className="text-xs font-bold text-emerald-700 mt-0.5">
                                  +${sugg.price.toFixed(2)} MXN
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {hasOptions && (
                                <button
                                  type="button"
                                  onClick={() => openModifiers(sugg)}
                                  className="px-2 py-1.5 text-[10px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors cursor-pointer"
                                  title="Personalizar opciones"
                                >
                                  Opciones
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleQuickAddSuggestion(sugg)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-all active:scale-95 shadow-xs flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Agregar</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

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
                      <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                          <MapPin className="w-3.5 h-3.5 text-amber-600" />
                          <span>Dirección Detallada de Entrega</span>
                        </div>

                        {/* Calle */}
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-1">Calle / Avenida *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ej. Calle Barro Negro"
                            value={addrStreet}
                            onChange={e => setAddrStreet(e.target.value)}
                            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                          />
                        </div>

                        {/* Números Ext e Int */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Núm. Exterior *</label>
                            <input
                              type="text"
                              required
                              placeholder="Ej. 4 o Mz 2"
                              value={addrExtNum}
                              onChange={e => setAddrExtNum(e.target.value)}
                              className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Núm. Interior (Opcional)</label>
                            <input
                              type="text"
                              placeholder="Ej. Depto 302"
                              value={addrIntNum}
                              onChange={e => setAddrIntNum(e.target.value)}
                              className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                            />
                          </div>
                        </div>

                        {/* Colonia y C.P. */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Colonia *</label>
                            <input
                              type="text"
                              required
                              placeholder="Ej. Infonavit Iztacalco"
                              value={addrColonia}
                              onChange={e => setAddrColonia(e.target.value)}
                              className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1">C.P. (Código Postal) *</label>
                            <input
                              type="text"
                              required
                              maxLength={5}
                              placeholder="Ej. 08900"
                              value={addrZip}
                              onChange={e => setAddrZip(e.target.value)}
                              className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden font-mono"
                            />
                          </div>
                        </div>

                        {/* Alcaldía y Estado */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Alcaldía / Municipio *</label>
                            <input
                              type="text"
                              required
                              placeholder="Ej. Iztacalco"
                              value={addrAlcaldia}
                              onChange={e => setAddrAlcaldia(e.target.value)}
                              className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Estado *</label>
                            <input
                              type="text"
                              required
                              placeholder="Ej. CDMX"
                              value={addrState}
                              onChange={e => setAddrState(e.target.value)}
                              className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                            />
                          </div>
                        </div>
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

                    {/* Cupón de Descuento Promocional */}
                    <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                          <Tag className="w-3.5 h-3.5 text-amber-600" />
                          <span>¿Tienes un cupón de descuento?</span>
                        </div>
                        {appliedCoupon && (
                          <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                            Activo -{appliedCoupon.discountPercentage}%
                          </span>
                        )}
                      </div>

                      {appliedCoupon ? (
                        <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-between gap-2 animate-fade-in">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-extrabold text-xs text-emerald-950 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                              {appliedCoupon.code}
                            </span>
                            <span className="text-xs text-emerald-800 font-semibold">
                              -{appliedCoupon.discountPercentage}% OFF (-${((sub * appliedCoupon.discountPercentage) / 100).toFixed(2)} MXN)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveCoupon}
                            className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                          >
                            Quitar
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={couponInput}
                              onChange={e => {
                                setCouponInput(e.target.value.toUpperCase());
                                if (couponFeedback) setCouponFeedback(null);
                              }}
                              placeholder="Ej. CONYLOVE10, VIKPROMO"
                              className="flex-1 p-2 bg-white border border-gray-300 rounded-lg text-xs font-mono font-bold tracking-wider uppercase text-amber-950 focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                            />
                            <button
                              type="button"
                              onClick={() => handleApplyCoupon()}
                              className="px-3 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                            >
                              Aplicar
                            </button>
                          </div>
                          {couponFeedback && (
                            <p
                              className={`text-[11px] font-medium leading-tight ${
                                couponFeedback.type === 'success' ? 'text-emerald-700' : 'text-rose-600'
                              }`}
                            >
                              {couponFeedback.message}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Propina Voluntaria Configurable por el Comensal */}
                    <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={includeTip}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setIncludeTip(checked);
                              if (checked && (!customTip || Number(customTip) === 0)) {
                                setCustomTip(String(config?.suggestedTip !== undefined ? config.suggestedTip : 10));
                              }
                            }}
                            className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                          />
                          <span className="text-xs font-bold text-emerald-950 flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                            <span>¿Deseas agregar propina para el equipo?</span>
                          </span>
                        </label>
                        <span className="text-[10px] text-gray-500 font-medium">Voluntario</span>
                      </div>

                      {includeTip && (
                        <div className="pt-1.5 space-y-2 animate-fade-in border-t border-emerald-100">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-emerald-900">$</span>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={customTip}
                              onChange={(e) => setCustomTip(e.target.value)}
                              placeholder="0"
                              className="w-20 p-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-emerald-950 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                            />
                            <span className="text-xs text-emerald-800 font-medium">MXN</span>

                            {/* Quick pill options */}
                            <div className="flex items-center gap-1 ml-auto flex-wrap">
                              {[5, 10, 15, 20, 30].map((amt) => (
                                <button
                                  key={amt}
                                  type="button"
                                  onClick={() => setCustomTip(String(amt))}
                                  className={`px-2 py-0.5 text-[11px] font-bold rounded-md border transition-all cursor-pointer ${
                                    Number(customTip) === amt
                                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                      : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'
                                  }`}
                                >
                                  +${amt}
                                </button>
                              ))}
                            </div>
                          </div>
                          <p className="text-[10px] text-emerald-700 leading-tight">
                            ✨ ¡Muchas gracias! Tu propina apoya directamente al personal de cocina y repartidores.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Math Breakdown */}
                    {(() => {
                      const effectiveTip = includeTip
                        ? (parseFloat(customTip) >= 0 && !isNaN(parseFloat(customTip)) ? parseFloat(customTip) : 0)
                        : 0;
                      const discountAmount = appliedCoupon ? (sub * appliedCoupon.discountPercentage) / 100 : 0;
                      const subAfterDiscount = Math.max(0, sub - discountAmount);
                      const deliveryCost = deliveryType === 'domicilio' ? (Number(config?.deliveryFee) || 0) : 0;
                      const estimatedTotal = subAfterDiscount + deliveryCost + effectiveTip;

                      return (
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-1.5 text-xs text-gray-600">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span className="font-bold text-gray-800">${sub.toFixed(2)} MXN</span>
                          </div>
                          {appliedCoupon && discountAmount > 0 && (
                            <div className="flex justify-between items-center text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                              <span className="flex items-center gap-1">
                                <Tag className="w-3 h-3 text-emerald-600" />
                                <span>Descuento Cupón ({appliedCoupon.code} -{appliedCoupon.discountPercentage}%):</span>
                              </span>
                              <span>-${discountAmount.toFixed(2)} MXN</span>
                            </div>
                          )}
                          {deliveryType === 'domicilio' && (
                            <div className="flex justify-between">
                              <span>Envío a Domicilio:</span>
                              <span className="font-bold text-gray-800">${deliveryCost.toFixed(2)} MXN</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center text-xs">
                            <span className={includeTip && effectiveTip > 0 ? "text-emerald-700 font-semibold" : "text-gray-500"}>
                              Propina Voluntaria:
                            </span>
                            {includeTip && effectiveTip > 0 ? (
                              <span className="font-bold text-emerald-600">+${effectiveTip.toFixed(2)} MXN</span>
                            ) : (
                              <span className="text-gray-400 italic">$0.00 MXN</span>
                            )}
                          </div>
                          <div className="flex justify-between text-sm font-bold text-amber-950 pt-2 border-t border-gray-200">
                            <span>TOTAL ESTIMADO:</span>
                            <span className="text-emerald-700 text-base font-extrabold">
                              ${estimatedTotal.toFixed(2)} MXN
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4 stroke-[2.5]" />
                      <span>Confirmar y Enviar Pedido a Cocina 🍳</span>
                    </button>
                    <p className="text-[10.5px] text-gray-400 text-center leading-normal">
                      Al confirmar, tu comanda se registrará en el sistema de cocina Doña Cony y podrás ver tu folio de seguimiento.
                    </p>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
