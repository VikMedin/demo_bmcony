/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Map,
  Phone,
  MessageSquare,
  Check,
  Navigation,
  AlertCircle,
  ShoppingBag,
  Truck,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Smartphone,
  Send,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Flame,
  Clock,
  History,
  X,
  Search,
  RotateCcw,
  Utensils,
  Coins
} from 'lucide-react';
import { FoodOrder, BusinessConfig } from '../types';
import {
  playDeliverySound,
  triggerDeliveryVibration,
  requestDeliveryNotificationPermission,
  showDeliveryNativeNotification,
  notifyMessengerMobile,
  buildMessengerWhatsAppUrl
} from '../utils/deliveryNotification';
import { normalizePhone } from '../utils/phoneUtils';

interface AdminRepartidorProps {
  orders: FoodOrder[];
  onUpdateOrderStatus: (orderId: string, nextStatus: FoodOrder['status']) => void;
  triggerToast: (type: 'success' | 'error' | 'info', title: string, description?: string) => void;
  currentRole?: string;
  config?: BusinessConfig;
}

export const AdminRepartidor: React.FC<AdminRepartidorProps> = ({
  orders,
  onUpdateOrderStatus,
  triggerToast,
  currentRole = 'mensajero',
  config
}) => {
  // Notification & Audio Preferences
  const [notifPermission, setNotifPermission] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cony_messenger_sound');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cony_messenger_vibration');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  // Track orders that have already fired an alert
  const alertedOrderIdsRef = useRef<Set<string>>(new Set());
  const [activeAlertOrder, setActiveAlertOrder] = useState<FoodOrder | null>(null);

  // Orders ready to be picked up from kitchen (status: 'listo')
  const readyToPickUp = orders.filter(o => o.status === 'listo' && o.deliveryType === 'domicilio');
  // Orders already on their way (status: 'camino')
  const activeDeliveries = orders.filter(o => o.status === 'camino');
  // Completed deliveries of the day (status: 'entregado')
  const completedDeliveries = orders.filter(o => o.status === 'entregado' && o.deliveryType === 'domicilio');

  const totalPending = readyToPickUp.length + activeDeliveries.length;

  // History modal & search state
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [historySearch, setHistorySearch] = useState<string>('');

  const filteredCompletedDeliveries = completedDeliveries.filter(order => {
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase().trim();
    const matchNum = (order.orderNumber || '').toLowerCase().includes(q);
    const matchClient = (order.clientName || '').toLowerCase().includes(q);
    const matchAddr = (order.address || '').toLowerCase().includes(q);
    return matchNum || matchClient || matchAddr;
  });

  const totalCashCollected = completedDeliveries
    .filter(o => o.paymentMethod === 'efectivo')
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const totalTransferCollected = completedDeliveries
    .filter(o => o.paymentMethod !== 'efectivo')
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const totalCollected = totalCashCollected + totalTransferCollected;

  // Real-time listener: Trigger mobile alert (sound + vibration + native push) when new delivery orders become ready
  useEffect(() => {
    // Check if there is any ready order that hasn't triggered an alert yet
    const unalertedReady = readyToPickUp.find(o => !alertedOrderIdsRef.current.has(o.id));

    if (unalertedReady) {
      alertedOrderIdsRef.current.add(unalertedReady.id);
      setActiveAlertOrder(unalertedReady);

      // Trigger mobile vibration if enabled
      if (vibrationEnabled) {
        triggerDeliveryVibration();
      }

      // Play audio chime and voice announcement if enabled
      if (soundEnabled) {
        playDeliverySound(unalertedReady.orderNumber, unalertedReady.clientName);
      }

      // Show native system push notification on phone
      if (notifPermission === 'granted') {
        showDeliveryNativeNotification(unalertedReady);
      }

      triggerToast(
        'info',
        '🛵 ¡Nuevo Pedido por Entregar!',
        `Comanda #${unalertedReady.orderNumber} para ${unalertedReady.clientName} lista en barra.`
      );
    }
  }, [readyToPickUp, vibrationEnabled, soundEnabled, notifPermission, triggerToast]);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('cony_messenger_sound', String(next));
    if (next) {
      playDeliverySound();
      triggerToast('success', 'Sonido Activado', 'Escucharás un timbre cuando haya pedidos listos.');
    } else {
      triggerToast('info', 'Sonido Silenciado', 'Se desactivaron las alertas sonoras.');
    }
  };

  const handleToggleVibration = () => {
    const next = !vibrationEnabled;
    setVibrationEnabled(next);
    localStorage.setItem('cony_messenger_vibration', String(next));
    if (next) {
      triggerDeliveryVibration();
      triggerToast('success', 'Vibración Activada', 'Tu celular vibrará con cada pedido por entregar.');
    } else {
      triggerToast('info', 'Vibración Desactivada', 'Se desactivaron las alertas por vibración.');
    }
  };

  const handleRequestNotification = async () => {
    const res = await requestDeliveryNotificationPermission();
    setNotifPermission(res);
    if (res === 'granted') {
      triggerToast(
        'success',
        '🔔 Notificaciones Móviles Habilitadas',
        'Tu teléfono te avisará cuando haya pedidos listos, incluso con la pantalla bloqueada.'
      );
      if (readyToPickUp[0]) {
        showDeliveryNativeNotification(readyToPickUp[0]);
      }
    } else if (res === 'denied') {
      triggerToast(
        'error',
        'Permiso Denegado',
        'Habilita las notificaciones en los ajustes de tu navegador móvil para recibir avisos de entrega.'
      );
    }
  };

  const handleTestAlert = () => {
    if (vibrationEnabled) {
      triggerDeliveryVibration();
    }
    if (soundEnabled) {
      playDeliverySound('CONY-DEMO', 'Prueba Móvil');
    }
    if (notifPermission === 'granted') {
      showDeliveryNativeNotification({
        id: 'test-demo',
        orderNumber: 'DEMO-77',
        clientName: 'Prueba Repartidor',
        clientPhone: '5512345678',
        address: 'Calle Juárez #123, Col. Centro',
        deliveryType: 'domicilio',
        items: [],
        subtotal: 150,
        deliveryFee: 15,
        tip: 10,
        total: 175,
        paymentMethod: 'efectivo',
        status: 'listo',
        createdAt: new Date().toISOString(),
        slaLimitTime: new Date().toISOString()
      });
    }
    triggerToast(
      'success',
      '🛵 Prueba de Alerta Móvil Enviada',
      'Se ejecutó el timbre, la voz de aviso y la vibración en tu dispositivo.'
    );
  };

  const openGoogleMaps = (address: string) => {
    const encoded = encodeURIComponent(address);
    const url = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
    window.open(url, '_blank');
    triggerToast('info', 'Google Maps abierto', 'Redirigiendo a tu navegador para iniciar GPS.');
  };

  const handleCallClient = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`tel:${cleanPhone}`, '_self');
    triggerToast('info', 'Llamando por Teléfono', `Disparando llamada celular al ${phone}.`);
  };

  const handleWhatsAppClient = (order: FoodOrder) => {
    const cleanDigits = normalizePhone(order.clientPhone);
    const waPhone = cleanDigits.length === 10 ? `52${cleanDigits}` : cleanDigits;
    const paymentNotice = order.paymentMethod === 'efectivo'
      ? (order.needsChange && order.payingWith
          ? `en efectivo. Llevo tu cambio de *$${(order.changeAmount || 0).toFixed(2)} MXN* para tu billete de *$${order.payingWith.toFixed(2)} MXN*`
          : 'en efectivo exacto')
      : 'por transferencia bancaria';
    const text = `*🛵 REPARTIDOR DE DESAYUNOS CONY 🛵*\n\nHola ${order.clientName}, estoy en camino con tu desayuno calientito. Estaré ahí en unos minutos. ¡Por favor ten listo tu pago de *$${order.total.toFixed(2)} MXN* (${paymentNotice})! 😄🍳`;
    const encoded = encodeURIComponent(text);
    const url = `https://wa.me/${waPhone}?text=${encoded}`;
    window.open(url, '_blank');
    triggerToast('success', 'Mensaje de WhatsApp', 'Redirigiendo a chat con cliente.');
  };

  const handleShareToMessengerWhatsApp = (order: FoodOrder) => {
    const phone = config?.deliveryPhone || config?.whatsappPhone || '';
    if (!phone) {
      triggerToast('error', 'Sin número de mensajero', 'Configura el celular del repartidor en Ajustes del Negocio.');
      return;
    }
    const url = buildMessengerWhatsAppUrl(phone, order, config?.businessName);
    window.open(url, '_blank');
    triggerToast('success', 'Comanda Enviada por WhatsApp', 'Abriendo WhatsApp con la orden completa para el mensajero.');
  };

  return (
    <div className="max-w-md mx-auto py-3 px-2 space-y-4" id="deliverer-mobile-view">
      {/* Smartphone layout header */}
      <div className="bg-gradient-to-br from-amber-950 via-amber-900 to-amber-950 text-white rounded-2xl p-5 shadow-xl flex flex-col gap-2 relative overflow-hidden border border-amber-800/40">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/15 rounded-full blur-2xl"></div>
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-3 py-1 rounded-full">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
            <span>Mensajero Conectado</span>
          </div>

          {/* Quick Sound/Vibration Toggles */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToggleSound}
              className={`p-2 rounded-xl transition-all ${
                soundEnabled
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
              title={soundEnabled ? 'Sonido de aviso activado' : 'Sonido silenciado'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={handleToggleVibration}
              className={`p-2 rounded-xl transition-all ${
                vibrationEnabled
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
              title={vibrationEnabled ? 'Vibración móvil activada' : 'Vibración desactivada'}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-serif font-extrabold flex items-center gap-2">
            <span>Ruta del Mensajero</span>
            <span className="text-sm">🛵</span>
          </h2>
          <p className="text-[11px] text-amber-200/90">
            Avisos en tiempo real con sonido, vibración y ruta directa a clientes.
          </p>
        </div>
      </div>

      {/* URGENT FLOATING ALERT BANNER (When an order just became ready) - Sin animaciones que muevan los botones */}
      {activeAlertOrder && activeAlertOrder.status === 'listo' && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-2xl p-4 sm:p-5 shadow-xl border-2 border-amber-300 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-white text-amber-600 rounded-full font-bold shadow-xs">
                <BellRing className="w-5 h-5 text-amber-600" />
              </span>
              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-white/25 px-2 py-0.5 rounded">
                  ¡Nuevo Pedido en Barra!
                </span>
                <h3 className="font-serif font-extrabold text-base sm:text-lg leading-tight mt-0.5">
                  Comanda #{activeAlertOrder.orderNumber}
                </h3>
              </div>
            </div>
            <button
              onClick={() => setActiveAlertOrder(null)}
              className="text-xs text-white/90 hover:text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer"
            >
              Cerrar aviso
            </button>
          </div>

          <div className="bg-black/20 p-3 rounded-xl text-xs space-y-2">
            <div className="flex justify-between items-start gap-2 flex-wrap">
              <div>
                <p className="text-[11px] text-amber-100 uppercase font-semibold">Cliente:</p>
                <p className="font-bold text-sm text-white">{activeAlertOrder.clientName}</p>
                {activeAlertOrder.address && (
                  <p className="text-[11px] text-white/90 mt-0.5">
                    <strong>Dirección:</strong> {activeAlertOrder.address}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-[11px] text-amber-100 uppercase font-semibold">Total a cobrar:</p>
                <p className="text-xl font-extrabold text-white">${activeAlertOrder.total.toFixed(2)} MXN</p>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded bg-white text-amber-950 inline-block mt-0.5 shadow-2xs">
                  {activeAlertOrder.paymentMethod === 'efectivo' ? '💵 Efectivo (Cobrar)' : '🏦 Transferencia (Prepagado)'}
                </span>
                {activeAlertOrder.paymentMethod === 'efectivo' && (
                  <div className="mt-1">
                    {activeAlertOrder.needsChange && activeAlertOrder.payingWith ? (
                      <span className="inline-block bg-amber-900/90 text-yellow-300 border border-yellow-400 font-extrabold text-[10px] px-2 py-0.5 rounded shadow-xs">
                        🪙 LLEVAR CAMBIO: ${(activeAlertOrder.changeAmount || 0).toFixed(2)} MXN (Paga con ${activeAlertOrder.payingWith.toFixed(2)})
                      </span>
                    ) : (
                      <span className="inline-block bg-white/20 text-white font-semibold text-[9.5px] px-2 py-0.5 rounded">
                        ✅ Pago exacto acordado
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Platillos en alerta */}
            {activeAlertOrder.items && activeAlertOrder.items.length > 0 && (
              <div className="border-t border-white/20 pt-2 space-y-1.5">
                <p className="text-[10px] uppercase font-extrabold tracking-wider text-amber-200 flex items-center gap-1">
                  <Utensils className="w-3 h-3" />
                  <span>Platillos a Entregar:</span>
                </p>
                {activeAlertOrder.items.map((itm, i) => (
                  <div key={i} className="text-xs text-white">
                    <p className="font-extrabold text-sm">{itm.quantity}x {itm.name}</p>
                    {Object.entries(itm.selectedOptions || {}).map(([title, choices]) => (
                      <p key={title} className="text-[10px] text-amber-100/90 pl-3 italic">
                        - {title}: {(choices as string[]).join(', ')}
                      </p>
                    ))}
                    {(itm.selectedExtras || []).map(ex => (
                      <p key={ex.name} className="text-[10px] text-amber-200 pl-3">
                        + Extra: {ex.name}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                onUpdateOrderStatus(activeAlertOrder.id, 'camino');
                setActiveAlertOrder(null);
                triggerToast('success', '📦 Pedido Tomado', `Comanda #${activeAlertOrder.orderNumber} en camino.`);
              }}
              className="py-3 bg-white hover:bg-amber-50 text-amber-950 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all cursor-pointer"
            >
              <Truck className="w-4 h-4 text-amber-700" />
              <span>Tomar Comanda</span>
            </button>

            <button
              onClick={() => activeAlertOrder.address && openGoogleMaps(activeAlertOrder.address)}
              className="py-3 bg-amber-950/80 hover:bg-amber-950 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer"
            >
              <Navigation className="w-4 h-4 text-amber-400" />
              <span>Ver en GPS</span>
            </button>
          </div>
        </div>
      )}

      {/* MOBILE NOTIFICATION & VIBRATION CONFIGURATION STRIP */}
      <div className="bg-white border border-amber-200/80 rounded-2xl p-3.5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 text-amber-900 rounded-xl">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-950">Avisos al Móvil del Repartidor</h4>
              <p className="text-[10.5px] text-gray-500">
                {notifPermission === 'granted'
                  ? '✅ Alertas en pantalla, vibración y voz habilitadas'
                  : notifPermission === 'denied'
                  ? '⚠️ Notificaciones bloqueadas en el navegador'
                  : '🔔 Toca abajo para activar avisos en tu celular'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {notifPermission !== 'granted' && (
            <button
              type="button"
              onClick={handleRequestNotification}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Activar Notificaciones en este Celular</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleTestAlert}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-[11px] font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Probar Timbre y Vibración</span>
          </button>
        </div>
      </div>

      {/* DELIVERY SUMMARY CARD */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-amber-700" />
            Resumen de Entregas
          </span>
          <span className="px-3 py-1 bg-amber-600 text-white text-[11px] font-extrabold rounded-full shadow-xs">
            {totalPending} pendientes
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="bg-white p-3 rounded-xl border border-amber-100 shadow-2xs">
            <p className="text-gray-400 font-semibold uppercase text-[9px]">Por Recoger en Cocina:</p>
            <p className="text-base font-extrabold text-amber-950 mt-0.5">{readyToPickUp.length} comandas</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-amber-100 shadow-2xs">
            <p className="text-gray-400 font-semibold uppercase text-[9px]">En Tránsito (Mochila):</p>
            <p className="text-base font-extrabold text-amber-950 mt-0.5">{activeDeliveries.length} comandas</p>
          </div>
        </div>

        {/* Quick button to view completed deliveries */}
        <button
          type="button"
          onClick={() => setShowHistoryModal(true)}
          className="w-full py-2.5 px-3 bg-white hover:bg-amber-100/70 text-amber-950 border border-amber-300 rounded-xl text-xs font-bold flex items-center justify-between transition-colors shadow-2xs cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <History className="w-4 h-4 text-amber-600" />
            <span>Historial de Entregas Realizadas</span>
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
            {completedDeliveries.length} entregadas ↗
          </span>
        </button>

        {currentRole !== 'mensajero' && (
          <p className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl font-medium leading-normal">
            💡 <strong>Modo Administrador Activo:</strong> Estás visualizando esto como rol directivo ({currentRole}). Tienes permisos completos para tomar de cocina y marcar entregas tal como el repartidor oficial.
          </p>
        )}
      </div>

      {/* SECTION 1: READY TO PICK UP (Por Recoger de Cocina) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-serif font-bold text-sm text-amber-950 flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-amber-700" />
            <span>1. Listos en Cocina (Por Recoger)</span>
          </h3>
          {readyToPickUp.length > 0 && (
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full animate-pulse">
              {readyToPickUp.length} listos
            </span>
          )}
        </div>

        {readyToPickUp.length === 0 ? (
          <p className="text-xs text-gray-400 italic bg-white p-5 rounded-2xl text-center border border-gray-200 shadow-2xs">
            No hay nuevos pedidos listos por recoger en la barra de cocina en este momento.
          </p>
        ) : (
          <div className="space-y-3">
            {readyToPickUp.map(order => (
              <div key={order.id} className="bg-white border-2 border-amber-400/60 rounded-2xl p-4 space-y-3 shadow-md">
                <div className="flex flex-col gap-1 pb-2.5 border-b border-gray-100">
                  {/* Línea 1: Número de Comanda y Cliente */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-serif font-extrabold text-base text-amber-950">{order.orderNumber}</h4>
                    <span className="text-gray-300">•</span>
                    <p className="text-xs text-gray-700">Cliente: <strong className="font-bold text-gray-900">{order.clientName}</strong></p>
                  </div>
                  {/* Línea 2: Aviso de Estatus (Lectura de corrido de izquierda a derecha) */}
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded-lg border border-amber-200">
                      Listo en barra
                    </span>
                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/50">
                      Por Recoger
                    </span>
                  </div>
                </div>

                {/* PLATILLOS DE LA COMANDA: Nombre en tipografía alta, descripción pequeña */}
                <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/80 space-y-2">
                  <p className="text-[10.5px] font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-amber-700" />
                    <span>Platillos a Entregar ({order.items.reduce((acc, itm) => acc + itm.quantity, 0)} pzas):</span>
                  </p>
                  <div className="space-y-2 divide-y divide-amber-200/50">
                    {order.items.map((itm, i) => (
                      <div key={i} className={i > 0 ? 'pt-2' : ''}>
                        {/* Nombre del platillo: Tipografía alta y visible a primera vista */}
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-extrabold text-[22px] leading-[42px] text-amber-950">
                            {itm.quantity}x {itm.name}
                          </p>
                        </div>
                        {/* Opciones y extras: Descripción más pequeña */}
                        {Object.entries(itm.selectedOptions || {}).map(([title, choices]) => (
                          <p key={title} className="text-[11px] text-gray-600 pl-3 italic mt-0.5 leading-snug">
                            - {title}: {(choices as string[]).join(', ')}
                          </p>
                        ))}
                        {(itm.selectedExtras || []).map(ex => (
                          <p key={ex.name} className="text-[11px] text-amber-800 font-medium pl-3 mt-0.5 leading-snug">
                            + Extra: {ex.name}
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-gray-700 space-y-1.5">
                  <div>
                    <p className="text-[9.5px] text-gray-400 uppercase font-bold">Dirección de Entrega:</p>
                    <p className="text-gray-900 font-bold leading-normal mt-0.5">{order.address || 'Domicilio no especificado'}</p>
                  </div>

                  {order.notes && (
                    <div className="p-2 bg-amber-50/70 rounded-lg text-[10.5px] text-amber-900 italic border border-amber-100">
                      <strong>Nota:</strong> {order.notes}
                    </div>
                  )}

                  {/* TOTAL A COBRAR Y FORMA DE PAGO: Tipografía alta y muy visible a primera vista */}
                  <div className="bg-gradient-to-br from-gray-50 to-amber-50/40 p-3 sm:p-3.5 rounded-xl border-2 border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div>
                      <span className="text-[10px] uppercase font-extrabold text-gray-500 tracking-wider block">
                        TOTAL A COBRAR:
                      </span>
                      <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700 tracking-tight leading-none mt-1">
                        ${order.total.toFixed(2)} <span className="text-xs font-bold text-emerald-600">MXN</span>
                      </p>
                    </div>

                    <div>
                      {order.paymentMethod === 'efectivo' ? (
                        <div className="space-y-1.5">
                          <div className="px-3.5 py-2 bg-amber-500 text-white rounded-xl shadow-xs flex items-center gap-2.5 border border-amber-600">
                            <span className="text-xl">💵</span>
                            <div>
                              <span className="text-[9px] uppercase font-extrabold tracking-wider block opacity-90 leading-tight">
                                FORMA DE PAGO:
                              </span>
                              <span className="text-xs sm:text-sm font-extrabold block leading-tight">
                                COBRAR EN EFECTIVO
                              </span>
                            </div>
                          </div>
                          {order.needsChange && order.payingWith ? (
                            <div className="p-2.5 bg-amber-950 text-white rounded-xl border border-amber-800 shadow-xs space-y-0.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[9.5px] uppercase font-bold text-amber-300 flex items-center gap-1">
                                  <Coins className="w-3.5 h-3.5 text-yellow-400" />
                                  <span>Llevar cambio:</span>
                                </span>
                                <span className="text-sm font-extrabold text-yellow-300">
                                  ${(order.changeAmount || 0).toFixed(2)} MXN
                                </span>
                              </div>
                              <p className="text-[10px] text-amber-200">
                                Cliente paga con: <strong className="text-white">${order.payingWith.toFixed(2)} MXN</strong>
                              </p>
                            </div>
                          ) : (
                            <span className="inline-block text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold px-2 py-0.5 rounded-lg">
                              ✅ Pago exacto acordado
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="px-3.5 py-2 bg-blue-50 text-blue-900 rounded-xl shadow-xs flex items-center gap-2.5 border border-blue-200">
                          <span className="text-xl">🏦</span>
                          <div>
                            <span className="text-[9px] uppercase font-extrabold tracking-wider block text-blue-700 leading-tight">
                              FORMA DE PAGO:
                            </span>
                            <span className="text-xs sm:text-sm font-extrabold block leading-tight text-blue-950">
                              TRANSFERENCIA (PREPAGADO)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Direct Action Buttons for Pick up */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => order.address && openGoogleMaps(order.address)}
                    disabled={!order.address}
                    className="py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5 text-amber-600" />
                    <span>Ver en GPS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShareToMessengerWhatsApp(order)}
                    className="py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-emerald-200 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp</span>
                  </button>
                </div>

                {/* BIG PICK UP BUTTON - INITIATE ROUTE */}
                <button
                  onClick={() => {
                    onUpdateOrderStatus(order.id, 'camino');
                    triggerToast('success', '📦 Pedido Recogido', `La comanda ${order.orderNumber} ya se encuentra en tu mochila. ¡Maneja con precaución!`);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs sm:text-sm font-extrabold rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all cursor-pointer"
                >
                  <Truck className="w-4 h-4" />
                  <span>Recoger de Cocina (Iniciar Ruta)</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: ACTIVE DELIVERIES IN TRANSIT (Pedidos en Ruta) */}
      <div className="space-y-3 pt-2">
        <h3 className="font-serif font-bold text-sm text-amber-950 flex items-center gap-1.5 px-1">
          <Truck className="w-4 h-4 text-amber-700" />
          <span>2. Pedidos en Ruta (Por Entregar)</span>
        </h3>

        {activeDeliveries.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-7 text-center space-y-2 shadow-xs">
            <div className="p-3 bg-amber-50 text-amber-700 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-gray-800 font-serif">¡Mochila Libre!</h4>
            <p className="text-xs text-gray-400 leading-normal">
              No tienes pedidos en camino actualmente. Cuando recojas uno de cocina aparecerá aquí con los botones de GPS y llamada directa.
            </p>
          </div>
        ) : (
          activeDeliveries.map(order => (
            <div
              key={order.id}
              className="bg-white border-2 border-emerald-500/40 rounded-2xl shadow-lg p-5 space-y-4 transition-transform hover:scale-[1.005]"
            >
              <div className="flex flex-col gap-1.5 border-b pb-3">
                {/* Línea 1: Número de Comanda y Cliente */}
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-serif font-extrabold text-base sm:text-lg text-amber-950">{order.orderNumber}</h3>
                  <span className="text-gray-300">•</span>
                  <span className="text-sm font-bold text-gray-900">{order.clientName}</span>
                </div>
                {/* Línea 2: Aviso de Estatus (Lectura de corrido de izquierda a derecha) */}
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 text-[10px] font-extrabold rounded-lg uppercase border border-emerald-200 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    En tránsito / En Ruta 🛵
                  </span>
                </div>
              </div>

              {/* Delivery info */}
              <div className="space-y-3 text-xs text-gray-700 font-medium">
                <div>
                  <p className="text-[9.5px] text-gray-400 font-bold uppercase">CLIENTE:</p>
                  <p className="font-bold text-amber-950 text-base mt-0.5">{order.clientName}</p>
                </div>

                <div>
                  <p className="text-[9.5px] text-gray-400 font-bold uppercase">DIRECCIÓN DE ENTREGA:</p>
                  <p className="text-gray-900 mt-0.5 font-bold leading-normal text-xs sm:text-sm">{order.address || 'Pasa a recoger en Local'}</p>
                </div>

                {order.notes && (
                  <div className="bg-amber-50/70 border border-amber-200 p-2.5 rounded-xl">
                    <p className="text-[9px] text-amber-800 font-bold">NOTA DE ENTREGA:</p>
                    <p className="text-[11px] text-amber-900 italic mt-0.5 leading-normal">{order.notes}</p>
                  </div>
                )}

                {/* PLATILLOS DE LA COMANDA EN RUTA: Nombre con tipografía alta, descripción pequeña */}
                <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 space-y-2">
                  <p className="text-[10.5px] font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <Utensils className="w-4 h-4 text-amber-700" />
                    <span>Platillos a Entregar ({order.items.reduce((acc, itm) => acc + itm.quantity, 0)} pzas):</span>
                  </p>
                  <div className="space-y-2.5 divide-y divide-amber-200/50">
                    {order.items.map((itm, i) => (
                      <div key={i} className={i > 0 ? 'pt-2' : ''}>
                        {/* Nombre del platillo: Tipografía alta y visible a primera vista */}
                        <p className="font-extrabold text-[22px] leading-[42px] text-amber-950">
                          {itm.quantity}x {itm.name}
                        </p>
                        {/* Opciones y extras: Descripción más pequeña */}
                        {Object.entries(itm.selectedOptions || {}).map(([title, choices]) => (
                          <p key={title} className="text-[11px] text-gray-600 pl-3 italic mt-0.5 leading-snug">
                            - {title}: {(choices as string[]).join(', ')}
                          </p>
                        ))}
                        {(itm.selectedExtras || []).map(ex => (
                          <p key={ex.name} className="text-[11px] text-amber-800 font-medium pl-3 mt-0.5 leading-snug">
                            + Extra: {ex.name}
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* TOTAL A COBRAR Y FORMA DE PAGO: Tipografía alta y visualmente a primera vista */}
                <div className="bg-gradient-to-br from-gray-50 to-amber-50/40 p-3.5 sm:p-4 rounded-xl border-2 border-emerald-400/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-gray-500 tracking-wider block">
                      TOTAL A COBRAR:
                    </span>
                    <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700 tracking-tight leading-none mt-1">
                      ${order.total.toFixed(2)} <span className="text-xs font-bold text-emerald-600">MXN</span>
                    </p>
                  </div>

                  <div>
                    {order.paymentMethod === 'efectivo' ? (
                      <div className="space-y-1.5">
                        <div className="px-3.5 py-2.5 bg-amber-500 text-white rounded-xl shadow-xs flex items-center gap-2.5 border border-amber-600">
                          <span className="text-xl">💵</span>
                          <div>
                            <span className="text-[9px] uppercase font-extrabold tracking-wider block opacity-90 leading-tight">
                              FORMA DE PAGO:
                            </span>
                            <span className="text-xs sm:text-sm font-extrabold block leading-tight">
                              COBRAR EN EFECTIVO
                            </span>
                          </div>
                        </div>
                        {order.needsChange && order.payingWith ? (
                          <div className="p-2.5 bg-amber-950 text-white rounded-xl border border-amber-800 shadow-xs space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[9.5px] uppercase font-bold text-amber-300 flex items-center gap-1">
                                <Coins className="w-3.5 h-3.5 text-yellow-400" />
                                <span>Llevar cambio:</span>
                              </span>
                              <span className="text-sm font-extrabold text-yellow-300">
                                ${(order.changeAmount || 0).toFixed(2)} MXN
                              </span>
                            </div>
                            <p className="text-[10px] text-amber-200">
                              Cliente paga con: <strong className="text-white">${order.payingWith.toFixed(2)} MXN</strong>
                            </p>
                          </div>
                        ) : (
                          <span className="inline-block text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold px-2 py-0.5 rounded-lg">
                            ✅ Pago exacto acordado
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="px-3.5 py-2.5 bg-blue-50 text-blue-900 rounded-xl shadow-xs flex items-center gap-2.5 border border-blue-200">
                        <span className="text-xl">🏦</span>
                        <div>
                          <span className="text-[9px] uppercase font-extrabold tracking-wider block text-blue-700 leading-tight">
                            FORMA DE PAGO:
                          </span>
                          <span className="text-xs sm:text-sm font-extrabold block leading-tight text-blue-950">
                            TRANSFERENCIA (PREPAGADO)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons for Mobile Phone */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => order.address && openGoogleMaps(order.address)}
                  disabled={!order.address}
                  className="py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10.5px] font-bold flex flex-col items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  <Navigation className="w-4 h-4 shrink-0" />
                  <span>Abrir GPS</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCallClient(order.clientPhone)}
                  className="py-3 bg-sky-50 hover:bg-sky-100 text-sky-900 rounded-xl text-[10.5px] font-bold flex flex-col items-center justify-center gap-1.5 transition-all border border-sky-200 active:scale-95 cursor-pointer"
                >
                  <Phone className="w-4 h-4 shrink-0 text-sky-600" />
                  <span>Llamar</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleWhatsAppClient(order)}
                  className="py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl text-[10.5px] font-bold flex flex-col items-center justify-center gap-1.5 transition-all border border-emerald-200 active:scale-95 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>WhatsApp</span>
                </button>
              </div>

              {/* MARK AS DELIVERED */}
              <button
                type="button"
                onClick={() => {
                  onUpdateOrderStatus(order.id, 'entregado');
                  triggerToast('success', '¡Pedido Entregado con Éxito!', `Se archivó la comanda ${order.orderNumber}.`);
                }}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-extrabold rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all mt-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Marcar como Entregado al Cliente</span>
              </button>
            </div>
          ))
        )}
      </div>

      {/* HISTORIAL DE ENTREGAS SECTION CARD */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setShowHistoryModal(true)}
          className="w-full p-4 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border border-amber-300/80 rounded-2xl flex items-center justify-between text-left transition-all shadow-xs group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl group-hover:bg-amber-200 transition-colors">
              <History className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-serif font-bold text-amber-950 flex items-center gap-1.5">
                <span>Historial de Entregas Realizadas</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {completedDeliveries.length}
                </span>
              </h4>
              <p className="text-[10.5px] text-gray-500 mt-0.5">
                Consulta los pedidos ya entregados, montos cobrados en efectivo y comprobantes.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-800 bg-white border border-amber-200 group-hover:bg-amber-500 group-hover:text-white px-3 py-1.5 rounded-xl transition-all shadow-2xs shrink-0">
            Abrir ↗
          </span>
        </button>
      </div>

      {/* MODAL HISTORIAL DE ENTREGAS DEL REPARTIDOR */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-amber-200/80 shadow-2xl flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] overflow-hidden animate-fade-in my-auto">
            {/* STICKY HEADER */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-150 bg-gradient-to-r from-amber-50/60 via-white to-orange-50/40 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <History className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-amber-950 leading-tight">
                    Historial de Entregas Hoy
                  </h3>
                  <p className="text-[10.5px] text-gray-500">
                    {completedDeliveries.length} {completedDeliveries.length === 1 ? 'pedido entregado' : 'pedidos entregados'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CASH RECONCILIATION BAR (CORTE DE EFECTIVO PARA EL REPARTIDOR) */}
            <div className="p-3.5 bg-amber-50/70 border-b border-amber-200/80 space-y-2 shrink-0">
              <span className="text-[10px] font-extrabold uppercase text-amber-900 tracking-wider block">
                Corte de Entregas del Repartidor:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-amber-200/60 shadow-2xs">
                  <p className="text-[9.5px] text-gray-500 font-medium">💵 Efectivo a Entregar:</p>
                  <p className="font-extrabold text-emerald-700 text-sm mt-0.5">${totalCashCollected.toFixed(2)} MXN</p>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-amber-200/60 shadow-2xs">
                  <p className="text-[9.5px] text-gray-500 font-medium">🏦 Transferencia / Prepagado:</p>
                  <p className="font-extrabold text-sky-700 text-sm mt-0.5">${totalTransferCollected.toFixed(2)} MXN</p>
                </div>
              </div>
            </div>

            {/* SEARCH */}
            <div className="p-3 border-b border-gray-150 bg-white shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por orden, cliente o dirección..."
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  className="w-full pl-8 pr-7 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                />
                {historySearch && (
                  <button
                    type="button"
                    onClick={() => setHistorySearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* ORDERS LIST */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
              {filteredCompletedDeliveries.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-gray-200 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-gray-700">
                    {completedDeliveries.length === 0 ? 'Sin pedidos entregados todavía' : 'No se encontraron entregas'}
                  </h4>
                  <p className="text-[10.5px] text-gray-400">
                    Al pulsar "Marcar como Entregado", la comanda pasará a este historial para mantener limpia la ruta de entregas pendientes.
                  </p>
                </div>
              ) : (
                filteredCompletedDeliveries.map(order => (
                  <div
                    key={order.id}
                    className="bg-white border border-gray-200 rounded-2xl p-3.5 shadow-2xs space-y-2.5"
                  >
                    <div className="flex flex-col gap-1 pb-2 border-b border-gray-100">
                      {/* Línea 1: Número de Comanda y Cliente */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-serif font-extrabold text-xs text-amber-950">
                          {order.orderNumber}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="text-xs font-bold text-gray-800">{order.clientName}</span>
                      </div>
                      {/* Línea 2: Aviso de Estatus y Cobro (Lectura de corrido de izquierda a derecha) */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                            ✓ Entregado
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {order.paymentMethod === 'efectivo' ? '💵 Efectivo' : '🏦 Transferencia'}
                            {order.paymentMethod === 'efectivo' && order.needsChange && order.payingWith && (
                              <span className="text-amber-900 font-bold ml-1">
                                (Paga ${order.payingWith.toFixed(2)} • Cambio ${(order.changeAmount || 0).toFixed(2)})
                              </span>
                            )}
                          </span>
                        </div>
                        <span className="font-extrabold text-xs text-amber-950">
                          ${order.total.toFixed(2)} MXN
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-600 space-y-1.5">
                      <p className="text-[10.5px]">
                        <strong>Dirección:</strong> {order.address || 'Domicilio'}
                      </p>
                      {order.notes && (
                        <p className="text-[10px] text-amber-800 italic bg-amber-50/60 p-1.5 rounded-lg border border-amber-100">
                          Nota: {order.notes}
                        </p>
                      )}

                      {/* Platillos entregados */}
                      {order.items && order.items.length > 0 && (
                        <div className="bg-gray-50 p-2 rounded-lg border border-gray-150 space-y-1">
                          <p className="text-[9.5px] uppercase font-bold text-gray-500">Platillos:</p>
                          {order.items.map((itm, i) => (
                            <div key={i} className="text-[11px] text-gray-800 font-medium">
                              <span className="font-bold">{itm.quantity}x {itm.name}</span>
                              {Object.entries(itm.selectedOptions || {}).map(([t, c]) => (
                                <span key={t} className="text-[10px] text-gray-500 italic block pl-2">
                                  - {t}: {(c as string[]).join(', ')}
                                </span>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCallClient(order.clientPhone)}
                          className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 border border-sky-200 transition-colors"
                        >
                          <Phone className="w-3 h-3 text-sky-600" />
                          <span>Llamar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleWhatsAppClient(order)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 border border-emerald-200 transition-colors"
                        >
                          <MessageSquare className="w-3 h-3 text-emerald-600" />
                          <span>WhatsApp</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onUpdateOrderStatus(order.id, 'camino');
                          triggerToast('info', 'Comanda Restaurada', `La comanda ${order.orderNumber} regresó a En Ruta.`);
                        }}
                        className="px-2.5 py-1 bg-gray-100 hover:bg-amber-100 hover:text-amber-900 text-gray-600 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                        title="Regresar a pedidos en camino"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Deshacer</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* FOOTER */}
            <div className="p-3.5 border-t border-gray-150 bg-white flex items-center justify-between shrink-0">
              <span className="text-[11px] text-gray-500 font-medium">
                {filteredCompletedDeliveries.length} entregas listadas
              </span>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
