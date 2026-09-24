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
  Clock
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

  const totalPending = readyToPickUp.length + activeDeliveries.length;

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
    const text = `*🛵 REPARTIDOR DE DESAYUNOS CONY 🛵*\n\nHola ${order.clientName}, estoy en camino con tu desayuno calientito. Estaré ahí en unos minutos. ¡Por favor ten listo tu pago de *$${order.total.toFixed(2)} MXN* (${order.paymentMethod === 'efectivo' ? 'en efectivo' : 'por transferencia'})! 😄🍳`;
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

      {/* URGENT FLOATING ALERT BANNER (When an order just became ready) */}
      {activeAlertOrder && activeAlertOrder.status === 'listo' && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-2xl p-4 shadow-lg border-2 border-amber-300 animate-bounce space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-white text-amber-600 rounded-full font-bold shadow-xs">
                <BellRing className="w-4 h-4 animate-spin" />
              </span>
              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-white/20 px-2 py-0.5 rounded">
                  ¡Nuevo Pedido en Barra!
                </span>
                <h3 className="font-serif font-extrabold text-sm sm:text-base leading-tight mt-0.5">
                  Comanda #{activeAlertOrder.orderNumber}
                </h3>
              </div>
            </div>
            <button
              onClick={() => setActiveAlertOrder(null)}
              className="text-xs text-white/80 hover:text-white bg-white/20 px-2.5 py-1 rounded-lg font-bold"
            >
              Cerrar aviso
            </button>
          </div>

          <div className="bg-black/15 p-2.5 rounded-xl text-xs space-y-1">
            <p><strong>Cliente:</strong> {activeAlertOrder.clientName}</p>
            <p><strong>Dirección:</strong> {activeAlertOrder.address || 'Domicilio'}</p>
            <p><strong>Total a cobrar:</strong> ${activeAlertOrder.total.toFixed(2)} MXN ({activeAlertOrder.paymentMethod})</p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                onUpdateOrderStatus(activeAlertOrder.id, 'camino');
                setActiveAlertOrder(null);
                triggerToast('success', '📦 Pedido Tomado', `Comanda #${activeAlertOrder.orderNumber} en camino.`);
              }}
              className="py-2.5 bg-white text-amber-950 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md hover:bg-amber-50 active:scale-95 transition-all cursor-pointer"
            >
              <Truck className="w-4 h-4 text-amber-700" />
              <span>Tomar Comanda</span>
            </button>

            <button
              onClick={() => activeAlertOrder.address && openGoogleMaps(activeAlertOrder.address)}
              className="py-2.5 bg-amber-950/80 hover:bg-amber-950 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <Navigation className="w-4 h-4 text-amber-400" />
              <span>Ver GPS</span>
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
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-600">Comanda Lista</span>
                    <h4 className="font-serif font-extrabold text-base text-amber-950">{order.orderNumber}</h4>
                    <p className="text-[11px] text-gray-600 mt-0.5">Cliente: <strong className="font-bold text-gray-800">{order.clientName}</strong></p>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-900 text-[10px] font-bold rounded-lg border border-amber-200">
                    Listo en barra
                  </span>
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

                  <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-xl border text-xs">
                    <span className="text-gray-500 font-medium">Cobro:</span>
                    <span className="font-extrabold text-amber-950">${order.total.toFixed(2)} MXN</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                      {order.paymentMethod === 'efectivo' ? '💵 Efectivo' : '🏦 Transferencia'}
                    </span>
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
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-emerald-700 tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    Comanda en Ruta
                  </span>
                  <h3 className="font-serif font-extrabold text-lg text-amber-950">{order.orderNumber}</h3>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-900 text-[10.5px] font-extrabold rounded-lg uppercase border border-emerald-200">
                  En tránsito
                </span>
              </div>

              {/* Delivery info */}
              <div className="space-y-3 text-xs text-gray-700 font-medium">
                <div>
                  <p className="text-[9.5px] text-gray-400 font-bold uppercase">CLIENTE:</p>
                  <p className="font-bold text-amber-950 text-sm mt-0.5">{order.clientName}</p>
                </div>

                <div>
                  <p className="text-[9.5px] text-gray-400 font-bold uppercase">DIRECCIÓN DE ENTREGA:</p>
                  <p className="text-gray-900 mt-0.5 font-bold leading-normal">{order.address || 'Pasa a recoger en Local'}</p>
                </div>

                {order.notes && (
                  <div className="bg-amber-50/70 border border-amber-200 p-2.5 rounded-xl">
                    <p className="text-[9px] text-amber-800 font-bold">NOTA DE ENTREGA:</p>
                    <p className="text-[11px] text-amber-900 italic mt-0.5 leading-normal">{order.notes}</p>
                  </div>
                )}

                <div className="bg-gray-50 p-3 rounded-xl border flex justify-between items-center text-xs">
                  <div>
                    <p className="text-gray-400 text-[9px] uppercase font-bold">TOTAL A COBRAR:</p>
                    <p className="font-extrabold text-emerald-700 text-base whitespace-nowrap">${order.total.toFixed(2)} MXN</p>
                  </div>
                  <span className="text-[10px] px-2.5 py-1 bg-gray-200 text-gray-800 font-bold rounded-lg shrink-0 ml-2 text-right">
                    {order.paymentMethod === 'efectivo' ? '💵 Efectivo (Cobrar)' : '🏦 Transferencia (Prepagado)'}
                  </span>
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
    </div>
  );
};
