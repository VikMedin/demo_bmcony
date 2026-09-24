/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BarChart3, TrendingUp, Download, Printer, Percent, ShieldCheck, DollarSign, ArrowRight, Clock, ChevronDown, ChevronUp, Receipt, X, ListOrdered, Award } from 'lucide-react';
import { FoodOrder, Expense, BusinessConfig } from '../types';
import { PrintLayout } from './PrintLayout';

interface AdminDashboardProps {
  orders: FoodOrder[];
  expenses: Expense[];
  triggerToast: (type: 'success' | 'error' | 'info', title: string, description?: string) => void;
  role: 'superadmin' | 'admin' | 'cocina' | 'mensajero';
  config: BusinessConfig;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  orders,
  expenses,
  triggerToast,
  role,
  config
}) => {
  const [filterPeriod, setFilterPeriod] = useState<'day' | 'week' | 'month' | 'custom'>('month');
  const [startDate, setStartDate] = useState<string>('2026-09-01');
  const [endDate, setEndDate] = useState<string>('2026-09-07');
  const [showDetails, setShowDetails] = useState(false);

  // --- Print State ---
  const [printReportType, setPrintReportType] = useState<'none' | 'dashboard' | 'top10'>('none');

  // --- Modal Top 10 State ---
  const [showTop10Modal, setShowTop10Modal] = useState(false);
  const [t10FilterPeriod, setT10FilterPeriod] = useState<'day' | 'week' | 'month' | 'custom'>('month');
  const [t10StartDate, setT10StartDate] = useState<string>('2026-09-01');
  const [t10EndDate, setT10EndDate] = useState<string>('2026-09-07');

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
      // Custom date range - force local time evaluation
      const start = new Date(`${startDate}T00:00:00`);
      const end = new Date(`${endDate}T23:59:59`);
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

  const allPlatillos = Object.entries(platillosSales)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count);

  const topPlatillos = allPlatillos.slice(0, 4);

  const maxPlatilloCount = Math.max(...topPlatillos.map(p => p.count), 1);

  // --- Top 10 Modal Calculations ---
  const t10FilteredOrders = orders.filter(order => {
    const oDate = new Date(order.createdAt);
    const now = new Date();
    if (t10FilterPeriod === 'day') {
      return oDate.toDateString() === now.toDateString();
    } else if (t10FilterPeriod === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return oDate >= oneWeekAgo;
    } else if (t10FilterPeriod === 'month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(now.getMonth() - 1);
      return oDate >= oneMonthAgo;
    } else {
      const start = new Date(`${t10StartDate}T00:00:00`);
      const end = new Date(`${t10EndDate}T23:59:59`);
      return oDate >= start && oDate <= end;
    }
  });

  const t10PlatillosSales: { [name: string]: { count: number; total: number } } = {};
  t10FilteredOrders.forEach(o => {
    o.items.forEach(itm => {
      if (!t10PlatillosSales[itm.name]) t10PlatillosSales[itm.name] = { count: 0, total: 0 };
      t10PlatillosSales[itm.name].count += itm.quantity;
      t10PlatillosSales[itm.name].total += itm.price * itm.quantity;
    });
  });

  const t10All = Object.entries(t10PlatillosSales)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  const t10Max = Math.max(...t10All.map(p => p.count), 1);

  const handleExportT10CSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Ranking,Producto,Cantidad Vendida,Ingreso Total\n';
    
    t10All.forEach((p, idx) => {
      csvContent += `${idx + 1},"${p.name}",${p.count},${p.total.toFixed(2)}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `top_10_platillos_${t10FilterPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('success', 'CSV Generado', 'La descarga de tu Top 10 inició automáticamente.');
  };

  const handlePrintT10PDF = () => {
    setPrintReportType('top10');
  };

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
    setPrintReportType('dashboard');
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Venta Bruta */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-4 min-w-[200px]">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-gray-400 uppercase font-semibold whitespace-nowrap">Ventas Brutas</p>
            <h3 className="text-xl sm:text-2xl font-bold text-amber-950 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis" title={`${totalBruto.toFixed(2)}`}>${totalBruto.toFixed(2)}</h3>
            <p className="text-[10px] text-emerald-600 font-medium mt-1 truncate">Ingreso total en comanda</p>
          </div>
        </div>

        {/* Card 2: Egresos */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-4 min-w-[200px]">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0">
            <Percent className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-gray-400 uppercase font-semibold whitespace-nowrap">Total Gastos</p>
            <h3 className="text-xl sm:text-2xl font-bold text-rose-950 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis" title={`-${totalEgresos.toFixed(2)}`}>${totalEgresos.toFixed(2)}</h3>
            <p className="text-[10px] text-rose-500 font-medium mt-1 truncate">Conceptos de insumos / gas</p>
          </div>
        </div>

        {/* Card 3: Ganancia Neta */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-4 min-w-[200px]">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-gray-400 uppercase font-semibold whitespace-nowrap">Ganancia Neta</p>
            <h3 className="text-xl sm:text-2xl font-bold text-emerald-950 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis" title={`${totalNeto.toFixed(2)}`}>${totalNeto.toFixed(2)}</h3>
            <p className="text-[10px] text-emerald-600 font-medium mt-1 truncate">Ventas restando egresos</p>
          </div>
        </div>

        {/* Card 4: Ticket Promedio */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-4 min-w-[200px]">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-gray-400 uppercase font-semibold whitespace-nowrap">Ticket Promedio</p>
            <h3 className="text-xl sm:text-2xl font-bold text-sky-950 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis" title={`${ticketPromedio.toFixed(2)}`}>${ticketPromedio.toFixed(2)}</h3>
            <p className="text-[10px] text-sky-600 font-medium mt-1 truncate">Por comanda individual</p>
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
                      <div className="flex items-center justify-between gap-2 sm:gap-3 text-xs">
                        <span className="font-semibold text-amber-950 truncate flex-1 min-w-0 pr-2 leading-tight">{p.name}</span>
                        <span className="font-bold text-gray-500 shrink-0 whitespace-nowrap">{p.count} piezas</span>
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
            {topPlatillos.length > 0 && (
              <button
                onClick={() => setShowTop10Modal(true)}
                className="w-full mt-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-bold transition-colors border border-amber-200/50 flex items-center justify-center gap-2"
              >
                <Award className="w-4 h-4" />
                Ver Top 10 Completo
              </button>
            )}
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

      {/* Desglose Completo de Ventas */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between p-5 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-xs text-amber-600">
              <Receipt className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-sm text-gray-900">Desglose Detallado de Ventas</h4>
              <p className="text-[10px] text-gray-500">Haz clic para ver todo lo que se vendió en el periodo seleccionado</p>
            </div>
          </div>
          {showDetails ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {showDetails && (
          <div className="p-5 border-t border-gray-200 bg-white animate-fade-in">
            {allPlatillos.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">No hay registros de venta para mostrar en esta fecha.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg">Producto</th>
                      <th className="px-4 py-3 text-center">Cantidad Vendida</th>
                      <th className="px-4 py-3 text-right rounded-r-lg">Ingreso Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allPlatillos.map((p) => (
                      <tr key={p.name} className="hover:bg-amber-50/30 transition-colors">
                        <td className="px-4 py-3 font-semibold text-gray-900">{p.name}</td>
                        <td className="px-4 py-3 text-center text-gray-600 font-medium">
                          <span className="bg-gray-100 text-gray-700 py-1 px-2 rounded-lg text-xs">
                            {p.count} pzas
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-amber-700">${p.total.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="bg-amber-50 font-bold border-t-2 border-amber-200">
                      <td className="px-4 py-4 text-amber-950 uppercase text-xs">Total General</td>
                      <td className="px-4 py-4 text-center text-amber-950">
                        {allPlatillos.reduce((acc, p) => acc + p.count, 0)} pzas
                      </td>
                      <td className="px-4 py-4 text-right text-amber-700 text-base">
                        ${allPlatillos.reduce((acc, p) => acc + p.total, 0).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
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

      {/* MODAL TOP 10 PLATILLOS */}
      {showTop10Modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-amber-950">Top 10 Platillos</h3>
                  <p className="text-[10px] text-gray-500">Ranking oficial de productos más vendidos.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowTop10Modal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-100">
              <div className="flex flex-wrap items-center gap-2">
                {(['day', 'week', 'month', 'custom'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setT10FilterPeriod(p)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      t10FilterPeriod === p
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {p === 'day' ? 'Hoy' : p === 'week' ? 'Semana' : p === 'month' ? 'Mes' : 'Rango'}
                  </button>
                ))}
              </div>
              
              {t10FilterPeriod === 'custom' && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={t10StartDate}
                    onChange={e => setT10StartDate(e.target.value)}
                    className="p-1.5 border border-gray-300 bg-white rounded-lg text-[10px] text-gray-700"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="date"
                    value={t10EndDate}
                    onChange={e => setT10EndDate(e.target.value)}
                    className="p-1.5 border border-gray-300 bg-white rounded-lg text-[10px] text-gray-700"
                  />
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {t10All.length === 0 ? (
                <p className="text-center text-gray-400 py-10 text-sm">No hay ventas en este periodo.</p>
              ) : (
                <div className="space-y-4">
                  {t10All.map((p, index) => {
                    const pct = (p.count / t10Max) * 100;
                    return (
                      <div key={p.name} className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          index === 0 ? 'bg-amber-100 text-amber-700' :
                          index === 1 ? 'bg-gray-200 text-gray-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-50 text-gray-400'
                        }`}>
                          #{index + 1}
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-gray-900">{p.name}</span>
                            <div className="flex gap-4 text-[10px]">
                              <span className="font-bold text-gray-500">{p.count} pzas</span>
                              <span className="font-bold text-emerald-600">${p.total.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${Math.max(pct, 2)}%` }}
                              className={`h-full rounded-full ${index < 3 ? 'bg-amber-500' : 'bg-gray-300'}`}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-white flex items-center justify-end gap-3">
              <button
                onClick={handleExportT10CSV}
                disabled={t10All.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
              <button
                onClick={handlePrintT10PDF}
                disabled={t10All.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                Imprimir PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RENDER PRINT LAYOUTS */}
      {printReportType === 'dashboard' && (
        <PrintLayout
          title="Corte de Caja y Resumen Financiero"
          subtitle={`Periodo Analizado: ${filterPeriod === 'day' ? 'Hoy' : filterPeriod === 'week' ? 'Esta Semana' : filterPeriod === 'month' ? 'Este Mes' : 'Rango Personalizado'}`}
          config={config}
          onClose={() => setPrintReportType('none')}
        >
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-gray-200 p-4 rounded-lg bg-gray-50">
                <p className="text-xs text-gray-500 font-bold uppercase">Ventas Brutas</p>
                <p className="text-2xl font-bold text-gray-900">${totalBruto.toFixed(2)}</p>
              </div>
              <div className="border border-gray-200 p-4 rounded-lg bg-gray-50">
                <p className="text-xs text-gray-500 font-bold uppercase">Total Egresos</p>
                <p className="text-2xl font-bold text-gray-900">${totalEgresos.toFixed(2)}</p>
              </div>
              <div className="border border-gray-200 p-4 rounded-lg bg-emerald-50">
                <p className="text-xs text-emerald-700 font-bold uppercase">Ganancia Neta</p>
                <p className="text-2xl font-bold text-emerald-900">${totalNeto.toFixed(2)}</p>
              </div>
              <div className="border border-gray-200 p-4 rounded-lg bg-gray-50">
                <p className="text-xs text-gray-500 font-bold uppercase">Ticket Promedio</p>
                <p className="text-2xl font-bold text-gray-900">${ticketPromedio.toFixed(2)}</p>
              </div>
            </div>

            <div className="border-t-2 border-dashed border-gray-200 pt-6">
              <h3 className="font-bold text-lg mb-4 text-gray-800">Desglose de Métodos de Pago</h3>
              <div className="flex gap-12">
                <div>
                  <p className="text-sm text-gray-500">Cobro en Efectivo</p>
                  <p className="text-xl font-bold">${efectivoSales.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Comprobantes por Transferencia</p>
                  <p className="text-xl font-bold">${transferenciaSales.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="border-t-2 border-dashed border-gray-200 pt-6">
              <h3 className="font-bold text-lg mb-4 text-gray-800">Top 4 Productos Más Vendidos</h3>
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="py-2">Producto</th>
                    <th className="py-2 text-center">Piezas</th>
                    <th className="py-2 text-right">Total Generado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topPlatillos.map(p => (
                    <tr key={p.name}>
                      <td className="py-3 font-semibold">{p.name}</td>
                      <td className="py-3 text-center">{p.count}</td>
                      <td className="py-3 text-right font-bold">${p.total.toFixed(2)}</td>
                    </tr>
                  ))}
                  {topPlatillos.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-gray-500">No hay ventas registradas.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </PrintLayout>
      )}

      {printReportType === 'top10' && (
        <PrintLayout
          title="Reporte de Top 10 Platillos"
          subtitle={`Periodo Analizado: ${t10FilterPeriod === 'day' ? 'Hoy' : t10FilterPeriod === 'week' ? 'Esta Semana' : t10FilterPeriod === 'month' ? 'Este Mes' : 'Rango Personalizado'}`}
          config={config}
          onClose={() => setPrintReportType('none')}
        >
          <div className="space-y-6">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300 bg-gray-50">
                  <th className="py-3 px-4 font-bold text-gray-700"># Ranking</th>
                  <th className="py-3 px-4 font-bold text-gray-700">Producto o Platillo</th>
                  <th className="py-3 px-4 font-bold text-gray-700 text-center">Cantidad Vendida</th>
                  <th className="py-3 px-4 font-bold text-gray-700 text-right">Ingreso Bruto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {t10All.map((p, idx) => (
                  <tr key={p.name}>
                    <td className="py-3 px-4 font-bold text-gray-500">{idx + 1}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900">{p.name}</td>
                    <td className="py-3 px-4 text-center">{p.count} pzas</td>
                    <td className="py-3 px-4 text-right font-bold text-amber-700">${p.total.toFixed(2)}</td>
                  </tr>
                ))}
                {t10All.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">Sin datos de venta en el periodo.</td>
                  </tr>
                )}
              </tbody>
            </table>
            
            {t10All.length > 0 && (
              <div className="flex justify-end pt-4 border-t-2 border-gray-800">
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-500 uppercase">Total Piezas Top 10</p>
                  <p className="text-xl font-black text-gray-900">{t10All.reduce((acc, p) => acc + p.count, 0)}</p>
                </div>
                <div className="text-right ml-12">
                  <p className="text-sm font-bold text-gray-500 uppercase">Ingreso Total Top 10</p>
                  <p className="text-xl font-black text-amber-600">${t10All.reduce((acc, p) => acc + p.total, 0).toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>
        </PrintLayout>
      )}
    </div>
  );
};
