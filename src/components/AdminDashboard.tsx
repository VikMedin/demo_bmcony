/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Printer, 
  Percent, 
  ShieldCheck, 
  DollarSign, 
  ArrowRight, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Receipt, 
  X, 
  ListOrdered, 
  Award,
  Eye,
  Phone,
  MapPin,
  Copy,
  Check,
  Calendar,
  ShoppingBag,
  Truck,
  UtensilsCrossed,
  Tag,
  AlertCircle,
  Search,
  ExternalLink,
  MessageCircle,
  FileSpreadsheet
} from 'lucide-react';
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
  const [showDetails, setShowDetails] = useState(true);
  const [selectedOrderModal, setSelectedOrderModal] = useState<FoodOrder | null>(null);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [ticketToPrint, setTicketToPrint] = useState<FoodOrder | null>(null);

  // --- Print State ---
  const [printReportType, setPrintReportType] = useState<'none' | 'dashboard' | 'top10' | 'order-ticket'>('none');

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

  // CSV Exporter Completo con todos los datos de los pedidos
  const handleExportCSV = (exportAll: boolean = false) => {
    const listToExport = exportAll ? orders : filteredOrders;
    
    if (listToExport.length === 0) {
      triggerToast('error', 'Sin pedidos para exportar', 'No hay registros en la selección elegida.');
      return;
    }

    const headers = [
      'ID Pedido',
      'Folio',
      'Fecha',
      'Hora',
      'Cliente',
      'Teléfono',
      'Tipo de Entrega',
      'Dirección de Entrega',
      'Detalle de Platillos Solicitados',
      'Cantidad Total Platillos',
      'Subtotal',
      'Cupón Aplicado',
      'Descuento',
      'Costo Envío',
      'Propina',
      'Total Pedido',
      'Método de Pago',
      'Estado del Pedido',
      'Tiempo Límite SLA',
      'Notas / Instrucciones'
    ];

    const escapeCsv = (str: string | number | undefined | null) => {
      if (str === undefined || str === null) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = listToExport.map(o => {
      const orderDate = new Date(o.createdAt);
      const fecha = !isNaN(orderDate.getTime()) ? orderDate.toISOString().split('T')[0] : o.createdAt;
      const hora = !isNaN(orderDate.getTime()) 
        ? orderDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
        : '';
      
      const slaDate = o.slaLimitTime ? new Date(o.slaLimitTime) : null;
      const slaStr = slaDate && !isNaN(slaDate.getTime()) 
        ? slaDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) 
        : 'N/A';

      // Detalle legible y completo de productos
      const itemsDetail = (o.items || []).map(itm => {
        let desc = `${itm.quantity}x ${itm.name} ($${itm.price.toFixed(2)})`;
        if (itm.selectedOptions && Object.keys(itm.selectedOptions).length > 0) {
          const opts = Object.entries(itm.selectedOptions)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join('/') : String(v)}`)
            .join('; ');
          desc += ` [${opts}]`;
        }
        if (itm.selectedExtras && itm.selectedExtras.length > 0) {
          const extras = itm.selectedExtras.map(e => `${e.name} (+$${e.price.toFixed(2)})`).join(', ');
          desc += ` [Extras: ${extras}]`;
        }
        return desc;
      }).join(' | ');

      const totalPiezas = (o.items || []).reduce((acc, itm) => acc + itm.quantity, 0);

      return [
        escapeCsv(o.id),
        escapeCsv(o.orderNumber),
        escapeCsv(fecha),
        escapeCsv(hora),
        escapeCsv(o.clientName),
        escapeCsv(o.clientPhone),
        escapeCsv(o.deliveryType === 'domicilio' ? 'A Domicilio' : 'En Local / Mostrador'),
        escapeCsv(o.address || 'N/A (Mostrador)'),
        escapeCsv(itemsDetail),
        totalPiezas,
        (o.subtotal || 0).toFixed(2),
        escapeCsv(o.couponCode || 'Ninguno'),
        (o.discountAmount || 0).toFixed(2),
        (o.deliveryFee || 0).toFixed(2),
        (o.tip || 0).toFixed(2),
        (o.total || 0).toFixed(2),
        escapeCsv(o.paymentMethod === 'efectivo' ? 'Efectivo' : 'Transferencia'),
        escapeCsv(o.status.toUpperCase()),
        escapeCsv(slaStr),
        escapeCsv(o.notes || 'Sin notas especiales')
      ].join(',');
    });

    // UTF-8 BOM (\uFEFF) para visualización correcta de acentos en Excel y hojas de cálculo
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const periodLabel = exportAll ? 'historico_completo' : filterPeriod;
    link.download = `pedidos_desayunos_cony_${periodLabel}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    triggerToast(
      'success', 
      'Archivo CSV Generado', 
      `Se descargaron ${listToExport.length} pedidos con todos los datos detallados.`
    );
  };

  const handleCopyOrderId = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedOrderId(true);
      triggerToast('info', 'ID Copiado', `El ID ${id} se copió al portapapeles.`);
      setTimeout(() => setCopiedOrderId(false), 2000);
    });
  };

  // Print PDF Simulation / Custom triggers
  const handlePrintPDF = () => {
    setPrintReportType('dashboard');
  };

  const handlePrintOrderTicket = (order: FoodOrder) => {
    setTicketToPrint(order);
    setPrintReportType('order-ticket');
  };

  // Filtrado de pedidos para el desglose detallado
  const displayedOrders = filteredOrders.filter(o => {
    if (!orderSearchQuery.trim()) return true;
    const q = orderSearchQuery.toLowerCase();
    return (
      (o.id && o.id.toLowerCase().includes(q)) ||
      (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
      (o.clientName && o.clientName.toLowerCase().includes(q)) ||
      (o.clientPhone && o.clientPhone.includes(q)) ||
      (o.items && o.items.some(i => i.name.toLowerCase().includes(q)))
    );
  });

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
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between p-5 bg-gray-50 hover:bg-gray-100/80 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white rounded-xl shadow-xs text-amber-600 border border-amber-100">
              <Receipt className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-gray-900">Desglose Detallado de Ventas</h4>
                <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                  {filteredOrders.length} {filteredOrders.length === 1 ? 'pedido' : 'pedidos'}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Haz clic en cualquier línea de pedido para abrir la ventana modal con todos sus detalles.
              </p>
            </div>
          </div>
          {showDetails ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {showDetails && (
          <div className="p-5 border-t border-gray-200 bg-white animate-fade-in space-y-4">
            {/* Buscador de pedidos y filtro rápido */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-amber-50/50 p-3 rounded-xl border border-amber-100">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-amber-700 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  placeholder="Buscar por ID de pedido, folio, cliente o platillo..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-amber-200 rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                />
                {orderSearchQuery && (
                  <button
                    onClick={() => setOrderSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="text-right text-xs text-amber-900 font-medium px-1">
                Mostrando <strong className="text-amber-950 font-bold">{displayedOrders.length}</strong> de {filteredOrders.length} pedidos
              </div>
            </div>

            {displayedOrders.length === 0 ? (
              <div className="text-center py-10 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <Receipt className="w-8 h-8 text-gray-400 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold text-gray-700">No se encontraron pedidos en este periodo o búsqueda.</p>
                <p className="text-xs text-gray-500 mt-1">Prueba seleccionando otro rango de fechas arriba o limpiando el filtro de búsqueda.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-amber-50/70 text-amber-950 text-xs uppercase font-bold border-b border-amber-200">
                    <tr>
                      <th className="px-4 py-3.5">Pedido</th>
                      <th className="px-4 py-3.5 text-center whitespace-nowrap">Cantidad Vendida</th>
                      <th className="px-4 py-3.5 text-right whitespace-nowrap">Ingreso Total</th>
                      <th className="px-4 py-3.5 text-center whitespace-nowrap">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {displayedOrders.map((o) => {
                      const totalPiezas = (o.items || []).reduce((acc, itm) => acc + itm.quantity, 0);
                      const itemsPreview = (o.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ');

                      return (
                        <tr 
                          key={o.id} 
                          onClick={() => setSelectedOrderModal(o)}
                          className="hover:bg-amber-50/60 transition-all cursor-pointer group"
                          title="Haz clic para ver toda la información de este pedido"
                        >
                          {/* Columna Pedido */}
                          <td className="px-4 py-3.5 align-middle">
                            <div className="flex flex-col gap-1.5 min-w-[200px]">
                              {/* Línea 1: Número de Pedido y Cliente */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-sm text-gray-900 group-hover:text-amber-800 transition-colors">
                                  #{o.orderNumber}
                                </span>
                                <span className="text-gray-300">•</span>
                                <span className="font-bold text-sm text-gray-800">
                                  {o.clientName}
                                </span>
                              </div>

                              {/* Línea 2: Avisos de Estatus y Tipo de Entrega (Lectura de corrido de izquierda a derecha) */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                  o.status === 'entregado'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : o.status === 'recibido'
                                    ? 'bg-amber-100 text-amber-800'
                                    : o.status === 'preparando'
                                    ? 'bg-blue-100 text-blue-800'
                                    : o.status === 'listo'
                                    ? 'bg-purple-100 text-purple-800'
                                    : o.status === 'camino'
                                    ? 'bg-indigo-100 text-indigo-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {o.status}
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                  o.deliveryType === 'domicilio' 
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}>
                                  {o.deliveryType === 'domicilio' ? '🛵 Domicilio' : '🛍️ Local'}
                                </span>
                              </div>

                              <p className="text-xs text-gray-500 line-clamp-1 group-hover:text-gray-700 transition-colors pt-0.5">
                                {itemsPreview || 'Sin productos'}
                              </p>
                            </div>
                          </td>

                          {/* Cantidad Vendida */}
                          <td className="px-4 py-3.5 align-middle text-center whitespace-nowrap">
                            <span className="bg-gray-100 text-gray-800 font-bold py-1.5 px-3 rounded-lg text-xs inline-block">
                              {totalPiezas} pzas
                            </span>
                          </td>

                          {/* Ingreso Total */}
                          <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap">
                            <div>
                              <span className="font-extrabold text-amber-800 text-sm block">
                                ${(o.total || 0).toFixed(2)}
                              </span>
                              <span className="text-[11px] text-gray-500 font-medium capitalize block">
                                {o.paymentMethod === 'efectivo' ? '💵 Efectivo' : '🏦 Transferencia'}
                              </span>
                              {o.paymentMethod === 'efectivo' && o.needsChange && o.payingWith && (
                                <span className="text-[10px] text-amber-900 font-bold block">
                                  🪙 Cambio: ${(o.changeAmount || 0).toFixed(2)} (Paga ${o.payingWith.toFixed(2)})
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Acción Ver Modal */}
                          <td className="px-4 py-3.5 align-middle text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrderModal(o);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all shadow-xs group-hover:scale-105"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ver</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Fila de Totales */}
                    <tr className="bg-amber-50/80 font-bold border-t-2 border-amber-300">
                      <td className="px-4 py-4 font-mono text-xs text-amber-950 uppercase">
                        Total General ({displayedOrders.length} {displayedOrders.length === 1 ? 'pedido' : 'pedidos'})
                      </td>
                      <td className="px-4 py-4 text-center text-amber-950 font-extrabold text-sm">
                        {displayedOrders.reduce((acc, o) => acc + (o.items || []).reduce((s, itm) => s + itm.quantity, 0), 0)} pzas
                      </td>
                      <td className="px-4 py-4 text-right text-amber-800 text-base font-black">
                        ${displayedOrders.reduce((acc, o) => acc + (o.total || 0), 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-4"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PDF & CSV Export Area con todos los datos */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div>
          <h4 className="font-bold text-xs text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
            <Download className="w-4 h-4 text-amber-600" />
            Exportación Oficial de Pedidos (Métricas)
          </h4>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Descarga los archivos con todos los datos de los pedidos realizados (ID, folio, cliente, teléfono, dirección, platillos, subtotal, envío, propina, total y pago).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => handleExportCSV(false)}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
            title="Descarga todos los datos de los pedidos del periodo actual"
          >
            <Download className="w-4 h-4" />
            Descargar CSV ({filterPeriod === 'day' ? 'Hoy' : filterPeriod === 'week' ? 'Semana' : filterPeriod === 'month' ? 'Mes' : 'Rango'}: {filteredOrders.length})
          </button>
          <button
            onClick={() => handleExportCSV(true)}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-colors"
            title="Descarga la base completa histórica con todos los pedidos realizados"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            Histórico Completo ({orders.length})
          </button>
          <button
            onClick={handlePrintPDF}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            Imprimir Reporte
          </button>
        </div>
      </div>

      {/* MODAL DETALLE COMPLETO DE PEDIDO */}
      {selectedOrderModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-gray-900/50 backdrop-blur-xs animate-fade-in overflow-y-auto"
          onClick={() => setSelectedOrderModal(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] border border-gray-100 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-gray-100 bg-amber-50/70 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-serif font-bold text-lg text-amber-950">
                      Pedido #{selectedOrderModal.orderNumber}
                    </h3>
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                      selectedOrderModal.status === 'entregado'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : selectedOrderModal.status === 'recibido'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : selectedOrderModal.status === 'preparando'
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : selectedOrderModal.status === 'listo'
                        ? 'bg-purple-100 text-purple-800 border border-purple-300'
                        : selectedOrderModal.status === 'camino'
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                        : 'bg-red-100 text-red-800 border border-red-300'
                    }`}>
                      {selectedOrderModal.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-700 font-bold">
                      ID: {selectedOrderModal.id}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyOrderId(selectedOrderModal.id)}
                      className="text-amber-700 hover:text-amber-900 font-bold inline-flex items-center gap-1 text-[11px] hover:underline"
                      title="Copiar ID"
                    >
                      {copiedOrderId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedOrderId ? '¡Copiado!' : 'Copiar ID'}</span>
                    </button>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedOrderModal(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-colors"
                title="Cerrar ventana"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-sm">
              {/* Información del Cliente y Entrega */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-600" />
                    Datos del Cliente
                  </h4>
                  <p className="font-bold text-base text-gray-900">{selectedOrderModal.clientName}</p>
                  <p className="text-sm text-gray-600 mt-1 flex items-center gap-2 flex-wrap">
                    <span>{selectedOrderModal.clientPhone}</span>
                    <a 
                      href={`tel:${selectedOrderModal.clientPhone}`}
                      className="text-amber-600 hover:text-amber-800 text-xs font-bold underline"
                    >
                      Llamar
                    </a>
                    <span>•</span>
                    <a 
                      href={`https://wa.me/52${selectedOrderModal.clientPhone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:text-emerald-800 text-xs font-bold underline inline-flex items-center gap-1"
                    >
                      <MessageCircle className="w-3 h-3" />
                      WhatsApp
                    </a>
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-amber-600" />
                    Tipo de Entrega
                  </h4>
                  <p className="font-bold text-base text-gray-900">
                    {selectedOrderModal.deliveryType === 'domicilio' ? '🛵 Entrega a Domicilio' : '🛍️ Para Llevar / Local'}
                  </p>
                  {selectedOrderModal.deliveryType === 'domicilio' && selectedOrderModal.address ? (
                    <div className="mt-1">
                      <p className="text-xs text-gray-600 flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <span>{selectedOrderModal.address}</span>
                      </p>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedOrderModal.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-[11px] font-bold underline mt-1 inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Ver en Google Maps
                      </a>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">El cliente recoge en el mostrador del restaurante.</p>
                  )}
                </div>
              </div>

              {/* Notas del comensal */}
              {selectedOrderModal.notes && (
                <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-amber-950 uppercase">Notas e Instrucciones del Cliente:</span>
                    <p className="text-sm text-amber-900 mt-0.5 font-medium">{selectedOrderModal.notes}</p>
                  </div>
                </div>
              )}

              {/* Fechas y SLA */}
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span><strong>Fecha:</strong> {new Date(selectedOrderModal.createdAt).toLocaleDateString('es-MX', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span><strong>Hora:</strong> {new Date(selectedOrderModal.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {selectedOrderModal.slaLimitTime && (
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <span className="text-amber-800 font-bold">Límite SLA:</span>
                    <span>{new Date(selectedOrderModal.slaLimitTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}
              </div>

              {/* Platillos y Productos Solicitados */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600" />
                  Platillos y Alimentos Solicitados ({(selectedOrderModal.items || []).reduce((s, itm) => s + itm.quantity, 0)} piezas)
                </h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                  {(selectedOrderModal.items || []).map((itm, idx) => {
                    const extrasCost = (itm.selectedExtras || []).reduce((s, e) => s + e.price, 0);
                    const itemRowTotal = (itm.price + extrasCost) * itm.quantity;
                    return (
                      <div key={idx} className="p-3.5 bg-white hover:bg-gray-50/50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-sm text-gray-900">
                              {itm.quantity}x {itm.name}
                            </span>
                            <span className="text-xs text-gray-500 ml-2 font-medium">
                              (${itm.price.toFixed(2)} c/u)
                            </span>
                          </div>
                          <span className="font-bold text-sm text-amber-800">
                            ${itemRowTotal.toFixed(2)}
                          </span>
                        </div>

                        {/* Opciones seleccionadas */}
                        {itm.selectedOptions && Object.keys(itm.selectedOptions).length > 0 && (
                          <div className="mt-1 pl-3 space-y-0.5 text-xs text-gray-600">
                            {Object.entries(itm.selectedOptions).map(([optTitle, choices]) => (
                              <p key={optTitle} className="leading-tight">
                                <span className="font-semibold text-gray-700">{optTitle}:</span> {Array.isArray(choices) ? choices.join(', ') : String(choices)}
                              </p>
                            ))}
                          </div>
                        )}

                        {/* Extras seleccionados */}
                        {itm.selectedExtras && itm.selectedExtras.length > 0 && (
                          <div className="mt-1 pl-3 space-y-0.5 text-xs text-emerald-700 font-medium">
                            {itm.selectedExtras.map((ex, eIdx) => (
                              <p key={eIdx} className="leading-tight">
                                + Extra: {ex.name} (+${ex.price.toFixed(2)})
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Resumen Financiero */}
              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 space-y-2">
                <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide mb-1">
                  Resumen de Cuenta y Pago
                </h4>
                <div className="flex justify-between text-xs text-gray-700">
                  <span>Subtotal Alimentos:</span>
                  <span className="font-semibold">${(selectedOrderModal.subtotal || 0).toFixed(2)}</span>
                </div>
                {selectedOrderModal.discountAmount && selectedOrderModal.discountAmount > 0 ? (
                  <div className="flex justify-between text-xs text-emerald-700 font-bold">
                    <span>Descuento ({selectedOrderModal.couponCode || 'Cupón'}):</span>
                    <span>-${selectedOrderModal.discountAmount.toFixed(2)}</span>
                  </div>
                ) : null}
                {selectedOrderModal.deliveryFee > 0 && (
                  <div className="flex justify-between text-xs text-gray-700">
                    <span>Costo de Envío:</span>
                    <span className="font-semibold">${selectedOrderModal.deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                {selectedOrderModal.tip > 0 && (
                  <div className="flex justify-between text-xs text-gray-700">
                    <span>Propina Voluntaria:</span>
                    <span className="font-semibold">${selectedOrderModal.tip.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-amber-200 pt-2 flex justify-between items-center text-sm font-extrabold text-amber-950">
                  <span>Total Cobrado:</span>
                  <span className="text-2xl font-black text-amber-800">${selectedOrderModal.total.toFixed(2)}</span>
                </div>
                <div className="pt-1 text-xs text-gray-600 flex items-center justify-between">
                  <span>Método de Pago:</span>
                  <span className="font-bold text-gray-800 capitalize bg-white px-2 py-0.5 rounded border border-amber-200">
                    {selectedOrderModal.paymentMethod === 'efectivo' ? '💵 Efectivo' : '🏦 Transferencia Bancaria'}
                  </span>
                </div>
                {selectedOrderModal.paymentMethod === 'efectivo' && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs">
                    {selectedOrderModal.needsChange && selectedOrderModal.payingWith ? (
                      <div className="flex items-center justify-between">
                        <span>Paga con billete: <strong>${selectedOrderModal.payingWith.toFixed(2)} MXN</strong></span>
                        <span className="font-extrabold text-emerald-800">
                          🪙 Cambio a entregar: ${(selectedOrderModal.changeAmount || 0).toFixed(2)} MXN
                        </span>
                      </div>
                    ) : (
                      <span className="text-emerald-800 font-semibold">✅ Pago exacto acordado</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 bg-gray-50 border-t border-gray-150 flex items-center justify-between gap-3 shrink-0 sticky bottom-0 z-10 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
              <button
                type="button"
                onClick={() => handlePrintOrderTicket(selectedOrderModal)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Imprimir Comanda / Ticket
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrderModal(null)}
                className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TOP 10 PLATILLOS */}
      {showTop10Modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] my-auto">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base sm:text-lg text-amber-950">Top 10 Platillos</h3>
                  <p className="text-[10px] text-gray-500">Ranking oficial de productos más vendidos.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowTop10Modal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-100 shrink-0">
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

            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 overscroll-contain">
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

            <div className="p-3.5 sm:p-4 border-t border-gray-150 bg-white flex items-center justify-end gap-3 shrink-0 sticky bottom-0 z-10 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
              <button
                type="button"
                onClick={handleExportT10CSV}
                disabled={t10All.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
              <button
                type="button"
                onClick={handlePrintT10PDF}
                disabled={t10All.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
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

      {/* RENDER INDIVIDUAL ORDER TICKET PRINT */}
      {printReportType === 'order-ticket' && ticketToPrint && (
        <PrintLayout
          title={`Comanda de Pedido #${ticketToPrint.orderNumber}`}
          subtitle={`ID: ${ticketToPrint.id} • ${ticketToPrint.deliveryType === 'domicilio' ? 'Entrega a Domicilio' : 'Mostrador / Local'}`}
          config={config}
          onClose={() => {
            setPrintReportType('none');
            setTicketToPrint(null);
          }}
        >
          <div className="space-y-6 max-w-lg mx-auto font-mono text-sm border border-gray-200 p-6 rounded-xl bg-white shadow-xs">
            <div className="text-center border-b-2 border-dashed border-gray-300 pb-4">
              <p className="text-2xl font-bold text-gray-900">COMANDA #{ticketToPrint.orderNumber}</p>
              <p className="text-xs text-gray-500 mt-1">ID Único: {ticketToPrint.id}</p>
              <p className="text-xs text-gray-600 mt-0.5">Fecha: {new Date(ticketToPrint.createdAt).toLocaleString('es-MX')}</p>
            </div>

            <div className="border-b-2 border-dashed border-gray-300 pb-4 text-xs space-y-1">
              <p><strong>Comensal:</strong> {ticketToPrint.clientName}</p>
              <p><strong>Teléfono:</strong> {ticketToPrint.clientPhone}</p>
              <p><strong>Modalidad:</strong> {ticketToPrint.deliveryType === 'domicilio' ? '🛵 A Domicilio' : '🛍️ En Mostrador / Local'}</p>
              {ticketToPrint.address && (
                <p><strong>Dirección:</strong> {ticketToPrint.address}</p>
              )}
              {ticketToPrint.notes && (
                <div className="p-2 bg-amber-50 border border-amber-200 rounded mt-2">
                  <p className="text-amber-900"><strong>Notas Especiales:</strong> {ticketToPrint.notes}</p>
                </div>
              )}
            </div>

            <div className="border-b-2 border-dashed border-gray-300 pb-4 space-y-3">
              <p className="font-bold text-xs uppercase text-gray-800 tracking-wider">Detalle de Platillos Solicitados:</p>
              {(ticketToPrint.items || []).map((itm, i) => {
                const extrasCost = (itm.selectedExtras || []).reduce((s, e) => s + e.price, 0);
                const rowTot = (itm.price + extrasCost) * itm.quantity;
                return (
                  <div key={i} className="text-xs space-y-0.5">
                    <div className="flex justify-between font-bold text-gray-900">
                      <span>{itm.quantity}x {itm.name}</span>
                      <span>${rowTot.toFixed(2)}</span>
                    </div>
                    {itm.selectedOptions && Object.entries(itm.selectedOptions).map(([k, v]) => (
                      <p key={k} className="text-[11px] text-gray-500 pl-2">• {k}: {Array.isArray(v) ? v.join(', ') : String(v)}</p>
                    ))}
                    {itm.selectedExtras && itm.selectedExtras.map((ex, eIdx) => (
                      <p key={eIdx} className="text-[11px] text-emerald-700 pl-2">+ Extra: {ex.name} (+${ex.price.toFixed(2)})</p>
                    ))}
                  </div>
                );
              })}
            </div>

            <div className="space-y-1 text-xs pt-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${(ticketToPrint.subtotal || 0).toFixed(2)}</span>
              </div>
              {ticketToPrint.discountAmount && ticketToPrint.discountAmount > 0 ? (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Descuento ({ticketToPrint.couponCode || 'Cupón'}):</span>
                  <span>-${ticketToPrint.discountAmount.toFixed(2)}</span>
                </div>
              ) : null}
              {ticketToPrint.deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span>Costo de Envío:</span>
                  <span>${ticketToPrint.deliveryFee.toFixed(2)}</span>
                </div>
              )}
              {ticketToPrint.tip > 0 && (
                <div className="flex justify-between">
                  <span>Propina:</span>
                  <span>${ticketToPrint.tip.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-2 border-t-2 border-gray-900">
                <span>TOTAL A PAGAR:</span>
                <span>${(ticketToPrint.total || 0).toFixed(2)} MXN</span>
              </div>
              <div className="flex justify-between text-xs pt-1 text-gray-600 capitalize">
                <span>Método de Pago:</span>
                <span>{ticketToPrint.paymentMethod === 'efectivo' ? 'Efectivo' : 'Transferencia Bancaria'}</span>
              </div>
              {ticketToPrint.paymentMethod === 'efectivo' && ticketToPrint.needsChange && ticketToPrint.payingWith && (
                <div className="flex justify-between text-xs pt-0.5 text-gray-800 font-bold">
                  <span>Paga con: ${ticketToPrint.payingWith.toFixed(2)} MXN</span>
                  <span>Cambio: ${(ticketToPrint.changeAmount || 0).toFixed(2)} MXN</span>
                </div>
              )}
            </div>

            <div className="text-center pt-4 border-t border-dashed border-gray-300 text-xs text-gray-500">
              <p className="font-bold">¡Muchas gracias por su compra!</p>
              <p className="text-[11px] mt-1">{config.ticketFooter || 'BM Desayunos Cony'}</p>
            </div>
          </div>
        </PrintLayout>
      )}
    </div>
  );
};
