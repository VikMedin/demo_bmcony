/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Phone, MapPin, Star, MessageCircle, Download, Printer, Search, Filter } from 'lucide-react';
import { RestoClient } from '../types';

interface AdminClientesProps {
  clients: RestoClient[];
  triggerToast: (type: 'success' | 'error' | 'info', title: string, description?: string) => void;
}

export const AdminClientes: React.FC<AdminClientesProps> = ({ clients, triggerToast }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tierFilter, setTierFilter] = useState<'all' | 'estrella' | 'honor' | 'frecuente' | 'nuevo'>('all');

  const filteredClients = clients.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
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

  // Click-to-chat WA template "Te extrañamos"
  const handleSendPromo = (client: RestoClient) => {
    const promoCode = `CONYLOVE${Math.floor(100 + Math.random() * 900)}`;
    const text = `*☕ ¡HOLA ${client.name.toUpperCase()}! TE EXTRAÑAMOS EN DESAYUNOS CONY ☕*\n\n` +
      `Hace unos días que tu comal favorito no recibe tu orden. 🥺 Queremos consentirte hoy con tus chilaquiles de siempre.\n\n` +
      `🎁 *Usa este código en tu siguiente pedido:* _${promoCode}_\n` +
      `🔥 *¡Te regalamos un Café de Olla Tradicional de cortesía!* ☕✨\n\n` +
      `👉 Ordena hoy ingresando aquí: https://wa.me/525512345678\n\n` +
      `_Válido por esta semana en compras de desayuno._ 🥞🍳`;

    const encodedText = encodeURIComponent(text);
    const url = `https://wa.me/${client.phone}?text=${encodedText}`;
    window.open(url, '_blank');
    triggerToast('success', 'Plantilla Redactada', `Promo enviada por WhatsApp a ${client.name}.`);
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
            Filtra tus comensales recurrentes por volumen de compras y lánzales promociones en un clic.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            Imprimir Reporte PDF
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
        <div className="sm:col-span-8 relative">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por celular, nombre, dirección..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 bg-white rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
          />
        </div>

        <div className="sm:col-span-4 relative">
          <Filter className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <select
            value={tierFilter}
            onChange={e => setTierFilter(e.target.value as any)}
            className="w-full pl-8 pr-4 py-2 border border-gray-200 bg-white rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
          >
            <option value="all">Categorías (Todos)</option>
            <option value="estrella">🥇 Estrella / VIP</option>
            <option value="honor">🥈 Comensal de Honor</option>
            <option value="frecuente">🥉 Cliente Frecuente</option>
            <option value="nuevo">Cliente Nuevo</option>
          </select>
        </div>
      </div>

      {/* Clients list table */}
      <div className="overflow-x-auto border border-gray-100 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              <th className="p-4">Cliente</th>
              <th className="p-4">Celular (WhatsApp)</th>
              <th className="p-4">Dirección Habitual</th>
              <th className="p-4 text-center">Pedidos</th>
              <th className="p-4">Gasto Acumulado</th>
              <th className="p-4">Nivel / Rango</th>
              <th className="p-4 text-right">Fidelización</th>
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
                <tr key={client.phone} className="hover:bg-gray-50/50">
                  <td className="p-4 font-bold text-amber-950 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 text-xs font-bold">
                      {client.name.charAt(0)}
                    </div>
                    <span>{client.name}</span>
                  </td>
                  <td className="p-4 font-medium text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {client.phone}
                    </span>
                  </td>
                  <td className="p-4 max-w-xs truncate text-gray-500 font-medium">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      {client.address}
                    </span>
                  </td>
                  <td className="p-4 text-center font-bold text-gray-800">{client.orderCount}</td>
                  <td className="p-4 font-bold text-emerald-600">${client.totalSpent.toFixed(2)} MXN</td>
                  <td className="p-4">{getTierBadge(client.tier)}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleSendPromo(client)}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Enviar Promo
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
