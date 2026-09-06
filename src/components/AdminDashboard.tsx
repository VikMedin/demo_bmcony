/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BarChart3, TrendingUp, Download, Printer, Percent, ShieldCheck, DollarSign, ArrowRight, Clock } from 'lucide-react';
import { FoodOrder, Expense } from '../types';

interface AdminDashboardProps {
  orders: FoodOrder[];
  expenses: Expense[];
  triggerToast: (type: 'success' | 'error' | 'info', title: string, description?: string) => void;
  role: 'superadmin' | 'admin' | 'mensajero';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  orders,
  expenses,
  triggerToast,
  role
}) => {
  const [filterPeriod, setFilterPeriod] = useState<'day' | 'week' | 'month' | 'custom'>('month');
  const [startDate, setStartDate] = useState<string>('2026-09-01');
  const [endDate, setEndDate] = useState<string>('2026-09-07');

  // --- Calculations based on Filtered Period ---
  const filteredOrders = orders.filter(order => {
    const oDate = new Date(order.createdAt);
    const now = new Date();
    
    if (filterPeriod === 'day') {
      return oDate.toDateString() === now.toDateString();
    } else if (filterPeriod === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return oDate >= oneWeekAgo;
    } else if (filterPeriod === 'month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(now.getMonth() - 1);
      return oDate >= oneMonthAgo;
    } else {
      // Custom date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return oDate >= start && oDate <= end;
    }
  });

  const totalBruto = filteredOrders.reduce((acc, o) => acc + o.total, 0);
  const totalEgresos = expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalNeto = Math.max(0, totalBruto - totalEgresos);
  const ticketPromedio = filteredOrders.length > 0 ? totalBruto / filteredOrders.length : 0;

  // Payments split
  const efectivoSales = filteredOrders.filter(o => o.paymentMethod === 'efectivo').reduce((sum, o) => sum + o.total, 0);
  const transferenciaSales = filteredOrders.filter(o => o.paymentMethod === 'transferencia').reduce((sum, o) => sum + o.total, 0);

  // Hourly Peak hours calculation (Ventas por Horario)
  // Divide hours: 7-8, 8-9, 9-10 (Peak), 10-11 (Peak), 11-12, 12-13, 13-14
  const hourlyBuckets = [
    { label: '07:00 - 08:00', count: 0, amount: 0 },
    { label: '08:00 - 09:00', count: 0, amount: 0 },
    { label: '09:00 - 10:00 (Pico) ⚡', count: 0, amount: 0 },
    { label: '10:00 - 11:00 (Pico) ⚡', count: 0, amount: 0 },
    { label: '11:00 - 12:00', count: 0, amount: 0 },
    { label: '12:00 - 13:00', count: 0, amount: 0 },
    { label: '13:00 - 14:00', count: 0, amount: 0 }
  ];

  filteredOrders.forEach(o => {
    const hour = new Date(o.createdAt).getHours();
    if (hour === 7) { hourlyBuckets[0].count += 1; hourlyBuckets[0].amount += o.total; }
    else if (hour === 8) { hourlyBuckets[1].count += 1; hourlyBuckets[1].amount += o.total; }
    else if (hour === 9) { hourlyBuckets[2].count += 1; hourlyBuckets[2].amount += o.total; }
    else if (hour === 10) { hourlyBuckets[3].count += 1; hourlyBuckets[3].amount += o.total; }
    else if (hour === 11) { hourlyBuckets[4].count += 1; hourlyBuckets[4].amount += o.total; }
    else if (hour === 12) { hourlyBuckets[5].count += 1; hourlyBuckets[5].amount += o.total; }
    else if (hour >= 13) { hourlyBuckets[6].count += 1; hourlyBuckets[6].amount += o.total; }
  });

  const maxHourlyCount = Math.max(...hourlyBuckets.map(b => b.count), 1);

  // Top Platillos calculation
  const platillosSales: { [name: string]: { count: number; total: number } } = {};
  filteredOrders.forEach(o => {
    o.items.forEach(itm => {
      if (!platillosSales[itm.name]) {
        platillosSales[itm.name] = { count: 0, total: 0 };
      }
      platillosSales[itm.name].count += itm.quantity;
      platillosSales[itm.name].total += itm.price * itm.quantity;
    });
  });

  const topPlatillos = Object.entries(platillosSales)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const maxPlatilloCount = Math.max(...topPlatillos.map(p => p.count), 1);

  // CSV Exporter
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Folio,Cliente,Celular,Tipo,Pago,Total,Fecha,Estado\n';
    
    filteredOrders.forEach(o => {
      const row = [
        o.orderNumber,
        `"${o.clientName.replace(/"/g, '""')}"`,
        o.clientPhone,
        o.deliveryType,
        o.paymentMethod,
        o.total,
        o.createdAt.split('T')[0],
        o.status
      ].join(',');
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_ventas_cony_${filterPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerToast('success', 'Archivo CSV Generado', 'La descarga de tu balance de caja se inició automáticamente.');
  };

  // Print PDF Simulation / Custom triggers
  const handlePrintPDF = () => {
    window.print();
    triggerToast('info', 'Ventana de Impresión', 'Generando formato PDF optimizado para impresión de comanda.');
  };

  return (
    <div className="space-y-6" id="dashboard-stats-view">
      {/* Metrics Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200">
        <div>
          <h2 className="text-sm font-bold text-amber-950 uppercase tracking-wide">Métricas y Reportes de Venta</h2>
          <p className="text-[11px] text-gray-500">Configura el rango para descargar CSVs y reportar cortes de caja.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(['day', 'week', 'month', 'custom'] as const).map(p => (
            <button
              key={p}
              onClick={() => setFilterPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                filterPeriod === p
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p === 'day' ? 'Hoy' : p === 'week' ? 'Semana' : p === 'month' ? 'Mes' : 'Rango'}
            </button>
          ))}
        </div>
      </div>

      {filterPeriod === 'custom' && (
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-amber-950">Desde:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="p-1.5 border border-amber-200 bg-white rounded-lg text-xs text-amber-950 focus:outline-hidden"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-amber-950">Hasta:</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="p-1.5 border border-amber-200 bg-white rounded-lg text-xs text-amber-950 focus:outline-hidden"
            />
          </div>
        </div>
      )}

      {/* KPI 4 Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Venta Bruta */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Ventas Brutas</p>
            <h3 className="text-xl font-bold text-amber-950 mt-0.5">${totalBruto.toFixed(2)}</h3>
            <p className="text-[9px] text-emerald-600 font-medium">Ingreso total en comanda</p>
          </div>
        </div>

        {/* Card 2: Egresos */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Total Gastos</p>
            <h3 className="text-xl font-bold text-rose-950 mt-0.5">${totalEgresos.toFixed(2)}</h3>
            <p className="text-[9px] text-rose-500 font-medium">Conceptos de insumos / gas</p>
          </div>
        </div>

        {/* Card 3: Ganancia Neta */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Ganancia Neta</p>
            <h3 className="text-xl font-bold text-emerald-950 mt-0.5">${totalNeto.toFixed(2)}</h3>
            <p className="text-[9px] text-emerald-600 font-medium">Ventas restando egresos</p>
          </div>
        </div>

        {/* Card 4: Ticket Promedio */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Ticket Promedio</p>
            <h3 className="text-xl font-bold text-sky-950 mt-0.5">${ticketPromedio.toFixed(2)}</h3>
            <p className="text-[9px] text-sky-600 font-medium">Por comanda individual</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ventas por Horario (7 columnas) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 lg:col-span-7">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h3 className="font-serif font-bold text-base text-amber-950">Ventas por Horario Pico</h3>
            </div>
            <span className="text-[10px] bg-amber-50 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
              Hora Pico: 9:00 - 11:00 AM
            </span>
          </div>
          <p className="text-[10px] text-gray-400 mb-6 leading-relaxed">
            Gráfica de barras que mide la concurrencia de pedidos por horas para preparar la comanda y porcionados por adelantado.
          </p>

          <div className="space-y-4">
            {hourlyBuckets.map(b => {
              const pct = (b.count / maxHourlyCount) * 100;
              const isPeak = b.label.includes('Pico');
              return (
                <div key={b.label} className="flex items-center gap-3">
                  <span className="w-28 text-[11px] text-gray-600 font-medium">{b.label}</span>
                  <div className="flex-1 h-6 bg-gray-50 rounded-md overflow-hidden relative border border-gray-100">
                    <div
                      style={{ width: `${Math.max(pct, 3)}%` }}
                      className={`h-full transition-all duration-500 rounded-r-md ${
                        isPeak ? 'bg-amber-500' : 'bg-amber-300'
                      }`}
                    />
                    <span className="absolute left-2.5 top-1 text-[10px] font-bold text-amber-950">
                      {b.count} {b.count === 1 ? 'pedido' : 'pedidos'} (${b.amount.toFixed(0)} MXN)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Platillos & Métodos de Pago (5 columnas) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 lg:col-span-5 space-y-6">
          <div>
            <h3 className="font-serif font-bold text-base text-amber-950 mb-2">🏆 Top Platillos del Comal</h3>
            <p className="text-[10px] text-gray-400 mb-4">Mapeo rápido de alimentos más vendidos para control de compras a granel.</p>

            <div className="space-y-3">
              {topPlatillos.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">Sin ventas registradas en el periodo.</p>
              ) : (
                topPlatillos.map(p => {
                  const pct = (p.count / maxPlatilloCount) * 100;
                  return (
                    <div key={p.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-amber-950 truncate">{p.name}</span>
                        <span className="font-bold text-gray-500">{p.count} piezas</span>
                      </div>
                      <div className="h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-full bg-emerald-500 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h4 className="font-serif font-bold text-sm text-amber-950 mb-3">💰 Distribución de Métodos de Pago</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                <span className="text-[10px] font-semibold text-amber-800">💵 Efectivo</span>
                <p className="text-base font-bold text-amber-950 mt-1">${efectivoSales.toFixed(2)}</p>
                <p className="text-[9px] text-amber-600 mt-0.5">Cobro físico local</p>
              </div>
              <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                <span className="text-[10px] font-semibold text-emerald-800">🏦 Transferencia</span>
                <p className="text-base font-bold text-emerald-950 mt-1">${transferenciaSales.toFixed(2)}</p>
                <p className="text-[9px] text-emerald-600 mt-0.5">Comprobante directo</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PDF & CSV Export Area */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-xs text-amber-950 uppercase tracking-wide">Exportación B2B</h4>
          <p className="text-[10px] text-gray-500">Descarga los consolidados financieros oficiales de {filterPeriod === 'day' ? 'hoy' : filterPeriod === 'week' ? 'la semana' : 'el mes'} en formato compatible.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors"
          >
            <Download className="w-4 h-4" />
            Descargar CSV
          </button>
          <button
            onClick={handlePrintPDF}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimir Reporte PDF
          </button>
        </div>
      </div>
    </div>
  );
};
