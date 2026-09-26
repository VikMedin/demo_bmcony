/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  KanbanSquare,
  CheckCircle,
  Package,
  Plus,
  Minus,
  Star,
  Volume2,
  Flame,
  ArrowRight,
  Trash2,
  Smartphone,
  MessageSquare,
  Eye,
  EyeOff,
  Edit3,
  History,
  X,
  Search,
  RotateCcw,
  Truck,
  CheckCircle2,
  Clock,
  Filter,
  ShoppingBag
} from 'lucide-react';
import { FoodOrder, FoodItem, RestoClient, BusinessConfig } from '../types';
import { normalizePhone } from '../utils/phoneUtils';
import { buildMessengerWhatsAppUrl } from '../utils/deliveryNotification';

interface AdminKitchenProps {
  orders: FoodOrder[];
  foodItems: FoodItem[];
  clients: RestoClient[];
  onUpdateOrderStatus: (orderId: string, nextStatus: FoodOrder['status']) => void;
  onUpdateStock: (itemId: string, newStock: number) => void;
  onAddCustomDish: (dish: FoodItem) => void;
  onEditDish?: (dish: FoodItem) => void;
  onToggleHideDish?: (itemId: string) => void;
  triggerToast: (type: 'success' | 'error' | 'info', title: string, description?: string) => void;
  config?: BusinessConfig;
}

