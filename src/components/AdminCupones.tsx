/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Tag, Plus, Trash2, CheckCircle2, Copy, Sparkles, AlertCircle, Percent, Power } from 'lucide-react';
import { Coupon } from '../types';

interface AdminCuponesProps {
  coupons: Coupon[];
  onAddCoupon: (coupon: Coupon) => void;
  onToggleCoupon: (id: string, isActive: boolean) => void;
  onDeleteCoupon: (id: string) => void;
  triggerToast: (type: 'success' | 'error' | 'info', title: string, description?: string) => void;
}

export const AdminCupones: React.FC<AdminCuponesProps> = ({
  coupons,
  onAddCoupon,
  onToggleCoupon,
  onDeleteCoupon,
  triggerToast
}) => {
  const [showForm, setShowForm] = useState<boolean>(false);
  const [code, setCode] = useState<string>('');
  const [discountPercentage, setDiscountPercentage] = useState<number>(15);
  const [description, setDescription] = useState<string>('');
  const [minPurchase, setMinPurchase] = useState<number>(100);
  const [targetTier, setTargetTier] = useState<Coupon['targetTier']>('all');
  const [isActive, setIsActive] = useState<boolean>(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');

    if (!cleanCode) {
      triggerToast('error', 'Código Inválido', 'Ingresa un código alfanumérico para el cupón.');
      return;
    }

    if (coupons.some(c => c.code.toUpperCase() === cleanCode)) {
      triggerToast('error', 'Código Duplicado', `Ya existe un cupón con el código ${cleanCode}.`);
      return;
    }

    if (discountPercentage <= 0 || discountPercentage > 100) {
      triggerToast('error', 'Porcentaje Inválido', 'El porcentaje de descuento debe ser entre 1% y 100%.');
      return;
    }

    const newCoupon: Coupon = {
      id: `coup-${Date.now()}`,
      code: cleanCode,
      discountPercentage: Number(discountPercentage),
      description: description.trim() || `${discountPercentage}% de descuento en tu orden`,
      minPurchase: Number(minPurchase) || 0,
      isActive,
      targetTier,
      createdAt: new Date().toISOString()
    };

    onAddCoupon(newCoupon);
    triggerToast('success', 'Cupón Creado', `El cupón ${cleanCode} (-${discountPercentage}%) ya está disponible.`);

    // Reset form
    setCode('');
    setDescription('');
    setDiscountPercentage(15);
    setMinPurchase(100);
    setTargetTier('all');
    setShowForm(false);
  };

  const handleCopyCode = (couponCode: string) => {
    navigator.clipboard.writeText(couponCode);
    triggerToast('info', 'Código Copiado', `El código ${couponCode} fue copiado al portapapeles.`);
  };

  const activeCount = coupons.filter(c => c.isActive).length;
  const avgDiscount = coupons.length > 0
    ? Math.round(coupons.reduce((sum, c) => sum + c.discountPercentage, 0) / coupons.length)
    : 0;

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-6" id="coupons-manager">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif font-bold text-lg text-amber-950 flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-600" />
            <span>Gestor de Cupones y Descuentos</span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Crea códigos de descuento en porcentaje para que el comensal los aplique en la carta digital y en tus promociones VIP.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{showForm ? 'Cerrar Formulario' : 'Crear Nuevo Cupón'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-100 flex items-center justify-between">
          <div>
            <span className="text-[10.5px] font-semibold text-amber-800 uppercase tracking-wider block">Total Cupones</span>
            <span className="text-xl font-bold text-amber-950">{coupons.length}</span>
          </div>
          <Tag className="w-6 h-6 text-amber-500 opacity-60" />
        </div>
        <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-100 flex items-center justify-between">
          <div>
            <span className="text-[10.5px] font-semibold text-emerald-800 uppercase tracking-wider block">Cupones Activos</span>
            <span className="text-xl font-bold text-emerald-950">{activeCount}</span>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-500 opacity-60" />
        </div>
        <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-100 flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <span className="text-[10.5px] font-semibold text-blue-800 uppercase tracking-wider block">Descuento Promedio</span>
            <span className="text-xl font-bold text-blue-950">~{avgDiscount}% OFF</span>
          </div>
          <Percent className="w-6 h-6 text-blue-500 opacity-60" />
        </div>
      </div>

      {/* Formulario de Alta de Cupón */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 bg-gradient-to-br from-amber-50/80 to-orange-50/40 rounded-2xl border border-amber-200 space-y-4 animate-fade-in">
          <div className="flex items-center gap-2 text-amber-950 font-serif font-bold text-sm border-b border-amber-200/60 pb-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Configurar Nuevo Cupón de Descuento</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Código del Cupón * <span className="text-[10px] text-gray-400 font-normal">(sin espacios)</span>
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                placeholder="Ej. VIKPROMO, CONY15"
                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-mono font-bold tracking-wider text-amber-950 focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Porcentaje de Descuento (%) *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  value={discountPercentage}
                  onChange={e => setDiscountPercentage(Number(e.target.value))}
                  className="w-24 p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-emerald-700 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
                <div className="flex items-center gap-1 flex-wrap">
                  {[10, 15, 20, 25].map(pct => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setDiscountPercentage(pct)}
                      className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                        discountPercentage === pct
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Compra Mínima (MXN)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-bold">$</span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={minPurchase}
                  onChange={e => setMinPurchase(Number(e.target.value))}
                  placeholder="0"
                  className="w-full pl-7 pr-3 p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Descripción / Beneficio Visible
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ej. 15% de descuento especial en desayunos completos"
                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Comensales Objetivo
              </label>
              <select
                value={targetTier}
                onChange={e => setTargetTier(e.target.value as any)}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
              >
                <option value="all">👥 Todos los comensales</option>
                <option value="estrella">🥇 Exclusivo VIP / Estrella (10+)</option>
                <option value="honor">🥈 Comensales de Honor (6-10)</option>
                <option value="frecuente">🥉 Clientes Frecuentes (3-5)</option>
                <option value="nuevo">🌱 Clientes Nuevos (1-2)</option>
              </select>
            </div>
          </div>

          {/* Real-time Preview Pill */}
          <div className="bg-white/80 p-3 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-lg border border-emerald-200">
                -{discountPercentage}% OFF
              </span>
              <div>
                <span className="font-mono font-bold text-amber-950 block">
                  {code.trim().toUpperCase() || 'EJEMPLO15'}
                </span>
                <span className="text-[10px] text-gray-500">
                  {description.trim() || `${discountPercentage}% de descuento en tu orden`} • Mínimo ${minPurchase} MXN
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="w-4 h-4 accent-amber-600 rounded"
                />
                <span className="font-medium text-gray-700">Activar de inmediato</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Guardar y Publicar Cupón</span>
            </button>
          </div>
        </form>
      )}

      {/* Lista de Cupones Existentes */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="p-3.5 whitespace-nowrap">Código</th>
                <th className="p-3.5 whitespace-nowrap">Descuento</th>
                <th className="p-3.5 whitespace-nowrap">Descripción</th>
                <th className="p-3.5 whitespace-nowrap">Compra Mínima</th>
                <th className="p-3.5 whitespace-nowrap">Destinatarios</th>
                <th className="p-3.5 text-center whitespace-nowrap">Estado</th>
                <th className="p-3.5 text-right whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Tag className="w-8 h-8 text-gray-300" />
                      <span>No hay cupones dados de alta. Haz clic en "Crear Nuevo Cupón" para comenzar.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                coupons.map(coupon => (
                  <tr key={coupon.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="p-3.5 font-bold text-amber-950 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono bg-amber-50 text-amber-900 px-2 py-1 rounded-md border border-amber-200 font-extrabold tracking-wider">
                          {coupon.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(coupon.code)}
                          title="Copiar código"
                          className="p-1 text-gray-400 hover:text-amber-700 hover:bg-amber-100 rounded transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        -{coupon.discountPercentage}% OFF
                      </span>
                    </td>

                    <td className="p-3.5 text-gray-600 max-w-xs truncate font-medium">
                      {coupon.description || 'Descuento al comal'}
                    </td>

                    <td className="p-3.5 font-medium text-gray-700 whitespace-nowrap">
                      {coupon.minPurchase && coupon.minPurchase > 0 ? (
                        <span>${coupon.minPurchase.toFixed(2)} MXN</span>
                      ) : (
                        <span className="text-gray-400 italic">Sin mínimo</span>
                      )}
                    </td>

                    <td className="p-3.5 whitespace-nowrap text-[11px]">
                      {coupon.targetTier === 'estrella' && (
                        <span className="inline-flex items-center gap-1 text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          🥇 Solo VIP (10+)
                        </span>
                      )}
                      {coupon.targetTier === 'honor' && (
                        <span className="inline-flex items-center gap-1 text-slate-800 font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          🥈 Honor (6-10)
                        </span>
                      )}
                      {coupon.targetTier === 'frecuente' && (
                        <span className="inline-flex items-center gap-1 text-orange-800 font-bold bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                          🥉 Frecuentes (3-5)
                        </span>
                      )}
                      {coupon.targetTier === 'nuevo' && (
                        <span className="inline-flex items-center gap-1 text-blue-800 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          🌱 Nuevos
                        </span>
                      )}
                      {(!coupon.targetTier || coupon.targetTier === 'all') && (
                        <span className="text-gray-500 font-medium">
                          👥 Todos los comensales
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          onToggleCoupon(coupon.id, !coupon.isActive);
                          triggerToast(
                            coupon.isActive ? 'info' : 'success',
                            coupon.isActive ? 'Cupón Pausado' : 'Cupón Activado',
                            `El cupón ${coupon.code} ahora está ${coupon.isActive ? 'inactivo' : 'activo'}.`
                          );
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold cursor-pointer transition-all ${
                          coupon.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        <span>{coupon.isActive ? 'Activo' : 'Pausado'}</span>
                      </button>
                    </td>

                    <td className="p-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`¿Seguro que deseas eliminar el cupón ${coupon.code}?`)) {
                            onDeleteCoupon(coupon.id);
                            triggerToast('info', 'Cupón Eliminado', `El cupón ${coupon.code} fue retirado.`);
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar cupón"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
