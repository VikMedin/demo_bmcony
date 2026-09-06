/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { KanbanSquare, CheckCircle, Package, Plus, Star, Volume2, Flame, ArrowRight, Trash2 } from 'lucide-react';
import { FoodOrder, FoodItem, RestoClient } from '../types';

interface AdminKitchenProps {
  orders: FoodOrder[];
  foodItems: FoodItem[];
  clients: RestoClient[];
  onUpdateOrderStatus: (orderId: string, nextStatus: FoodOrder['status']) => void;
  onUpdateStock: (itemId: string, newStock: number) => void;
  onAddCustomDish: (dish: FoodItem) => void;
  triggerToast: (type: 'success' | 'error' | 'info', title: string, description?: string) => void;
}

export const AdminKitchen: React.FC<AdminKitchenProps> = ({
  orders,
  foodItems,
  clients,
  onUpdateOrderStatus,
  onUpdateStock,
  onAddCustomDish,
  triggerToast
}) => {
  const [timeTicker, setTimeTicker] = useState<number>(Date.now());
  const [activeTab, setActiveTab] = useState<'kanban' | 'stock'>('kanban');

  // Stock creator modal state
  const [showDishModal, setShowDishModal] = useState<boolean>(false);
  const [newDishName, setNewDishName] = useState<string>('');
  const [newDishCategory, setNewDishCategory] = useState<string>('Chilaquiles');
  const [newDishPrice, setNewDishPrice] = useState<number>(85);
  const [newDishStock, setNewDishStock] = useState<number>(30);
  const [newDishDesc, setNewDishDesc] = useState<string>('');

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
    if (!newDishName || newDishPrice <= 0 || newDishStock <= 0) {
      triggerToast('error', 'Campos Inválidos', 'Ingresa nombre, precio y porciones válidas.');
      return;
    }

    const newDish: FoodItem = {
      id: `custom-${Date.now()}`,
      name: newDishName,
      description: newDishDesc || 'Platillo especial preparado al momento con ingredientes frescos.',
      price: Number(newDishPrice),
      category: newDishCategory,
      stock: Number(newDishStock),
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600',
      options: [
        { title: 'Acompañamiento', choices: ['Con Cebolla 🧅', 'Sin Cebolla', 'Salsa Aparte 🟢'], multiselect: true }
      ]
    };

    onAddCustomDish(newDish);
    setShowDishModal(false);
    setNewDishName('');
    setNewDishDesc('');
    triggerToast('success', 'Platillo Registrado', `Se agregó ${newDishName} al menú digital.`);
  };

  const receivedOrders = orders.filter(o => o.status === 'recibido');
  const preparingOrders = orders.filter(o => o.status === 'preparando');
  const readyOrders = orders.filter(o => o.status === 'listo');
  const pathOrders = orders.filter(o => o.status === 'camino' || o.status === 'entregado');

  return (
    <div className="space-y-6">
      {/* Tab Selector & Trigger Audio Test */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('kanban')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
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
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'stock'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Package className="w-4 h-4" />
            Módulo de Stock / Inventario
          </button>
        </div>

        <button
          onClick={() => {
            playAlertSound('Demo-01');
            triggerToast('info', 'Alarma Probada', 'Llamando a bocinas integradas de cocina.');
          }}
          className="px-3.5 py-2 border border-amber-200 hover:bg-amber-50 rounded-xl text-xs font-semibold text-amber-950 inline-flex items-center gap-1.5"
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
                  const isStar = clients.find(c => c.phone === order.clientPhone)?.tier === 'estrella' || order.isGolden;

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
                        <div className="flex items-center justify-between">
                          <span className="font-serif font-bold text-sm text-amber-950">
                            {order.orderNumber}
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${sla.badge}`}>
                            SLA: {sla.label}
                          </span>
                        </div>

                        <div>
                          <p className="text-xs font-bold text-gray-800">{order.clientName}</p>
                          <p className="text-[10px] text-gray-500">{order.deliveryType === 'domicilio' ? '🛵 Envío Domicilio' : '🏪 Retira Local'}</p>
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
                  const isStar = clients.find(c => c.phone === order.clientPhone)?.tier === 'estrella' || order.isGolden;

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
                        <div className="flex items-center justify-between">
                          <span className="font-serif font-bold text-sm text-amber-950">
                            {order.orderNumber}
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${sla.badge}`}>
                            En comal: {sla.label}
                          </span>
                        </div>

                        <div>
                          <p className="text-xs font-bold text-gray-800">{order.clientName}</p>
                          <p className="text-[10px] text-gray-500">{order.deliveryType === 'domicilio' ? '🛵 Envío Domicilio' : '🏪 Retira Local'}</p>
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
                          <button
                            onClick={() => onUpdateOrderStatus(order.id, 'listo')}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold inline-flex items-center gap-1 shadow-xs"
                          >
                            Terminar y Avisar Repartidor
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => onUpdateOrderStatus(order.id, 'entregado')}
                            className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[10px] font-bold inline-flex items-center gap-1 shadow-xs"
                          >
                            Entregar al Cliente
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

          {/* Column 3: Listos en Barra & Despachados / Entregados */}
          <div className="space-y-4">
            {/* 3A: Listos en Barra */}
            {readyOrders.length > 0 && (
              <>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <span className="font-bold text-xs text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
                    🛎️ Listos en Barra ({readyOrders.length})
                  </span>
                  <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full animate-pulse">Esperando Repartidor</span>
                </div>
                <div className="space-y-3">
                  {readyOrders.map(order => (
                    <div
                      key={order.id}
                      className="p-4 bg-white border border-emerald-200 rounded-xl shadow-xs space-y-2 border-l-4 border-l-emerald-500"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-serif font-bold text-xs text-amber-950">
                          {order.orderNumber}
                        </span>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Listo (En Barra)
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500">Cliente: <strong className="text-gray-700 font-bold">{order.clientName}</strong></p>
                      
                      <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap justify-end gap-2">
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'preparando')}
                          className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] font-bold inline-flex items-center shadow-xs transition-colors"
                        >
                          Deshacer (A Comal)
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* 3B: Historial Entregas */}
            <div className="p-3 bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-between mt-6">
              <span className="font-bold text-xs text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                📦 Entregas & Salidas ({pathOrders.length})
              </span>
              <span className="text-xs font-semibold bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">Hoy</span>
            </div>

            <div className="space-y-3 min-h-[500px]">
              {pathOrders.length === 0 ? (
                <div className="p-6 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 text-center text-xs text-gray-400">
                  Sin pedidos completados el día de hoy.
                </div>
              ) : (
                pathOrders.map(order => (
                  <div
                    key={order.id}
                    className="p-4 bg-white border border-gray-200 rounded-xl shadow-xs space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-serif font-bold text-xs text-gray-500">
                          {order.orderNumber}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full ${
                            order.status === 'entregado'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-sky-100 text-sky-800'
                          }`}
                        >
                          {order.status === 'entregado' ? 'Completado' : 'En camino 🛵'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-amber-950 mt-1">{order.clientName}</p>
                      <p className="text-[10px] text-gray-500">Monto: ${order.total.toFixed(2)} MXN</p>
                    </div>

                    {order.status === 'camino' ? (
                      <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap justify-end gap-2">
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'preparando')}
                          className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] font-bold inline-flex items-center shadow-xs transition-colors"
                        >
                          Deshacer (A Comal)
                        </button>
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'entregado')}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-xs"
                        >
                          Marcar como Entregado
                        </button>
                      </div>
                    ) : (
                      <div className="mt-2 pt-2 border-t border-gray-100 flex justify-end">
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'preparando')}
                          className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] font-bold inline-flex items-center shadow-xs transition-colors"
                        >
                          Deshacer (A Comal)
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* STOCK / CATALOG MANAGER */
        <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-6" id="stock-manager-view">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif font-bold text-lg text-amber-950">Catálogo de Platillos y Porciones</h3>
              <p className="text-xs text-gray-500">Disminuye de forma automática las raciones con cada pedido. Configura el stock aquí.</p>
            </div>
            
            <button
              onClick={() => setShowDishModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Nuevo Platillo Personalizado
            </button>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="p-4">Platillo</th>
                  <th className="p-4">Categoría</th>
                  <th className="p-4">Precio</th>
                  <th className="p-4 text-center">Porciones Disponibles</th>
                  <th className="p-4">Acompañamientos / Salsas</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {foodItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="p-4 font-bold text-amber-950 flex items-center gap-2">
                      <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-50 border" />
                      <span>{item.name}</span>
                    </td>
                    <td className="p-4 text-gray-500 font-medium">{item.category}</td>
                    <td className="p-4 font-bold text-amber-600">${item.price.toFixed(2)} MXN</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onUpdateStock(item.id, Math.max(0, item.stock - 5))}
                          className="px-2 py-1 border rounded bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold"
                        >
                          -5
                        </button>
                        <span
                          className={`px-3 py-1 rounded-lg font-bold w-12 text-center ${
                            item.stock === 0
                              ? 'bg-rose-100 text-rose-800'
                              : item.stock <= 5
                              ? 'bg-amber-100 text-amber-800 animate-pulse'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {item.stock}
                        </span>
                        <button
                          onClick={() => onUpdateStock(item.id, item.stock + 5)}
                          className="px-2 py-1 border rounded bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold"
                        >
                          +5
                        </button>
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
                      <button
                        onClick={() => onUpdateStock(item.id, 0)}
                        className="text-[10px] text-rose-500 font-bold hover:underline"
                      >
                        Agotar Platillo
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* New Custom Dish Dialog */}
          {showDishModal && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
              <form onSubmit={handleCreateDish} className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 animate-scale-up">
                <div className="p-5 bg-amber-50 border-b border-amber-100 flex justify-between items-center">
                  <h3 className="font-serif font-bold text-base text-amber-950">Nuevo Platillo al Comal</h3>
                  <button type="button" onClick={() => setShowDishModal(false)} className="text-amber-950 hover:text-gray-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
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

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Categoría *</label>
                      <select
                        value={newDishCategory}
                        onChange={e => setNewDishCategory(e.target.value)}
                        className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden bg-white"
                      >
                        <option value="Chilaquiles">Chilaquiles</option>
                        <option value="Huevos">Huevos</option>
                        <option value="Antojitos">Antojitos</option>
                        <option value="Bebidas">Bebidas</option>
                      </select>
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
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Porciones Disponibles en Stock *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newDishStock}
                      onChange={e => setNewDishStock(Number(e.target.value))}
                      className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                    />
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

                <div className="p-5 bg-gray-50 border-t flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDishModal(false)}
                    className="px-4 py-2 border rounded-xl text-xs text-gray-500 hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold"
                  >
                    Dar de Alta
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
