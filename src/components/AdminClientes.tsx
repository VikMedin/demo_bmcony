/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, Star, MessageCircle, Download, Search, Filter, X, Send, Sparkles, Copy, Tag, CheckCircle2, ExternalLink } from 'lucide-react';
import { RestoClient, Coupon } from '../types';
import { normalizePhone } from '../utils/phoneUtils';

interface AdminClientesProps {
  clients: RestoClient[];
  coupons?: Coupon[];
  triggerToast: (type: 'success' | 'error' | 'info', title: string, description?: string) => void;
}

export const AdminClientes: React.FC<AdminClientesProps> = ({ clients, coupons = [], triggerToast }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tierFilter, setTierFilter] = useState<'all' | 'estrella' | 'honor' | 'frecuente' | 'nuevo'>('all');

  // Modal Promo Composer State
  const [selectedClientForPromo, setSelectedClientForPromo] = useState<RestoClient | null>(null);
  const [selectedCouponId, setSelectedCouponId] = useState<string>('');
  const [promoStrategy, setPromoStrategy] = useState<'estrella' | 'reactivacion' | 'frecuente' | 'antojo'>('estrella');
  const [customMessage, setCustomMessage] = useState<string>('');

  const activeCoupons = coupons.filter(c => c.isActive);

  const filteredClients = clients.filter(c => {
    const cleanSearch = searchQuery.replace(/\D/g, '');
    const cleanClientPhone = normalizePhone(c.phone);
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (cleanSearch && cleanClientPhone.includes(cleanSearch)) ||
      c.address.toLowerCase().includes(searchQuery.toLowerCase());
      
    if (tierFilter === 'all') return matchesSearch;
    return matchesSearch && c.tier === tierFilter;
  });

  const getTierBadge = (tier: RestoClient['tier']) => {
    switch (tier) {
      case 'estrella':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            🥇 Estrella / VIP (10+)
          </span>
        );
      case 'honor':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
            🥈 Comensal de Honor (6-10)
          </span>
        );
      case 'frecuente':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
            🥉 Frecuente (3-5)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
            Cliente Nuevo
          </span>
        );
    }
  };

  // Helper to generate persuasive promo message based on purchase behavior
  const buildPromoMessage = (
    client: RestoClient,
    coupon: Coupon | null,
    strategy: 'estrella' | 'reactivacion' | 'frecuente' | 'antojo'
  ): string => {
    const clientName = client.name.trim().toUpperCase();
    const appUrl = window.location.origin;

    const couponSection = coupon
      ? `🎁 *Usa tu cupón exclusivo:* _${coupon.code}_\n` +
        `🔥 *¡Obtén un ${coupon.discountPercentage}% DE DESCUENTO en tu cuenta!* ${
          coupon.minPurchase && coupon.minPurchase > 0 ? `_(Válido en consumos mínimos de $${coupon.minPurchase} MXN)_` : ''
        }\n`
      : `🎁 *¡Te consentimos con un Café de Olla Tradicional de cortesía en tu pedido!* ☕✨\n`;

    const orderLinkSection = `👉 *Ordena aquí y aplica tu cupón directo en la comanda:*\n${appUrl}\n\n`;

    if (strategy === 'estrella') {
      return (
        `*🌟 ¡HOLA ${clientName}! ERES NUESTRO CLIENTE ESTRELLA EN DESAYUNOS CONY 🌟*\n\n` +
        `Queremos agradecerte por ser uno de nuestros comensales más leales y queridos. Tu preferencia alegra nuestro comal cada mañana. 🥞🍳\n\n` +
        `Como reconocimiento especial a tu fidelidad, hoy tenemos este beneficio reservado para ti:\n\n` +
        couponSection +
        `\n` +
        orderLinkSection +
        `_¡Será un verdadero placer consentirte hoy con el auténtico sabor de casa!_ ✨`
      );
    }

    if (strategy === 'reactivacion') {
      return (
        `*☕ ¡HOLA ${clientName}! TE EXTRAÑAMOS EN DESAYUNOS CONY ☕*\n\n` +
        `Hace unos días que tu comal favorito no recibe tu orden. 🥺 Queremos consentirte hoy con tus chilaquiles o huevos al gusto bien calientitos.\n\n` +
        `Para que disfrutes un desayuno delicioso como te gusta, te preparamos esta cortesía especial:\n\n` +
        couponSection +
        `\n` +
        orderLinkSection +
        `_Válido en tu siguiente pedido. ¡No te quedes con el antojo!_ 🥞🍳`
      );
    }

    if (strategy === 'frecuente') {
      return (
        `*🥞 ¡HOLA ${clientName}! GRACIAS POR TU PREFERENCIA CONSTANTE 🥞*\n\n` +
        `Nos encanta que Desayunos Cony forme parte de tus mañanas. Tu constancia merece un apapacho especial con el sazón tradicional que ya conoces. 🍳✨\n\n` +
        couponSection +
        `\n` +
        orderLinkSection +
        `_¡Aprovecha y desayuna rico hoy!_ ☕`
      );
    }

    // Estrategia: Antojo del Día / General
    return (
      `*🍳 ¡BUENOS DÍAS ${clientName}! HOY EL COMAL ESTÁ ENCENDIDO PARA TI 🍳*\n\n` +
      `¿Con antojo de unos chilaquiles bien calientes, huevos al gusto o molletes recién hechos? En Desayunos Cony te lo llevamos calientito hasta tu puerta. 🛵💨\n\n` +
      couponSection +
      `\n` +
      orderLinkSection +
      `_Pide directo y sin intermediarios. ¡Buen provecho!_ 🥞☕`
    );
  };

  // Open modal and pre-fill message
  const handleOpenPromoModal = (client: RestoClient) => {
    setSelectedClientForPromo(client);
    
    // Choose appropriate default strategy based on client tier
    let initialStrategy: 'estrella' | 'reactivacion' | 'frecuente' | 'antojo' = 'antojo';
    if (client.tier === 'estrella') initialStrategy = 'estrella';
    else if (client.tier === 'honor' || client.tier === 'frecuente') initialStrategy = 'frecuente';
    else initialStrategy = 'antojo';

    setPromoStrategy(initialStrategy);

    // Pick best coupon for tier if available
    const matchedCoupon = activeCoupons.find(c => c.targetTier === client.tier) || activeCoupons[0] || null;
    const initialCouponId = matchedCoupon ? matchedCoupon.id : '';
    setSelectedCouponId(initialCouponId);

    const generated = buildPromoMessage(client, matchedCoupon, initialStrategy);
    setCustomMessage(generated);
  };

  // Re-generate text when coupon or strategy changes
  const handleStrategyOrCouponChange = (newStrategy: typeof promoStrategy, newCouponId: string) => {
    if (!selectedClientForPromo) return;
    setPromoStrategy(newStrategy);
    setSelectedCouponId(newCouponId);

    const couponObj = activeCoupons.find(c => c.id === newCouponId) || null;
    const generated = buildPromoMessage(selectedClientForPromo, couponObj, newStrategy);
    setCustomMessage(generated);
  };

  // Send via WhatsApp
  const handleSendWhatsApp = () => {
    if (!selectedClientForPromo) return;
    const cleanDigits = normalizePhone(selectedClientForPromo.phone);
    const waPhone = cleanDigits.length === 10 ? `52${cleanDigits}` : cleanDigits;
    const encodedText = encodeURIComponent(customMessage);
    const url = `https://wa.me/${waPhone}?text=${encodedText}`;
    window.open(url, '_blank');
    triggerToast('success', 'Promo Enviada por WhatsApp', `Mensaje promocional enviado a ${selectedClientForPromo.name}.`);
    setSelectedClientForPromo(null);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(customMessage);
    triggerToast('info', 'Mensaje Copiado', 'Texto promocional copiado al portapapeles.');
  };

  const handleExportCSV = () => {
    let csv = 'data:text/csv;charset=utf-8,';
    csv += 'Nombre,Celular,Direccion,Pedidos Totales,Gasto Acumulado,Rango\n';
    
    filteredClients.forEach(c => {
      csv += `"${c.name}","${c.phone}","${c.address}",${c.orderCount},${c.totalSpent},${c.tier}\n`;
    });

    const encoded = encodeURI(csv);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', 'clientes_estrella_cony.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerToast('success', 'Directorio Descargado', 'CSV de base de datos de comensales generado.');
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-6" id="star-clients-view">
      {/* Header and tools */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif font-bold text-lg text-amber-950 flex items-center gap-1.5">
            Clientes Estrella ⭐
          </h3>
          <p className="text-xs text-gray-500">
            Filtra comensales por volumen de compras y lánzales promociones personalizadas por WhatsApp con cupones de descuento.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Directorio (CSV)</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-gray-50/70 p-3 rounded-xl border border-gray-100">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o colonia..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
          />
        </div>

        {/* Tier filter pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0 hidden sm:block" />
          {(['all', 'estrella', 'honor', 'frecuente', 'nuevo'] as const).map(tier => (
            <button
              key={tier}
              onClick={() => setTierFilter(tier)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                tierFilter === tier
                  ? 'bg-amber-800 text-white font-bold'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              {tier === 'all' && 'Todos'}
              {tier === 'estrella' && '🥇 Estrella (10+)'}
              {tier === 'honor' && '🥈 Honor (6-10)'}
              {tier === 'frecuente' && '🥉 Frecuentes (3-5)'}
              {tier === 'nuevo' && '🌱 Nuevos (1-2)'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="p-4 whitespace-nowrap">Cliente</th>
                <th className="p-4 whitespace-nowrap">Celular (WhatsApp)</th>
                <th className="p-4 whitespace-nowrap">Dirección Habitual</th>
                <th className="p-4 text-center whitespace-nowrap">Pedidos</th>
                <th className="p-4 whitespace-nowrap">Gasto Acumulado</th>
                <th className="p-4 whitespace-nowrap">Nivel / Rango</th>
                <th className="p-4 text-right whitespace-nowrap">Fidelización</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    Ningún cliente coincide con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredClients.map(client => (
                  <tr key={normalizePhone(client.phone) || client.id} className="hover:bg-gray-50/50">
                    <td className="p-4 font-bold text-amber-950 flex items-center gap-2 whitespace-nowrap">
                      <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 text-xs font-bold">
                        {client.name.charAt(0)}
                      </div>
                      <span>{client.name}</span>
                    </td>
                    <td className="p-4 font-medium text-gray-600 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        {client.phone}
                      </span>
                    </td>
                    <td className="p-4 max-w-xs truncate text-gray-500 font-medium whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        {client.address}
                      </span>
                    </td>
                    <td className="p-4 text-center font-bold text-gray-800">{client.orderCount}</td>
                    <td className="p-4 font-bold text-emerald-600 whitespace-nowrap">${client.totalSpent.toFixed(2)} MXN</td>
                    <td className="p-4 whitespace-nowrap">{getTierBadge(client.tier)}</td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenPromoModal(client)}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                        title="Enviar cupón y promo por WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Enviar Promo</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Redactar y Personalizar Promoción con Cupón */}
      {selectedClientForPromo && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-900 to-amber-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <MessageCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base sm:text-lg">
                    Enviar Promoción por WhatsApp
                  </h3>
                  <p className="text-[11px] text-amber-200">
                    Comensal: <strong>{selectedClientForPromo.name}</strong> • Cel: {selectedClientForPromo.phone}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedClientForPromo(null)}
                className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Comensal Status Info Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-amber-50/80 rounded-xl border border-amber-200">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Rango Actual:</span>
                  {getTierBadge(selectedClientForPromo.tier)}
                </div>
                <div className="flex items-center gap-3 text-gray-600 text-[11px]">
                  <span>Pedidos: <strong className="text-amber-950">{selectedClientForPromo.orderCount}</strong></span>
                  <span>Gasto: <strong className="text-emerald-700">${selectedClientForPromo.totalSpent.toFixed(2)} MXN</strong></span>
                </div>
              </div>

              {/* 1. Selector de Estrategia según Comportamiento */}
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1.5">
                  1. Selecciona la intención según su comportamiento:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'estrella', label: '🌟 Cliente VIP / Lealtad', desc: 'Agradecimiento especial y trato VIP' },
                    { id: 'reactivacion', label: '☕ Te Extrañamos', desc: 'Reactivar comensal que lleva días sin pedir' },
                    { id: 'frecuente', label: '🥞 Premio a tu Constancia', desc: 'Reconocimiento a sus pedidos recurrentes' },
                    { id: 'antojo', label: '🍳 Antojo del Día', desc: 'Promoción general persuasiva para ordenar ya' }
                  ].map(strat => (
                    <button
                      key={strat.id}
                      type="button"
                      onClick={() => handleStrategyOrCouponChange(strat.id as any, selectedCouponId)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        promoStrategy === strat.id
                          ? 'border-amber-600 bg-amber-50/70 text-amber-950 ring-1 ring-amber-500 shadow-2xs'
                          : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <div className="font-bold text-[11.5px] leading-tight">{strat.label}</div>
                      <div className="text-[9.5px] text-gray-500 mt-0.5 leading-snug">{strat.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Selector de Cupón Activo */}
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-amber-600" />
                    <span>2. Vincular Cupón de Descuento (creados por el dueño):</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    {activeCoupons.length} cupones activos
                  </span>
                </label>

                <select
                  value={selectedCouponId}
                  onChange={e => handleStrategyOrCouponChange(promoStrategy, e.target.value)}
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-800 focus:ring-1 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
                >
                  <option value="">☕ Sin cupón (Solo cortesía en mensaje)</option>
                  {activeCoupons.map(cp => (
                    <option key={cp.id} value={cp.id}>
                      🏷️ {cp.code} - {cp.discountPercentage}% de Descuento {cp.minPurchase ? `(Mín. $${cp.minPurchase} MXN)` : ''} - {cp.description}
                    </option>
                  ))}
                </select>

                {activeCoupons.length === 0 && (
                  <p className="text-[10px] text-amber-700 mt-1 italic">
                    💡 No hay cupones activos en este momento. Puedes darlos de alta en la pestaña de Cupones y Descuentos.
                  </p>
                )}
              </div>

              {/* 3. Textarea Editable */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-800">
                    3. Mensaje personalizado para WhatsApp (Editable):
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="text-[10.5px] font-semibold text-amber-800 hover:text-amber-950 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copiar Texto</span>
                  </button>
                </div>
                <textarea
                  rows={8}
                  value={customMessage}
                  onChange={e => setCustomMessage(e.target.value)}
                  className="w-full p-3 bg-amber-50/20 border border-gray-300 rounded-xl text-xs font-sans text-gray-800 leading-relaxed focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  placeholder="Escribe o ajusta el mensaje que recibirá el comensal..."
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  ✨ El mensaje incluye automáticamente el enlace al menú digital para que el cliente ingrese su cupón al ordenar.
                </p>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedClientForPromo(null)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold rounded-xl text-xs sm:text-sm inline-flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Abrir Chat en WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
