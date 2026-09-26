/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserPlus, Clock, FilePlus, RefreshCw, Eye, Trash2, Edit2, Search, DollarSign, Activity, FileText, Plus, X, Printer } from 'lucide-react';
import { Client, TimeEntry, Invoice, TabType } from '../types';

interface BillingManagerProps {
  clients: Client[];
  timeEntries: TimeEntry[];
  invoices: Invoice[];
  onAddClient: (client: Client) => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onAddTimeEntry: (entry: TimeEntry) => void;
  onEditTimeEntry: (entry: TimeEntry) => void;
  onDeleteTimeEntry: (id: string) => void;
  onAddInvoice: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
  onResetSeedData: () => void;
  triggerToast: (type: 'success' | 'error' | 'info', title: string, description?: string) => void;
}

export const BillingManager: React.FC<BillingManagerProps> = ({
  clients,
  timeEntries,
  invoices,
  onAddClient,
  onEditClient,
  onDeleteClient,
  onAddTimeEntry,
  onEditTimeEntry,
  onDeleteTimeEntry,
  onAddInvoice,
  onEditInvoice,
  onDeleteInvoice,
  onResetSeedData,
  triggerToast
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'operations' | 'records'>('dashboard');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>('all');

  // Modal forms states
  const [showEntryModal, setShowEntryModal] = useState<boolean>(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);

  // New/Edit Entry form fields
  const [fieldClientId, setFieldClientId] = useState<string>('');
  const [fieldDesc, setFieldDesc] = useState<string>('');
  const [fieldDuration, setFieldDuration] = useState<number>(60);
  const [fieldRate, setFieldRate] = useState<number>(50);

  // Preview Document Simulation Modal
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  // Calculation Metrics (Dashboard)
  const totalClients = clients.length;
  const totalBilledVal = invoices.reduce((acc, inv) => acc + (inv.status === 'paid' ? inv.total : 0), 0);
  const totalPendingVal = invoices.reduce((acc, inv) => acc + (inv.status === 'sent' ? inv.total : 0), 0);
  const totalMinutesWorked = timeEntries.reduce((acc, t) => acc + t.durationMinutes, 0);

  // Status distribution percentages
  const paidCount = invoices.filter(i => i.status === 'paid').length;
  const sentCount = invoices.filter(i => i.status === 'sent').length;
  const draftCount = invoices.filter(i => i.status === 'draft').length;
  const totalInvs = invoices.length || 1;

  const paidPct = Math.round((paidCount / totalInvs) * 100);
  const sentPct = Math.round((sentCount / totalInvs) * 100);
  const draftPct = Math.round((draftCount / totalInvs) * 100);

  const handleOpenNewEntry = () => {
    if (clients.length === 0) {
      triggerToast('error', 'Sin Clientes', 'Por favor primero registra un cliente.');
      return;
    }
    setEditingEntry(null);
    setFieldClientId(clients[0].id);
    setFieldDesc('');
    setFieldDuration(60);
    setFieldRate(clients[0].hourlyRate || 50);
    setShowEntryModal(true);
  };

  const handleOpenEditEntry = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setFieldClientId(entry.clientId);
    setFieldDesc(entry.description);
    setFieldDuration(entry.durationMinutes);
    setFieldRate(entry.hourlyRate);
    setShowEntryModal(true);
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldDesc) {
      triggerToast('error', 'Campos Inválidos', 'La descripción es obligatoria.');
      return;
    }

    if (editingEntry) {
      const updated: TimeEntry = {
        ...editingEntry,
        clientId: fieldClientId,
        description: fieldDesc,
        durationMinutes: Number(fieldDuration),
        hourlyRate: Number(fieldRate)
      };
      onEditTimeEntry(updated);
      triggerToast('success', 'Registro Actualizado', 'Se guardaron los cambios del registro de horas.');
    } else {
      const created: TimeEntry = {
        id: `t-${Date.now()}`,
        clientId: fieldClientId,
        description: fieldDesc,
        durationMinutes: Number(fieldDuration),
        hourlyRate: Number(fieldRate),
        isBilled: false,
        createdAt: new Date().toISOString()
      };
      onAddTimeEntry(created);
      triggerToast('success', 'Horas Registradas', 'Se ha sumado el nuevo registro de tiempo.');
    }
    setShowEntryModal(false);
  };

  const handleDeleteEntry = (id: string) => {
    if (window.confirm('¿Seguro que deseas eliminar este registro de tiempo?')) {
      onDeleteTimeEntry(id);
      triggerToast('info', 'Registro Eliminado', 'Se quitó de la hoja de tiempo.');
    }
  };

  // Filters
  const filteredEntries = timeEntries.filter(t => {
    const client = clients.find(c => c.id === t.clientId);
    const clientName = client ? client.name.toLowerCase() : '';
    const desc = t.description.toLowerCase();
    const query = searchTerm.toLowerCase();

    return clientName.includes(query) || desc.includes(query);
  });

  return (
    <div className="space-y-6" id="billing-manager-view">
      {/* Sub Tabs Selector & Pill Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-amber-50/50 p-4 rounded-xl border border-amber-200">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveSubTab('dashboard')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'dashboard'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveSubTab('operations')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'operations'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}
          >
            Operaciones Core
          </button>
          <button
            onClick={() => setActiveSubTab('records')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'records'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}
          >
            Directorio / Registros
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Servicios Locales Activos
          </span>
          <button
            onClick={() => {
              onResetSeedData();
              triggerToast('success', 'Datos Reestablecidos', 'Se volvieron a sembrar los datos demo originales.');
            }}
            className="p-1.5 border border-amber-200 bg-white hover:bg-amber-50 text-amber-950 font-semibold rounded-lg text-xs inline-flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reiniciar Semillas
          </button>
        </div>
      </div>

      {activeSubTab === 'dashboard' ? (
        /* SUB VIEW 1: DASHBOARD STATS */
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200">
              <span className="text-[10px] uppercase font-bold text-gray-400">Clientes Totales</span>
              <p className="text-2xl font-serif font-bold text-amber-950 mt-1">{totalClients}</p>
              <span className="text-[9px] text-gray-400">Directorio de Cuentas B2B</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200">
              <span className="text-[10px] uppercase font-bold text-gray-400">Horas Registradas</span>
              <p className="text-2xl font-serif font-bold text-amber-950 mt-1 whitespace-nowrap overflow-hidden text-ellipsis">
                {(totalMinutesWorked / 60).toFixed(1)} hrs
              </p>
              <span className="text-[9px] text-gray-400">Tiempo total de comanda</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200">
              <span className="text-[10px] uppercase font-bold text-gray-400">Cobrado (Paid)</span>
              <p className="text-2xl font-serif font-bold text-emerald-600 mt-1 whitespace-nowrap overflow-hidden text-ellipsis">${totalBilledVal.toFixed(2)}</p>
              <span className="text-[9px] text-gray-400">Facturas finiquitadas</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200">
              <span className="text-[10px] uppercase font-bold text-gray-400">Pendiente (Sent)</span>
              <p className="text-2xl font-serif font-bold text-rose-500 mt-1 whitespace-nowrap overflow-hidden text-ellipsis">${totalPendingVal.toFixed(2)}</p>
              <span className="text-[9px] text-gray-400">Corte por cobrar</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Status breakdown progress bar */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 lg:col-span-8 space-y-4">
              <h3 className="font-serif font-bold text-sm text-amber-950">Distribución de Facturas</h3>
              <p className="text-xs text-gray-500">Mapeo porcentual de cobranza activa.</p>

              <div className="h-6 w-full bg-gray-100 rounded-lg overflow-hidden flex font-bold text-[10px] text-white">
                <div style={{ width: `${paidPct}%` }} className="bg-emerald-500 flex items-center justify-center">
                  {paidPct > 10 ? `${paidPct}% Paid` : ''}
                </div>
                <div style={{ width: `${sentPct}%` }} className="bg-amber-500 flex items-center justify-center">
                  {sentPct > 10 ? `${sentPct}% Sent` : ''}
                </div>
                <div style={{ width: `${draftPct}%` }} className="bg-gray-400 flex items-center justify-center">
                  {draftPct > 10 ? `${draftPct}% Draft` : ''}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 text-xs">
                <div>
                  <span className="inline-block w-2.5 h-2.5 bg-emerald-500 rounded-full mr-1.5"></span>
                  <span className="font-medium text-gray-500">Paid: {paidCount}</span>
                </div>
                <div>
                  <span className="inline-block w-2.5 h-2.5 bg-amber-500 rounded-full mr-1.5"></span>
                  <span className="font-medium text-gray-500">Sent: {sentCount}</span>
                </div>
                <div>
                  <span className="inline-block w-2.5 h-2.5 bg-gray-400 rounded-full mr-1.5"></span>
                  <span className="font-medium text-gray-500">Draft: {draftCount}</span>
                </div>
              </div>
            </div>

            {/* Recent activity logs */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 lg:col-span-4 space-y-4">
              <h3 className="font-serif font-bold text-sm text-amber-950 flex items-center gap-1">
                <Activity className="w-4 h-4 text-amber-600" />
                Logs Recientes
              </h3>
              <div className="space-y-3">
                {timeEntries.slice(0, 3).map(t => (
                  <div key={t.id} className="text-xs flex flex-col border-b pb-2">
                    <span className="font-bold text-gray-700">{t.description}</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">Hace un momento • {t.durationMinutes} minutos</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : activeSubTab === 'operations' ? (
        /* SUB VIEW 2: OPERATIONS PANEL */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por cliente o concepto..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <button
              onClick={handleOpenNewEntry}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Nuevo Registro de Tiempo
            </button>
          </div>

          <div className="bg-white border rounded-xl overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="p-4">Descripción / Servicio</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Duración</th>
                  <th className="p-4">Tarifa por Hora</th>
                  <th className="p-4 text-center">Estatus Facturado</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredEntries.map(entry => {
                  const cli = clients.find(c => c.id === entry.clientId);
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50/50">
                      <td className="p-4 font-bold text-amber-950">{entry.description}</td>
                      <td className="p-4 text-gray-600 font-medium">{cli ? cli.name : 'Desconocido'}</td>
                      <td className="p-4 text-gray-500">{entry.durationMinutes} min</td>
                      <td className="p-4 font-bold text-amber-600">${entry.hourlyRate}/hr</td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-semibold ${
                          entry.isBilled ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {entry.isBilled ? 'Billed' : 'Unbilled'}
                        </span>
                      </td>
                      <td className="p-4 text-right flex justify-end gap-2.5">
                        <button
                          onClick={() => handleOpenEditEntry(entry)}
                          className="p-1 hover:text-amber-600 text-gray-400"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="p-1 hover:text-rose-500 text-gray-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* SUB VIEW 3: INVOICES & DIRECTORY */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-gray-200 space-y-4">
            <h3 className="font-serif font-bold text-sm text-amber-950">Facturas Emitidas</h3>
            <div className="divide-y divide-gray-100">
              {invoices.map(inv => (
                <div key={inv.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div>
                    <p className="font-bold text-amber-950">{inv.invoiceNumber}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">Cliente: {inv.clientName} • Vence: {inv.dueDate}</p>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span className="font-bold text-emerald-600 whitespace-nowrap text-sm">${inv.total.toFixed(2)}</span>
                    <button
                      onClick={() => setPreviewInvoice(inv)}
                      className="p-1 border hover:bg-gray-50 text-gray-500 rounded flex items-center gap-1 text-[10px] font-bold"
                    >
                      <Eye className="w-3 h-3" />
                      Visualizar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 bg-white p-6 rounded-xl border border-gray-200 space-y-4">
            <h3 className="font-serif font-bold text-sm text-amber-950">Lista de Clientes</h3>
            <div className="divide-y divide-gray-100">
              {clients.map(c => (
                <div key={c.id} className="py-2.5 text-xs flex flex-col">
                  <span className="font-bold text-gray-800">{c.name}</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">{c.company} • {c.email}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Entry Dialog Modal */}
      {showEntryModal && (
        <div className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <form onSubmit={handleSaveEntry} className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 animate-scale-up max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] flex flex-col my-auto">
            <div className="p-4 bg-amber-50 border-b flex justify-between items-center shrink-0">
              <h4 className="font-serif font-bold text-sm text-amber-950">
                {editingEntry ? 'Editar Registro de Tiempo' : 'Registrar Tiempo Trabajado'}
              </h4>
              <button type="button" onClick={() => setShowEntryModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 flex-1 min-h-0 overflow-y-auto overscroll-contain">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Cliente *</label>
                <select
                  value={fieldClientId}
                  onChange={e => setFieldClientId(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-hidden"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.company})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Concepto / Servicio prestado *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Diseño UI del Dashboard"
                  value={fieldDesc}
                  onChange={e => setFieldDesc(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Duración (Minutos)</label>
                  <input
                    type="number"
                    min={1}
                    value={fieldDuration}
                    onChange={e => setFieldDuration(Number(e.target.value))}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Tarifa por Hora ($)</label>
                  <input
                    type="number"
                    min={1}
                    value={fieldRate}
                    onChange={e => setFieldRate(Number(e.target.value))}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 bg-gray-50 border-t flex justify-end gap-3 shrink-0 sticky bottom-0 z-10 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
              <button
                type="button"
                onClick={() => setShowEntryModal(false)}
                className="px-4 py-2 border border-gray-300 hover:bg-gray-100 rounded-xl text-xs text-gray-600 cursor-pointer font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md"
              >
                Guardar Horas
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Invoice Print Simulator Modal */}
      {previewInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 animate-scale-up max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] flex flex-col my-auto">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center shrink-0">
              <h4 className="font-bold text-xs uppercase text-gray-500">Visualizar Factura</h4>
              <button onClick={() => setPreviewInvoice(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-5 flex-1 min-h-0 overflow-y-auto overscroll-contain">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">FACTURA</h3>
                  <p className="text-xs text-gray-400">{previewInvoice.invoiceNumber}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                  previewInvoice.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {previewInvoice.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-gray-400 font-bold">Cliente:</p>
                  <p className="font-semibold text-gray-800">{previewInvoice.clientName}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold">Fecha límite:</p>
                  <p className="font-semibold text-gray-800">{previewInvoice.dueDate}</p>
                </div>
              </div>

              <div className="border-t border-b py-4 space-y-2 text-xs">
                {previewInvoice.items.map(itm => (
                  <div key={itm.id} className="flex justify-between">
                    <span className="text-gray-600">{itm.description}</span>
                    <span className="font-bold text-gray-800">${itm.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 text-right text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal:</span>
                  <span className="font-bold text-gray-700">${previewInvoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-amber-950 pt-1.5 border-t">
                  <span>Total Facturado:</span>
                  <span>${previewInvoice.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 bg-gray-50 border-t shrink-0 sticky bottom-0 z-10 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
              <button
                type="button"
                onClick={() => {
                  window.print();
                  triggerToast('success', 'Impresión de factura', 'Se ha disparado el diálogo nativo.');
                }}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Imprimir Documento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
