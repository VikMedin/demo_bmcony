/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Map, Phone, MessageSquare, Check, Navigation, AlertCircle, ShoppingBag, Truck } from 'lucide-react';
import { FoodOrder } from '../types';

interface AdminRepartidorProps {
  orders: FoodOrder[];
  onUpdateOrderStatus: (orderId: string, nextStatus: FoodOrder['status']) => void;
  triggerToast: (type: 'success' | 'error' | 'info', title: string, description?: string) => void;
  currentRole?: string;
}

export const AdminRepartidor: React.FC<AdminRepartidorProps> = ({
  orders,
  onUpdateOrderStatus,
  triggerToast,
  currentRole = 'mensajero'
}) => {
  // Orders ready to be picked up from kitchen (status: 'listo')
  const readyToPickUp = orders.filter(o => o.status === 'listo' && o.deliveryType === 'domicilio');
  // Orders already on their way (status: 'camino')
  const activeDeliveries = orders.filter(o => o.status === 'camino');

  const totalPending = readyToPickUp.length + activeDeliveries.length;

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
    const cleanPhone = order.clientPhone.replace(/\D/g, '');
    const text = `*🛵 REPARTIDOR DE DESAYUNOS CONY 🛵*\n\nHola ${order.clientName}, estoy en camino con tu desayuno calientito. Estaré ahí en unos minutos. ¡Por favor ten listo tu pago! 😄🍳`;
    const encoded = encodeURIComponent(text);
    const url = `https://wa.me/${cleanPhone}?text=${encoded}`;
    window.open(url, '_blank');
    triggerToast('success', 'Mensaje de WhatsApp', 'Redirigiendo a chat con cliente.');
  };

  return (
    <div className="max-w-md mx-auto py-4 px-2 space-y-5" id="deliverer-mobile-view">
      {/* Smartphone layout header */}
      <div className="bg-amber-950 text-white rounded-2xl p-5 shadow-lg flex flex-col gap-1.5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl"></div>
        <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full w-fit">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
          Conectado en Ruta
        </div>
        <h2 className="text-xl font-serif font-bold">Ruta del Mensajero</h2>
        <p className="text-xs text-amber-100/80">Gestiona comandas y realiza entregas a domicilio.</p>
      </div>

      {/* DELIVERY SUMMARY & HIGHER USER NOTICE */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-amber-700" />
            Resumen de Entregas Pendientes
          </span>
          <span className="px-2.5 py-1 bg-amber-600 text-white text-[10px] font-extrabold rounded-full animate-pulse">
            {totalPending} por entregar
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="bg-white p-2.5 rounded-lg border border-amber-100">
            <p className="text-gray-400 font-semibold uppercase text-[9px]">Por Recoger:</p>
            <p className="text-base font-extrabold text-amber-950 mt-0.5">{readyToPickUp.length} comandas</p>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-amber-100">
            <p className="text-gray-400 font-semibold uppercase text-[9px]">En Tránsito (Ruta):</p>
            <p className="text-base font-extrabold text-amber-950 mt-0.5">{activeDeliveries.length} comandas</p>
          </div>
        </div>
        
        {currentRole !== 'mensajero' && (
          <p className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg font-medium leading-normal">
            💡 <strong>Modo Administrador Activo:</strong> Estás visualizando esto como un rol directivo ({currentRole}). Tienes permisos completos para recoger de cocina y marcar entregas tal como el repartidor oficial.
          </p>
        )}
      </div>

      {/* SECTION 1: READY TO PICK UP (Por Recoger de Cocina) */}
      <div className="space-y-3">
        <h3 className="font-serif font-bold text-sm text-amber-950 flex items-center gap-1.5 px-1">
          <ShoppingBag className="w-4 h-4 text-amber-700" />
          1. Pedidos Listos en Cocina (Por Recoger)
        </h3>

        {readyToPickUp.length === 0 ? (
          <p className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded-xl text-center border">
            No hay nuevos pedidos listos por recoger en la barra de cocina.
          </p>
        ) : (
          <div className="space-y-3">
            {readyToPickUp.map(order => (
              <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div>
                    <h4 className="font-serif font-bold text-sm text-amber-950">{order.orderNumber}</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5">Cliente: <strong className="font-bold text-gray-700">{order.clientName}</strong></p>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-500/10 text-amber-800 text-[10px] font-bold rounded">
                    Listo por recoger
                  </span>
                </div>
                <div className="text-[11px] text-gray-600 font-medium">
                  <p className="text-[9px] text-gray-400 uppercase">Dirección de Entrega:</p>
                  <p className="text-gray-900 font-bold mt-0.5">{order.address || 'Domicilio no especificado'}</p>
                </div>
                
                {/* BIG PICK UP BUTTON - NOTIFIES OTHER ADMINISTRATIVE VIEWS */}
                <button
                  onClick={() => {
                    onUpdateOrderStatus(order.id, 'camino');
                    triggerToast('success', '📦 Pedido Recogido', `La comanda ${order.orderNumber} ya se encuentra en ruta. Notificación enviada a cocina/caja.`);
                  }}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Truck className="w-4 h-4" />
                  Recoger de Cocina (Iniciar Ruta)
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
          2. Pedidos en Ruta (Por Entregar)
        </h3>

        {activeDeliveries.length === 0 ? (
          <div className="bg-white border rounded-2xl p-8 text-center space-y-3 shadow-xs">
            <div className="p-3 bg-gray-50 text-gray-400 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-gray-700 font-serif">¡Sartén Limpio!</h4>
            <p className="text-xs text-gray-400 leading-normal">No traes ninguna comanda contigo en tu mochila en este momento.</p>
          </div>
        ) : (
          activeDeliveries.map(order => (
            <div key={order.id} className="bg-white border-2 border-amber-500/20 rounded-2xl shadow-md p-5 space-y-4 transition-transform hover:scale-[1.01]">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">Comanda en Ruta</span>
                  <h3 className="font-serif font-bold text-base text-amber-950">{order.orderNumber}</h3>
                </div>
                <span className="px-3 py-1 bg-amber-500/15 text-amber-950 text-[10px] font-bold rounded-lg uppercase">
                  En tránsito
                </span>
              </div>

              {/* Delivery info */}
              <div className="space-y-3 text-xs text-gray-700 font-medium">
                <div>
                  <p className="text-[10px] text-gray-400">CLIENTE:</p>
                  <p className="font-bold text-amber-950 text-sm mt-0.5">{order.clientName}</p>
                </div>

                <div>
                  <p className="text-[10px] text-gray-400">DIRECCIÓN DE ENTREGA:</p>
                  <p className="text-gray-900 mt-0.5 font-bold leading-normal">{order.address || 'Pasa a recoger en Local'}</p>
                </div>

                {order.notes && (
                  <div className="bg-amber-50/50 border border-amber-100 p-2.5 rounded-xl">
                    <p className="text-[9px] text-amber-800 font-bold">NOTA DE ENTREGA:</p>
                    <p className="text-[11px] text-amber-900 italic mt-0.5 leading-normal">{order.notes}</p>
                  </div>
                )}

                <div className="bg-gray-50 p-3 rounded-xl border flex justify-between items-center text-xs">
                  <div>
                    <p className="text-gray-400 text-[9px]">TOTAL A COBRAR:</p>
                    <p className="font-bold text-amber-950 text-sm">${order.total.toFixed(2)} MXN</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-gray-200 text-gray-700 font-bold rounded">
                    {order.paymentMethod === 'efectivo' ? '💵 Efectivo' : '🏦 Transferencia'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => order.address && openGoogleMaps(order.address)}
                  disabled={!order.address}
                  className="py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-bold flex flex-col items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <Navigation className="w-4 h-4 shrink-0" />
                  Abrir GPS
                </button>

                <button
                  onClick={() => handleCallClient(order.clientPhone)}
                  className="py-3 bg-sky-100 hover:bg-sky-200 text-sky-900 rounded-xl text-[10px] font-bold flex flex-col items-center justify-center gap-1.5 transition-colors border border-sky-200 cursor-pointer"
                >
                  <Phone className="w-4 h-4 shrink-0 text-sky-600" />
                  Llamar
                </button>

                <button
                  onClick={() => handleWhatsAppClient(order)}
                  className="py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl text-[10px] font-bold flex flex-col items-center justify-center gap-1.5 transition-colors border border-emerald-200 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 shrink-0 text-emerald-600" />
                  WhatsApp
                </button>
              </div>

              <button
                onClick={() => {
                  onUpdateOrderStatus(order.id, 'entregado');
                  triggerToast('success', '¡Pedido Entregado!', `Se archivó la comanda ${order.orderNumber} con éxito.`);
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all mt-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Marcar como Entregado
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