export const AdminKitchen: React.FC<AdminKitchenProps> = ({
  orders,
  foodItems,
  clients,
  onUpdateOrderStatus,
  onUpdateStock,
  onAddCustomDish,
  onEditDish,
  onToggleHideDish,
  triggerToast,
  config
}) => {
  const [timeTicker, setTimeTicker] = useState<number>(Date.now());
  const [activeTab, setActiveTab] = useState<'kanban' | 'stock'>('kanban');

  const handleNotifyMessengerWhatsApp = (order: FoodOrder) => {
    const phone = config?.deliveryPhone || config?.whatsappPhone || '';
    if (!phone) {
      triggerToast('error', 'Sin teléfono del mensajero', 'Configura el celular del repartidor en Ajustes del Negocio.');
      return;
    }
    const url = buildMessengerWhatsAppUrl(phone, order, config?.businessName);
    window.open(url, '_blank');
    triggerToast('success', 'Aviso Enviado al Móvil', `Abriendo WhatsApp con la comanda #${order.orderNumber} para el mensajero.`);
  };

  const handleNotifyClientReadyWhatsApp = (order: FoodOrder) => {
    const raw = normalizePhone(order.clientPhone || '');
    if (!raw) {
      triggerToast('error', 'Sin Teléfono Registrado', 'Esta comanda no cuenta con teléfono para WhatsApp.');
      return;
    }
    const cleanPhone = raw.length === 10 ? `52${raw}` : raw;
    const businessName = config?.businessName || 'Desayunos Cony';
    const paymentDetail = order.paymentMethod === 'efectivo'
      ? (order.needsChange && order.payingWith
          ? `pago en efectivo al recoger (paga con $${order.payingWith.toFixed(2)} MXN - cambio a entregar: $${(order.changeAmount || 0).toFixed(2)} MXN)`
          : 'pago en efectivo exacto al recoger')
      : 'prepagado por transferencia';
    const text = `*☕ ${businessName.toUpperCase()} — ¡TU PEDIDO ESTÁ LISTO! 🍳*\n\nHola ${order.clientName}, tu comanda *#${order.orderNumber}* ya está lista en barra para que pases a recogerla al mostrador.\n\nTotal: *$${order.total.toFixed(2)} MXN* (${paymentDetail}).\n\n¡Te esperamos con gusto! 😄`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
    triggerToast('success', 'Aviso al Comensal', `Abriendo WhatsApp para avisar a ${order.clientName} que su pedido está listo en mostrador.`);
  };

  // Configurable opening stock from owner
  const openingStock = config?.defaultOpeningStock ?? 25;

  // Stock creator modal state
  const [showDishModal, setShowDishModal] = useState<boolean>(false);
  const [newDishName, setNewDishName] = useState<string>('');
  const [newDishCategory, setNewDishCategory] = useState<string>('Chilaquiles');
  const [isCustomCategory, setIsCustomCategory] = useState<boolean>(false);
  const [customCategoryInput, setCustomCategoryInput] = useState<string>('');
  const [newDishPrice, setNewDishPrice] = useState<number>(85);
  const [newDishStock, setNewDishStock] = useState<number>(openingStock);
  const [newDishDesc, setNewDishDesc] = useState<string>('');
  const [newDishHidden, setNewDishHidden] = useState<boolean>(false);

  // Available categories (default categories + any custom ones found in foodItems)
  const availableCategories = Array.from(
    new Set([
      'Chilaquiles',
      'Huevos',
      'Antojitos',
      'Bebidas',
      ...foodItems.map(f => f.category).filter(Boolean)
    ])
  );

  // Auto-refresh timer to calculate SLA coloring every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeTicker(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Web Audio Context & Speech Synthesis Sound Alert
  const playAlertSound = (orderNum: string) => {
    try {
      // 1. Play synthesized beep
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.35);

      // 2. Play verbal notification
      if ('speechSynthesis' in window) {
        const text = `Atención Cocina: Nuevo pedido recibido ${orderNum}`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-MX';
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.warn('Audio Context restriction by browser permissions:', e);
    }
  };

  // Sound triggering effect for incoming Recibido orders
  const [prevOrdersCount, setPrevOrdersCount] = useState<number>(orders.length);
  useEffect(() => {
    if (orders.length > prevOrdersCount) {
      // Check if any of the new orders is in 'recibido'
      const lastOrder = orders[orders.length - 1];
      if (lastOrder && lastOrder.status === 'recibido') {
        playAlertSound(lastOrder.orderNumber);
        triggerToast(
          'info',
          '🔔 ¡Nueva Comanda!',
          `Orden ${lastOrder.orderNumber} ingresó a cocina. Se activó alarma sonora.`
        );
      }
    }
    setPrevOrdersCount(orders.length);
  }, [orders, prevOrdersCount]);

  // SLA Color computation based on minutes elapsed from creation
  const getSlaDetails = (createdAtIso: string) => {
    const elapsedMs = timeTicker - new Date(createdAtIso).getTime();
    const elapsedMinutes = Math.floor(elapsedMs / 1000 / 60);

    if (elapsedMinutes < 10) {
      return {
        label: `${elapsedMinutes} min (A tiempo)`,
        bgClass: 'bg-emerald-50 border-emerald-200 text-emerald-800 focus-within:ring-emerald-300',
        badge: 'bg-emerald-100 text-emerald-800'
      };
    } else if (elapsedMinutes <= 20) {
      return {
        label: `${elapsedMinutes} min (Retraso Leve)`,
        bgClass: 'bg-amber-50 border-amber-200 text-amber-800 focus-within:ring-amber-300',
        badge: 'bg-amber-100 text-amber-800 animate-pulse'
      };
    } else {
      return {
        label: `${elapsedMinutes} min (¡SLA CRÍTICO!) ⚠️`,
        bgClass: 'bg-rose-50 border-rose-200 text-rose-800 focus-within:ring-rose-300',
        badge: 'bg-rose-100 text-rose-800 animate-bounce'
      };
    }
  };

  const handleCreateDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDishName || newDishPrice <= 0 || newDishStock < 0) {
      triggerToast('error', 'Campos Inválidos', 'Ingresa nombre, precio y porciones válidas.');
      return;
    }

    const finalCategory = (isCustomCategory ? customCategoryInput.trim() : newDishCategory.trim()) || 'General';

    const newDish: FoodItem = {
      id: `custom-${Date.now()}`,
      name: newDishName,
      description: newDishDesc || 'Platillo especial preparado al momento con ingredientes frescos.',
      price: Number(newDishPrice),
      category: finalCategory,
      stock: Number(newDishStock),
      hidden: newDishHidden,
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600',
      options: [
        { title: 'Acompañamiento', choices: ['Con Cebolla 🧅', 'Sin Cebolla', 'Salsa Aparte 🟢'], multiselect: true }
      ]
    };

    onAddCustomDish(newDish);
    setShowDishModal(false);
    setNewDishName('');
    setNewDishDesc('');
    setIsCustomCategory(false);
    setCustomCategoryInput('');
    setNewDishHidden(false);
    triggerToast(
      'success',
      'Platillo Registrado',
      `Se agregó "${newDishName}" en la categoría "${finalCategory}"${newDishHidden ? ' (oculto del menú comensal)' : ''}.`
    );
  };

  // Delivery History Modal & Filter State
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyFilterType, setHistoryFilterType] = useState<'all' | 'domicilio' | 'local'>('all');

  const receivedOrders = orders.filter(o => o.status === 'recibido');
  const preparingOrders = orders.filter(o => o.status === 'preparando');
  const readyOrders = orders.filter(o => o.status === 'listo');
  const onTheWayOrders = orders.filter(o => o.status === 'camino');
  const completedOrders = orders.filter(o => o.status === 'entregado');

  const filteredCompletedOrders = completedOrders.filter(order => {
    if (historyFilterType === 'domicilio' && order.deliveryType !== 'domicilio') return false;
    if (historyFilterType === 'local' && order.deliveryType === 'domicilio') return false;
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase().trim();
    const matchNum = (order.orderNumber || '').toLowerCase().includes(q);
    const matchClient = (order.clientName || '').toLowerCase().includes(q);
    const matchAddr = (order.address || '').toLowerCase().includes(q);
    const matchPhone = (order.clientPhone || '').includes(q);
    const matchItem = order.items.some(it => it.name.toLowerCase().includes(q));
    return matchNum || matchClient || matchAddr || matchPhone || matchItem;
  });

  const totalDeliveredRevenue = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  return (
    <div className="space-y-6">
      {/* Tab Selector & Trigger Audio Test */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('kanban')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'kanban'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <KanbanSquare className="w-4 h-4" />
            Tablero de Comanda (Kanban)
          </button>
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'stock'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Package className="w-4 h-4" />
            Módulo de Stock / Inventario
          </button>
          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300/80 cursor-pointer shadow-xs active:scale-95"
            title="Ver historial de entregas y comandas completadas"
          >
            <History className="w-4 h-4 text-amber-600" />
            <span>Historial de Entregas</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-950">
              {completedOrders.length}
            </span>
          </button>
        </div>

        <button
          onClick={() => {
            playAlertSound('Demo-01');
            triggerToast('info', 'Alarma Probada', 'Llamando a bocinas integradas de cocina.');
          }}
          className="px-3.5 py-2 border border-amber-200 hover:bg-amber-50 rounded-xl text-xs font-semibold text-amber-950 inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Volume2 className="w-4 h-4 text-amber-600" />
          Probar Timbre Cocina
        </button>
      </div>

      {activeTab === 'kanban' ? (
        /* KANBAN BOARD */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="kitchen-kanban-board">
          {/* Column 1: Recibido */}
          <div className="space-y-4">
            <div className="p-3 bg-amber-50/80 border border-amber-100 rounded-xl flex items-center justify-between">
              <span className="font-bold text-xs text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                📥 Recibidos ({receivedOrders.length})
              </span>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            </div>

            <div className="space-y-3 min-h-[500px]">
              {receivedOrders.length === 0 ? (
                <div className="p-6 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 text-center text-xs text-gray-400">
                  Sin comandas nuevas en cola.
                </div>
              ) : (
                receivedOrders.map(order => {
                  const sla = getSlaDetails(order.createdAt);
                  const ordPhone = normalizePhone(order.clientPhone);
                  const isStar = clients.find(c => {
                    const cPhone = normalizePhone(c.phone);
                    return ordPhone && cPhone && ordPhone === cPhone && c.tier === 'estrella';
                  }) !== undefined || order.isGolden;

                  return (
                    <div
                      key={order.id}
                      className={`p-4 rounded-xl border shadow-xs transition-all relative flex flex-col justify-between ${
                        isStar
                          ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400 ring-offset-2'
                          : sla.bgClass
                      }`}
                    >
                      {/* Golden star badge indicator */}
                      {isStar && (
                        <div className="absolute top-3 right-3 bg-amber-500 text-white rounded-full p-1 shadow-sm flex items-center justify-center animate-bounce-short">
                          <Star className="w-4 h-4 fill-white" />
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="font-serif font-bold text-sm text-amber-950">
                            {order.orderNumber}
                          </span>
                          <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${sla.badge}`}>
                            SLA: {sla.label}
                          </span>
                        </div>

                        <div>
                          <p className="text-xs font-bold text-gray-800">{order.clientName}</p>
                          <div className="flex items-center justify-between text-[10px] text-gray-600 mt-0.5">
                            <span>{order.deliveryType === 'domicilio' ? '🛵 Envío Domicilio' : '🏪 Retira Local'}</span>
                            <span className="font-semibold text-amber-950">${order.total.toFixed(2)} MXN • {order.paymentMethod === 'efectivo' ? '💵 Efectivo' : '🏦 Transf.'}</span>
                          </div>
                          {order.paymentMethod === 'efectivo' && (
                            <div className="mt-1">
                              {order.needsChange && order.payingWith ? (
                                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 font-bold px-1.5 py-0.5 rounded text-[9.5px]">
                                  🪙 Paga ${order.payingWith.toFixed(2)} • Cambio: ${(order.changeAmount || 0).toFixed(2)} MXN
                                </span>
                              ) : (
                                <span className="inline-block text-[9.5px] text-emerald-800 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                  ✅ Pago exacto acordado
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {isStar && (
                          <div className="text-[10px] bg-amber-100 text-amber-900 px-2 py-1 rounded-lg font-semibold flex items-center gap-1 border border-amber-200">
                            ⭐ ¡CLIENTE VIP! Incluir cortesía (Café de olla o Galleta artesanal)
                          </div>
                        )}

                        <div className="pt-2 border-t border-gray-200/50 space-y-1">
                          {order.items.map((itm, i) => (
                            <div key={i} className="text-xs text-gray-800 font-medium">
                              {itm.quantity}x <span className="font-bold">{itm.name}</span>
                              {Object.entries(itm.selectedOptions).map(([title, choices]) => (
                                <p key={title} className="text-[10px] text-gray-500 pl-4 italic">
                                  - {title}: {(choices as string[]).join(', ')}
                                </p>
                              ))}
                              {itm.selectedExtras.map(ex => (
                                <p key={ex.name} className="text-[10px] text-amber-700 pl-4">
                                  - Extra: {ex.name}
                                </p>
                              ))}
                            </div>
                          ))}
                        </div>

                        {order.notes && (
                          <p className="text-[10px] bg-white/70 p-2 rounded border text-amber-900 font-medium">
                            📝 {order.notes}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end gap-2">
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'cancelado')}
                          className="px-3.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg text-[10px] font-bold inline-flex items-center shadow-xs transition-colors"
                          title="Cancelar Pedido"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'preparando')}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold inline-flex items-center gap-1 shadow-xs transition-colors"
                        >
                          Comenzar Cocción
                          <Flame className="w-3 h-3 animate-pulse" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Column 2: Preparando */}
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50/80 border border-emerald-100 rounded-xl flex items-center justify-between animate-pulse">
              <span className="font-bold text-xs text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
                🔥 En El Comal ({preparingOrders.length})
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>

            <div className="space-y-3 min-h-[500px]">
              {preparingOrders.length === 0 ? (
                <div className="p-6 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 text-center text-xs text-gray-400">
                  Sin sartenes calientes en comal.
                </div>
              ) : (
                preparingOrders.map(order => {
                  const sla = getSlaDetails(order.createdAt);
                  const ordPhone = normalizePhone(order.clientPhone);
                  const isStar = clients.find(c => {
                    const cPhone = normalizePhone(c.phone);
                    return ordPhone && cPhone && ordPhone === cPhone && c.tier === 'estrella';
                  }) !== undefined || order.isGolden;

                  return (
                    <div
                      key={order.id}
                      className={`p-4 rounded-xl border shadow-xs transition-all relative flex flex-col justify-between ${
                        isStar
                          ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400 ring-offset-1'
                          : sla.bgClass
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="font-serif font-bold text-sm text-amber-950">
                            {order.orderNumber}
                          </span>
                          <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${sla.badge}`}>
                            En comal: {sla.label}
                          </span>
                        </div>

                        <div>
                          <p className="text-xs font-bold text-gray-800">{order.clientName}</p>
                          <div className="flex items-center justify-between text-[10px] text-gray-600 mt-0.5">
                            <span>{order.deliveryType === 'domicilio' ? '🛵 Envío Domicilio' : '🏪 Retira Local'}</span>
                            <span className="font-semibold text-amber-950">${order.total.toFixed(2)} MXN • {order.paymentMethod === 'efectivo' ? '💵 Efectivo' : '🏦 Transf.'}</span>
                          </div>
                          {order.paymentMethod === 'efectivo' && (
                            <div className="mt-1">
                              {order.needsChange && order.payingWith ? (
                                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 font-bold px-1.5 py-0.5 rounded text-[9.5px]">
                                  🪙 Paga ${order.payingWith.toFixed(2)} • Cambio: ${(order.changeAmount || 0).toFixed(2)} MXN
                                </span>
                              ) : (
                                <span className="inline-block text-[9.5px] text-emerald-800 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                  ✅ Pago exacto acordado
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t border-gray-200/50 space-y-1">
                          {order.items.map((itm, i) => (
                            <div key={i} className="text-xs text-gray-800 font-medium">
                              {itm.quantity}x <span className="font-bold">{itm.name}</span>
                              {Object.entries(itm.selectedOptions).map(([title, choices]) => (
                                <p key={title} className="text-[10px] text-gray-500 pl-4 italic">
                                  - {title}: {(choices as string[]).join(', ')}
                                </p>
                              ))}
                              {itm.selectedExtras.map(ex => (
                                <p key={ex.name} className="text-[10px] text-amber-700 pl-4">
                                  - Extra: {ex.name}
                                </p>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap justify-end gap-2">
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'cancelado')}
                          className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg text-[10px] font-bold inline-flex items-center shadow-xs transition-colors"
                          title="Cancelar Pedido"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'recibido')}
                          className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] font-bold inline-flex items-center shadow-xs transition-colors"
                          title="Regresar a Nuevas Órdenes"
                        >
                          Regresar a Nuevas
                        </button>
                        {order.deliveryType === 'domicilio' ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              onClick={() => {
                                onUpdateOrderStatus(order.id, 'listo');
                                triggerToast('success', 'Listo en Barra', `La comanda ${order.orderNumber} está lista para el mensajero.`);
                              }}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold inline-flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              Terminar y Avisar Repartidor
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleNotifyMessengerWhatsApp(order)}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 shadow-xs cursor-pointer"
                              title="Avisar directo al WhatsApp del repartidor"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                              WhatsApp Repartidor
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              onUpdateOrderStatus(order.id, 'listo');
                              triggerToast('success', 'Listo en Barra', `La comanda ${order.orderNumber} pasó a Listos en Barra para entrega en mostrador.`);
                            }}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold inline-flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            Terminar y Pasar a Barra
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Column 3: Listos en Barra & Despachos Activos */}
          <div className="space-y-4">
            {/* 3A: Listos en Barra */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <span className="font-bold text-xs text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
                🛎️ Listos en Barra ({readyOrders.length})
              </span>
              {readyOrders.length > 0 ? (
                <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full animate-pulse">
                  {readyOrders.some(o => o.deliveryType !== 'domicilio') && readyOrders.some(o => o.deliveryType === 'domicilio')
                    ? `${readyOrders.length} por entregar`
                    : readyOrders.some(o => o.deliveryType !== 'domicilio')
                    ? `${readyOrders.length} en mostrador`
                    : 'Esperando Repartidor'}
                </span>
              ) : (
                <span className="text-[10.5px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                  Despejado
                </span>
              )}
            </div>

            {readyOrders.length === 0 ? (
              <div className="p-5 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 text-center text-xs text-gray-400">
                No hay comandas esperando en barra en este momento.
              </div>
            ) : (
              <div className="space-y-3">
                {readyOrders.map(order => {
                  const isLocal = order.deliveryType !== 'domicilio';

                  return (
                    <div
                      key={order.id}
                      className={`p-4 bg-white border rounded-xl shadow-xs space-y-2 border-l-4 ${
                        isLocal ? 'border-amber-200 border-l-amber-500' : 'border-emerald-200 border-l-emerald-500'
                      }`}
                    >
                      <div className="flex flex-col gap-1 items-start">
                        <span className="font-serif font-bold text-sm text-amber-950">
                          {order.orderNumber}
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                            isLocal ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isLocal ? '🏪 Retira en Mostrador / Local' : 'Listo (En Barra)'}
                          </span>
                          {!isLocal && (
                            <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
                              🛵 Envío Domicilio
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-800">Cliente: <strong className="text-gray-900 font-bold">{order.clientName}</strong></p>
                        <div className="flex items-center justify-between text-[10px] text-gray-500 mt-0.5">
                          <span>Cobro: <strong className="text-amber-950 font-bold">${order.total.toFixed(2)} MXN</strong></span>
                          <span className="font-semibold text-gray-600">{order.paymentMethod === 'efectivo' ? '💵 Efectivo' : '🏦 Transf.'}</span>
                        </div>
                        {order.paymentMethod === 'efectivo' && (
                          <div className="mt-1">
                            {order.needsChange && order.payingWith ? (
                              <span className="inline-flex items-center gap-1 bg-amber-900 text-yellow-300 border border-amber-700 font-bold px-1.5 py-0.5 rounded text-[9.5px]">
                                🪙 Paga con ${order.payingWith.toFixed(2)} • Llevar/Dar cambio: ${(order.changeAmount || 0).toFixed(2)} MXN
                              </span>
                            ) : (
                              <span className="inline-block text-[9.5px] text-emerald-800 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                ✅ Pago exacto acordado
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Items breakdown for counter staff verification */}
                      <div className="pt-1.5 border-t border-gray-100 space-y-1">
                        {order.items.map((itm, i) => (
                          <div key={i} className="text-xs text-gray-800 font-medium">
                            {itm.quantity}x <span className="font-bold">{itm.name}</span>
                            {Object.entries(itm.selectedOptions).map(([title, choices]) => (
                              <p key={title} className="text-[10px] text-gray-500 pl-3 italic">
                                - {title}: {(choices as string[]).join(', ')}
                              </p>
                            ))}
                            {itm.selectedExtras.map(ex => (
                              <p key={ex.name} className="text-[10px] text-amber-700 pl-3">
                                - Extra: {ex.name}
                              </p>
                            ))}
                          </div>
                        ))}
                        {order.notes && (
                          <p className="text-[10px] bg-amber-50/70 p-1.5 rounded border border-amber-200/60 text-amber-900 font-medium">
                            📝 {order.notes}
                          </p>
                        )}
                      </div>

                      {/* Action buttons depending on Local vs Domicilio */}
                      <div className="mt-3 pt-2.5 border-t border-gray-100 flex flex-wrap justify-between items-center gap-2">
                        {isLocal ? (
                          /* Local: Personal del local concluye la entrega */
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                onUpdateOrderStatus(order.id, 'entregado');
                                triggerToast('success', '¡Entrega Concluida!', `La comanda ${order.orderNumber} fue entregada al cliente y archivada en Historial.`);
                              }}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold inline-flex items-center gap-1 shadow-xs cursor-pointer"
                              title="Marcar como entregado al comensal en local"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Concluir Entrega al Cliente
                            </button>
                            {order.clientPhone && (
                              <button
                                type="button"
                                onClick={() => handleNotifyClientReadyWhatsApp(order)}
                                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 shadow-xs cursor-pointer"
                                title="Avisar por WhatsApp al cliente que su pedido está listo en mostrador"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                                WhatsApp Comensal
                              </button>
                            )}
                          </div>
                        ) : (
                          /* Domicilio: Avisar repartidor móvil */
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleNotifyMessengerWhatsApp(order)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold inline-flex items-center gap-1 shadow-xs cursor-pointer"
                              title="Enviar comanda completa al WhatsApp móvil del mensajero"
                            >
                              <Smartphone className="w-3 h-3" />
                              Avisar Celular Mensajero
                            </button>
                          </div>
                        )}

                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'preparando')}
                          className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] font-bold inline-flex items-center shadow-xs transition-colors cursor-pointer"
                          title="Regresar comanda a preparación en cocina"
                        >
                          Deshacer (A Comal)
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 3B: Pedidos En Camino (En Reparto) */}
            {onTheWayOrders.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl flex items-center justify-between">
                  <span className="font-bold text-xs text-sky-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-sky-600" />
                    🛵 En Camino / Despachados ({onTheWayOrders.length})
                  </span>
                  <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full animate-pulse">
                    En Reparto
                  </span>
                </div>
                <div className="space-y-2.5">
                  {onTheWayOrders.map(order => (
                    <div
                      key={order.id}
                      className="p-3.5 bg-white border border-sky-200 rounded-xl shadow-2xs space-y-2"
                    >
                      <div className="flex flex-col gap-1 items-start">
                        <span className="font-serif font-bold text-sm text-amber-950">
                          {order.orderNumber}
                        </span>
                        <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                          En camino 🛵
                        </span>
                      </div>
                      <p className="text-xs font-bold text-gray-900">{order.clientName}</p>
                      <p className="text-[10.5px] text-gray-500 leading-tight">{order.address || 'Domicilio'}</p>
                      <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="text-[10px] text-gray-400 font-semibold">Total a cobrar:</span>
                        <span className="font-extrabold text-amber-950">${order.total.toFixed(2)} MXN</span>
                      </div>
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => onUpdateOrderStatus(order.id, 'preparando')}
                          className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          Deshacer (A Comal)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateOrderStatus(order.id, 'entregado');
                            triggerToast('success', '¡Comanda Entregada!', `La orden ${order.orderNumber} pasó al Historial de Entregas.`);
                          }}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Marcar Entregado
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3C: Acceso al Historial de Entregas - Mantiene la pantalla limpia */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowHistoryModal(true)}
                className="w-full p-4 bg-gradient-to-br from-amber-50/90 via-white to-amber-50/70 hover:from-amber-100/90 hover:to-orange-50 border-2 border-dashed border-amber-300 hover:border-amber-400 rounded-2xl text-left transition-all shadow-2xs hover:shadow-xs group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl group-hover:bg-amber-200 group-hover:scale-105 transition-all">
                      <History className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                      <div className="flex flex-col gap-1 items-start">
                        <h4 className="font-serif font-bold text-xs sm:text-sm text-amber-950">
                          Historial de Entregas
                        </h4>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {completedOrders.length} {completedOrders.length === 1 ? 'completada' : 'completadas'}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-gray-500 mt-0.5">
                        {completedOrders.length > 0
                          ? `${completedOrders.length} comanda${completedOrders.length > 1 ? 's' : ''} entregada${completedOrders.length > 1 ? 's' : ''} archivada${completedOrders.length > 1 ? 's' : ''}. Clic para abrir el historial.`
                          : 'Sin entregas completadas hoy. Clic para abrir historial.'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-800 bg-white border border-amber-200 group-hover:bg-amber-500 group-hover:text-white px-3 py-1.5 rounded-xl transition-all shadow-2xs shrink-0">
                    Abrir ↗
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* STOCK / CATALOG MANAGER */
        <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-6" id="stock-manager-view">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-lg text-amber-950">Catálogo de Platillos y Porciones</h3>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Apertura: {openingStock} porc.
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Disminuye de forma automática las raciones con cada pedido. Las porciones de apertura ({openingStock}) son configurables por el dueño en Ajustes del Negocio.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  foodItems.forEach(fi => onUpdateStock(fi.id, openingStock));
                  triggerToast('success', 'Apertura de Menú Aplicada', `Se cargaron ${openingStock} porciones de apertura a todo el catálogo.`);
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                title={`Cargar ${openingStock} porciones a todos los platillos`}
              >
                <Package className="w-3.5 h-3.5" />
                Apertura General ({openingStock} porc.)
              </button>

              <button
                onClick={() => {
                  setNewDishStock(openingStock);
                  setShowDishModal(true);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Nuevo Platillo Personalizado
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="p-4">Platillo</th>
                  <th className="p-4">Categoría</th>
                  <th className="p-4">Precio</th>
                  <th className="p-4 text-center">Menú Comensal</th>
                  <th className="p-4 text-center">Porciones Disponibles</th>
                  <th className="p-4">Acompañamientos / Salsas</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {foodItems.map(item => (
                  <tr key={item.id} className={`hover:bg-gray-50/50 ${item.hidden ? 'bg-gray-50/40' : ''}`}>
                    <td className="p-4 font-bold text-amber-950 flex items-center gap-2">
                      <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-50 border" />
                      <div className="flex flex-col">
                        <span>{item.name}</span>
                        {item.hidden && (
                          <span className="text-[9.5px] font-bold text-gray-400 flex items-center gap-1">
                            <EyeOff className="w-3 h-3 text-gray-400" /> Oculto para clientes
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-gray-500 font-medium">
                      <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/60 font-semibold text-[11px]">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-amber-600 whitespace-nowrap">${item.price.toFixed(2)} MXN</td>
                    <td className="p-4 text-center whitespace-nowrap">
                      {onToggleHideDish ? (
                        <button
                          type="button"
                          onClick={() => onToggleHideDish(item.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold border transition-colors cursor-pointer shadow-2xs ${
                            item.hidden
                              ? 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          }`}
                          title={item.hidden ? 'Platillo oculto. Clic para mostrar a clientes' : 'Platillo visible. Clic para ocultar de clientes'}
                        >
                          {item.hidden ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-gray-500" />
                              <span>Oculto</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Visible</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold border ${
                          item.hidden
                            ? 'bg-gray-100 text-gray-600 border-gray-300'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {item.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          {item.hidden ? 'Oculto' : 'Visible'}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {/* Clean numeric input in exact format from screenshot */}
                      <div className="inline-flex flex-col items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={item.stock}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            onUpdateStock(item.id, val);
                          }}
                          className={`w-24 p-2 text-center font-extrabold text-xs border rounded-xl focus:ring-1 focus:ring-amber-500 focus:outline-hidden transition-all shadow-2xs ${
                            item.stock === 0
                              ? 'bg-rose-50 border-rose-300 text-rose-700'
                              : item.stock <= 5
                              ? 'bg-amber-50 border-amber-300 text-amber-900'
                              : 'bg-white border-gray-200 text-gray-800'
                          }`}
                          title="Porciones disponibles (usa flechas o escribe)"
                        />
                        <span className={`text-[10px] font-semibold ${
                          item.stock === 0
                            ? 'text-rose-600 font-bold'
                            : item.stock <= 5
                            ? 'text-amber-700 font-bold animate-pulse'
                            : 'text-gray-400'
                        }`}>
                          {item.stock === 0 ? 'Agotado' : `${item.stock} porc. activas`}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-400">
                      {item.options?.map(op => (
                        <span key={op.title} className="inline-block text-[9px] bg-amber-50 text-amber-900 px-1.5 py-0.5 rounded border border-amber-100 font-medium mr-1 mb-1">
                          {op.title}
                        </span>
                      ))}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex flex-col items-end gap-1.5">
                        <button
                          onClick={() => {
                            onUpdateStock(item.id, openingStock);
                            triggerToast('success', 'Porción Restablecida', `${item.name}: ${openingStock} porciones.`);
                          }}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer shadow-2xs"
                          title={`Cargar ${openingStock} porciones de apertura configuradas por el dueño`}
                        >
                          Apertura ({openingStock})
                        </button>
                        <button
                          onClick={() => {
                            onUpdateStock(item.id, 0);
                            triggerToast('info', 'Platillo Agotado', `${item.name} marcado como agotado.`);
                          }}
                          className="text-[10px] text-rose-500 hover:text-rose-700 font-bold hover:underline cursor-pointer"
                          title="Agotar platillo en el comal"
                        >
                          Agotar (0)
                        </button>
                        {onEditDish && (
                          <button
                            type="button"
                            onClick={() => onEditDish(item)}
                            className="text-[10px] text-amber-700 hover:text-amber-900 font-bold hover:underline cursor-pointer flex items-center gap-1 mt-0.5"
                            title="Editar nombre, precio, categoría, foto, opciones y visibilidad"
                          >
                            <Edit3 className="w-3 h-3 text-amber-600" />
                            Editar Platillo
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* New Custom Dish Dialog */}
          {showDishModal && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
              <form onSubmit={handleCreateDish} className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 animate-scale-up max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] flex flex-col my-auto">
                <div className="p-4 sm:p-5 bg-amber-50 border-b border-amber-100 flex justify-between items-center shrink-0">
                  <h3 className="font-serif font-bold text-base text-amber-950">Nuevo Platillo al Comal</h3>
                  <button type="button" onClick={() => setShowDishModal(false)} className="text-amber-950 hover:text-gray-500 cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 sm:p-6 space-y-4 flex-1 min-h-0 overflow-y-auto overscroll-contain">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre del Guiso *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Enchiladas Suizas"
                      value={newDishName}
                      onChange={e => setNewDishName(e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-gray-600">Categoría *</label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomCategory(!isCustomCategory);
                            if (!isCustomCategory) {
                              setCustomCategoryInput('');
                            }
                          }}
                          className="text-[10px] font-bold text-amber-600 hover:text-amber-800 underline cursor-pointer"
                        >
                          {isCustomCategory ? '← Lista existente' : '+ Personalizar'}
                        </button>
                      </div>

                      {isCustomCategory ? (
                        <input
                          type="text"
                          required
                          placeholder="Escribe nueva categoría..."
                          value={customCategoryInput}
                          onChange={e => setCustomCategoryInput(e.target.value)}
                          className="w-full p-2.5 border border-amber-400 bg-amber-50/50 rounded-xl text-xs font-bold text-amber-950 focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                          autoFocus
                        />
                      ) : (
                        <select
                          value={newDishCategory}
                          onChange={e => {
                            if (e.target.value === '__NEW__') {
                              setIsCustomCategory(true);
                              setCustomCategoryInput('');
                            } else {
                              setNewDishCategory(e.target.value);
                            }
                          }}
                          className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden bg-white cursor-pointer"
                        >
                          {availableCategories.map(cat => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                          <option value="__NEW__" className="font-bold text-amber-600">
                            + Otra categoría personalizada...
                          </option>
                        </select>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Precio Unitario ($ MXN) *</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={newDishPrice}
                        onChange={e => setNewDishPrice(Number(e.target.value))}
                        className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center justify-between">
                      <span>Porciones Disponibles en Stock *</span>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Apertura: {openingStock}
                      </span>
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step="1"
                      value={newDishStock}
                      onChange={e => setNewDishStock(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                      placeholder={`Ej. ${openingStock}`}
                    />
                    <p className="text-[9px] text-gray-400 mt-1">
                      Cantidad de porciones para iniciar (predeterminado de apertura configurado por el dueño: {openingStock}).
                    </p>
                  </div>

                  {/* Opción de ocultar platillo del menú */}
                  <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className={`p-2 rounded-lg ${newDishHidden ? 'bg-amber-200/80 text-amber-900' : 'bg-emerald-100 text-emerald-800'}`}>
                        {newDishHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">
                          Ocultar platillo del menú
                        </span>
                        <p className="text-[10px] text-gray-500">
                          {newDishHidden
                            ? 'Oculto: Los comensales NO lo verán en el menú digital (solo cocina y caja).'
                            : 'Visible: Los comensales podrán ordenarlo desde el menú digital.'}
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={newDishHidden}
                        onChange={e => setNewDishHidden(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-gray-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción de Preparación</label>
                    <textarea
                      rows={2}
                      placeholder="Indica de qué va acompañado..."
                      value={newDishDesc}
                      onChange={e => setNewDishDesc(e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="p-3.5 sm:p-4 bg-gray-50 border-t flex justify-end gap-3 shrink-0 sticky bottom-0 z-10 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
                  <button
                    type="button"
                    onClick={() => setShowDishModal(false)}
                    className="px-4 py-2 border border-gray-300 hover:bg-gray-100 rounded-xl text-xs text-gray-600 cursor-pointer font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-bold cursor-pointer shadow-md"
                  >
                    Dar de Alta
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
      {/* HISTORIAL DE ENTREGAS Y COMANDAS COMPLETADAS MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full border border-amber-200/80 shadow-2xl flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] overflow-hidden animate-fade-in my-auto">
            {/* STICKY MODAL HEADER */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-150 bg-gradient-to-r from-amber-50/60 via-white to-orange-50/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 text-amber-800 rounded-2xl shadow-2xs">
                  <History className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base sm:text-lg text-amber-950 flex items-center gap-2 leading-tight">
                    <span>Historial de Entregas & Salidas</span>
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {completedOrders.length} {completedOrders.length === 1 ? 'comanda' : 'comandas'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Comandas completadas y despachadas archivadas para mantener despejado el tablero activo de cocina.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QUICK STATS STRIP */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 sm:px-6 bg-gray-50/80 border-b border-gray-150 shrink-0">
              <div className="bg-white p-3 rounded-2xl border border-gray-200/70 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Comandas:</span>
                <p className="text-lg font-extrabold text-amber-950 mt-0.5">{completedOrders.length} entregadas</p>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-gray-200/70 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Facturado / Cobrado:</span>
                <p className="text-lg font-extrabold text-emerald-700 mt-0.5">${totalDeliveredRevenue.toFixed(2)} MXN</p>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-gray-200/70 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Tipo de Entrega:</span>
                <p className="text-xs font-bold text-gray-700 mt-1">
                  🛵 {completedOrders.filter(o => o.deliveryType === 'domicilio').length} a domicilio · 🏪 {completedOrders.filter(o => o.deliveryType !== 'domicilio').length} en local
                </p>
              </div>
            </div>

            {/* SEARCH & FILTER CONTROLS */}
            <div className="p-4 sm:px-6 border-b border-gray-150 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por # orden, cliente, platillo..."
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-1 focus:ring-amber-500 focus:outline-hidden transition-all"
                />
                {historySearch && (
                  <button
                    type="button"
                    onClick={() => setHistorySearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setHistoryFilterType('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    historyFilterType === 'all'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Todas ({completedOrders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilterType('domicilio')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    historyFilterType === 'domicilio'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  🛵 Domicilio ({completedOrders.filter(o => o.deliveryType === 'domicilio').length})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilterType('local')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    historyFilterType === 'local'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  🏪 Local ({completedOrders.filter(o => o.deliveryType !== 'domicilio').length})
                </button>
              </div>
            </div>

            {/* SCROLLABLE LIST OF COMPLETED ORDERS */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 bg-gray-50/50">
              {filteredCompletedOrders.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-200 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                    <History className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif font-bold text-sm text-gray-800">
                    {completedOrders.length === 0
                      ? 'Sin comandas entregadas el día de hoy'
                      : 'No se encontraron resultados con ese criterio'}
                  </h4>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto leading-normal">
                    {completedOrders.length === 0
                      ? 'Cuando marques pedidos como "Entregado", se moverán de la pantalla principal a este historial para mantener limpio el tablero de cocina.'
                      : 'Intenta con otro término de búsqueda o limpia el filtro actual.'}
                  </p>
                </div>
              ) : (
                filteredCompletedOrders.map(order => (
                  <div
                    key={order.id}
                    className="p-4 bg-white border border-gray-200/90 hover:border-amber-300 rounded-2xl shadow-2xs hover:shadow-xs transition-all space-y-3"
                  >
                    <div className="flex flex-col gap-1.5 pb-2.5 border-b border-gray-100">
                      {/* Línea 1: Número de Comanda y Cliente */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-serif font-extrabold text-sm text-amber-950 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/80">
                          {order.orderNumber}
                        </span>
                        <span className="text-gray-300">•</span>
                        <h4 className="font-bold text-xs sm:text-sm text-gray-900 leading-tight">
                          {order.clientName}
                        </h4>
                      </div>

                      {/* Línea 2: Avisos de Estatus y Tipo de Entrega (Lectura de corrido de izquierda a derecha) */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Completado
                        </span>

                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          order.deliveryType === 'domicilio'
                            ? 'bg-sky-50 text-sky-800 border-sky-200'
                            : 'bg-purple-50 text-purple-800 border-purple-200'
                        }`}>
                          {order.deliveryType === 'domicilio' ? '🛵 A Domicilio' : '🏪 Local / Mostrador'}
                        </span>

                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                          {order.paymentMethod === 'efectivo' ? '💵 Efectivo' : '🏦 Transferencia'}
                          {order.paymentMethod === 'efectivo' && order.needsChange && order.payingWith && (
                            <span className="text-amber-900 font-bold ml-1">
                              (Paga ${order.payingWith.toFixed(2)} • Cambio ${(order.changeAmount || 0).toFixed(2)})
                            </span>
                          )}
                        </span>

                        <span className="text-[10px] text-gray-400 flex items-center gap-1 ml-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Order Details & Items */}
                    <div className="text-xs text-gray-700 space-y-2">
                      {order.address && order.deliveryType === 'domicilio' && (
                        <p className="text-[11px] text-gray-500">
                          <strong className="text-gray-700 font-semibold">Dirección:</strong> {order.address}
                        </p>
                      )}

                      <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-150 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                          Platillos Preparados:
                        </span>
                        {order.items.map((itm, i) => (
                          <div key={i} className="text-xs text-gray-800">
                            <span className="font-bold text-amber-950">{itm.quantity}x</span> {itm.name}
                            {Object.entries(itm.selectedOptions || {}).map(([optName, choices]) => (
                              <span
                                key={optName}
                                className="text-[11.5px] text-gray-500 pl-1.5 italic"
                                style={{ fontSize: '11.5px' }}
                              >
                                ({optName}: {(choices as string[]).join(', ')})
                              </span>
                            ))}
                            {(itm.selectedExtras || []).map(ex => (
                              <span
                                key={ex.name}
                                className="text-[11.5px] text-amber-700 pl-1.5 font-medium"
                                style={{ fontSize: '11.5px' }}
                              >
                                [+Extra: {ex.name}]
                              </span>
                            ))}
                          </div>
                        ))}
                      </div>

                      {order.notes && (
                        <div className="p-2 bg-amber-50/60 rounded-xl border border-amber-150 text-[10.5px] text-amber-900 italic">
                          <strong>Nota:</strong> {order.notes}
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-400 font-medium">Total:</span>
                        <span className="font-extrabold text-base text-amber-950">
                          ${order.total.toFixed(2)} MXN
                        </span>
                      </div>

                      {/* UNDO / REVERT ACTION */}
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateOrderStatus(order.id, 'preparando');
                          triggerToast('info', 'Comanda Restaurada al Comal', `La orden ${order.orderNumber} regresó a preparación en cocina.`);
                        }}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-amber-100 hover:text-amber-900 text-gray-700 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Regresar comanda a preparación si se marcó como entregada por error"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                        <span>Deshacer (Regresar a Comal)</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* STICKY FOOTER */}
            <div className="p-4 sm:px-6 border-t border-gray-150 bg-white flex items-center justify-between shrink-0">
              <span className="text-xs text-gray-500 font-medium">
                Mostrando {filteredCompletedOrders.length} de {completedOrders.length} comandas archivadas
              </span>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Cerrar Historial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
