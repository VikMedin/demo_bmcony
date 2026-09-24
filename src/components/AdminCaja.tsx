/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, CreditCard, Receipt, FileText, ChevronRight, DollarSign, X, Printer, CheckCircle } from 'lucide-react';
import { FoodOrder, FoodItem, Expense, BusinessConfig } from '../types';

interface AdminCajaProps {
  orders: FoodOrder[];
  foodItems: FoodItem[];
  expenses: Expense[];
  config: BusinessConfig;
  onAddOrder: (order: FoodOrder) => void;
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  triggerToast: (type: 'success' | 'error' | 'info', title: string, description?: string) => void;
}

export const AdminCaja: React.FC<AdminCajaProps> = ({
  orders,
  foodItems,
  expenses,
  config,
  onAddOrder,
  onAddExpense,
  onDeleteExpense,
  triggerToast
}) => {
  const [activeTab, setActiveTab] = useState<'pos' | 'corte'>('pos');

  // Manual POS State
  const [posCart, setPosCart] = useState<{
    item: FoodItem;
    quantity: number;
    selectedOptions: { [key: string]: string[] };
    selectedExtras: { name: string; price: number }[];
    id: string;
  }[]>([]);
  const [posCustomer, setPosCustomer] = useState<string>('Comensal Mostrador');
  const [posPhone, setPosPhone] = useState<string>('5500000000');
  const [posPayment, setPosPayment] = useState<'efectivo' | 'transferencia'>('efectivo');
  const [posTip, setPosTip] = useState<number>(config?.suggestedTip !== undefined ? Number(config.suggestedTip) : 10);

  useEffect(() => {
    if (config?.suggestedTip !== undefined) {
      setPosTip(Number(config.suggestedTip));
    }
  }, [config?.suggestedTip]);

  // Modifiers state inside POS
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [modalOptions, setModalOptions] = useState<{ [key: string]: string[] }>({});
  const [modalExtras, setModalExtras] = useState<{ name: string; price: number }[]>([]);

  // Expenses State
  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);
  const [expenseConcept, setExpenseConcept] = useState<string>('');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);

  // Thermal Receipt State
  const [showThermalTicket, setShowThermalTicket] = useState<FoodOrder | null>(null);
  const [enableThermalToggle, setEnableThermalToggle] = useState<boolean>(true);

  // Open modifiers for POS
  const openPosModifiers = (item: FoodItem) => {
    setSelectedFood(item);
    const initialOps: { [key: string]: string[] } = {};
    if (item.options) {
      item.options.forEach(op => {
        if (!op.multiselect && op.choices.length > 0) {
          initialOps[op.title] = [op.choices[0]];
        } else {
          initialOps[op.title] = [];
        }
      });
    }
    setModalOptions(initialOps);
    setModalExtras([]);
  };

  const handleToggleOption = (title: string, choice: string, multiselect: boolean) => {
    setModalOptions(prev => {
      const current = prev[title] || [];
      if (multiselect) {
        if (current.includes(choice)) {
          return { ...prev, [title]: current.filter(c => c !== choice) };
        } else {
          return { ...prev, [title]: [...current, choice] };
        }
      } else {
        return { ...prev, [title]: [choice] };
      }
    });
  };

  const handleToggleExtra = (extra: { name: string; price: number }) => {
    setModalExtras(prev => {
      const isMultiselect = selectedFood?.extrasMultiselect !== false;
      if (!isMultiselect) {
        if (prev.some(e => e.name === extra.name)) {
          return [];
        } else {
          return [extra];
        }
      } else {
        if (prev.some(e => e.name === extra.name)) {
          return prev.filter(e => e.name !== extra.name);
        } else {
          return [...prev, extra];
        }
      }
    });
  };

  const addPosModifiersToCart = () => {
    if (!selectedFood) return;

    const cartId = `${selectedFood.id}-${Date.now()}`;
    const cartItem = {
      item: selectedFood,
      quantity: 1,
      selectedOptions: modalOptions,
      selectedExtras: modalExtras,
      id: cartId
    };

    setPosCart(prev => [...prev, cartItem]);
    setSelectedFood(null);
    triggerToast('success', 'Agregado a la Mesa', `${selectedFood.name} listo en caja manual.`);
  };

  const updatePosQty = (id: string, delta: number) => {
    setPosCart(prev =>
      prev
        .map(c => {
          if (c.id === id) {
            const nQty = c.quantity + delta;
            if (nQty <= 0) return null;
            return { ...c, quantity: nQty };
          }
          return c;
        })
        .filter((c): c is typeof c => c !== null)
    );
  };

  const calculatePosSubtotal = () => {
    return posCart.reduce((acc, c) => {
      const base = c.item.price;
      const ex = c.selectedExtras.reduce((sum, e) => sum + e.price, 0);
      return acc + (base + ex) * c.quantity;
    }, 0);
  };

  const submitManualPOS = (e: React.FormEvent) => {
    e.preventDefault();
    if (posCart.length === 0) {
      triggerToast('error', 'Caja Vacía', 'Agrega platillos primero.');
      return;
    }

    const sub = calculatePosSubtotal();
    const tot = sub + posTip;

    const walkInOrder: FoodOrder = {
      id: `ord-pos-${Date.now()}`,
      orderNumber: `DC-POS-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: posCustomer,
      clientPhone: posPhone,
      deliveryType: 'local',
      address: 'Mostrador / En Local',
      notes: 'Orden de mostrador cobrada en caja',
      items: posCart.map(c => ({
        itemId: c.item.id,
        name: c.item.name,
        quantity: c.quantity,
        price: c.item.price,
        selectedOptions: c.selectedOptions,
        selectedExtras: c.selectedExtras
      })),
      subtotal: sub,
      deliveryFee: 0,
      tip: posTip,
      total: tot,
      paymentMethod: posPayment,
      status: 'recibido', // Start at kitchen queue instead of auto-completing
      createdAt: new Date().toISOString(),
      slaLimitTime: new Date().toISOString()
    };

    onAddOrder(walkInOrder);
    setPosCart([]);
    setPosCustomer('Comensal Mostrador');
    setPosPhone('5500000000');
    setPosTip(10);
    triggerToast('success', 'Venta manual cobrada', 'Se sumó con éxito al arqueo de caja.');
  };

  // Expenses Register
  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseConcept || expenseAmount <= 0) {
      triggerToast('error', 'Concepto no válido', 'Ingresa concepto y monto correcto.');
      return;
    }

    const ex: Expense = {
      id: `exp-${Date.now()}`,
      concept: expenseConcept,
      amount: Number(expenseAmount),
      date: new Date().toISOString().split('T')[0]
    };

    onAddExpense(ex);
    setExpenseConcept('');
    setExpenseAmount(0);
    setShowExpenseModal(false);
    triggerToast('success', 'Egreso Guardado', 'Se dedujo del balance de ganancia neta.');
  };

  // Daily math metrics (Corte de caja)
  const validOrders = orders.filter(o => o.status !== 'cancelado');
  const canceledOrders = orders.filter(o => o.status === 'cancelado');
  
  const bruteEfectivo = validOrders.filter(o => o.paymentMethod === 'efectivo').reduce((sum, o) => sum + o.total, 0);
  const bruteTransferencia = validOrders.filter(o => o.paymentMethod === 'transferencia').reduce((sum, o) => sum + o.total, 0);
  const totalTips = validOrders.reduce((sum, o) => sum + o.tip, 0);
  const bruteTotal = bruteEfectivo + bruteTransferencia;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netEarnings = Math.max(0, bruteTotal - totalExpenses);

  return (
    <div className="space-y-6">
      {/* Tab Selectors */}
      <div className="flex gap-2 bg-white p-4 rounded-xl border border-gray-200">
        <button
          onClick={() => setActiveTab('pos')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'pos'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          Punto de Venta Manual (Comanda Mostrador)
        </button>
        <button
          onClick={() => setActiveTab('corte')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'corte'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Arqueo y Corte de Caja Diario
        </button>
      </div>

      {activeTab === 'pos' ? (
        /* PUNTO DE VENTA MANUAL */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="manual-pos-view">
          {/* Menu Catalog Grid (Left 7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-4 bg-white rounded-xl border border-gray-200">
              <h3 className="font-serif font-bold text-sm text-amber-950">Selección Rápida de Alimentos</h3>
              <p className="text-[11px] text-gray-400">Toca un platillo para configurar opciones o extras del cliente de mostrador.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {foodItems.map(food => {
                const isAgotado = food.stock <= 0;
                return (
                  <button
                    key={food.id}
                    disabled={isAgotado}
                    onClick={() => openPosModifiers(food)}
                    className={`p-3.5 bg-white border rounded-xl text-left flex items-start gap-3 transition-all hover:shadow-xs ${
                      isAgotado ? 'opacity-50 cursor-not-allowed' : 'border-gray-200/80 hover:border-amber-400'
                    }`}
                  >
                    <img src={food.image} alt="" className="w-12 h-12 rounded-lg object-cover bg-gray-50 border shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-serif font-bold text-xs text-amber-950 truncate">{food.name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">{food.description}</p>
                      <p className="font-bold text-amber-600 text-[11px] mt-1.5">${food.price.toFixed(2)} MXN</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cart Sidebar (Right 5 Cols) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-200 space-y-4">
            <h3 className="font-serif font-bold text-base text-amber-950 flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4 text-amber-600" />
              Comanda de Mostrador
            </h3>

            {posCart.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400 border border-dashed border-gray-100 rounded-xl">
                Toca platillos a la izquierda para cargarlos en caja.
              </div>
            ) : (
              <form onSubmit={submitManualPOS} className="space-y-4">
                <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto pr-1">
                  {posCart.map(c => {
                    const rowSub = (c.item.price + c.selectedExtras.reduce((s, e) => s + e.price, 0)) * c.quantity;
                    return (
                      <div key={c.id} className="py-2.5 flex items-start justify-between gap-2 sm:gap-3 text-xs">
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="font-bold text-amber-950 truncate">{c.item.name}</p>
                          {/* Modifiers summary */}
                          {Object.values(c.selectedOptions).flat().map((opStr, i) => (
                            <span key={i} className="inline-block text-[9px] text-gray-400 mr-1 italic">
                              {opStr}
                            </span>
                          ))}
                          {c.selectedExtras.map(ex => (
                            <span key={ex.name} className="inline-block text-[9px] text-amber-700 mr-1 font-semibold">
                              +{ex.name}
                            </span>
                          ))}
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <button
                              type="button"
                              onClick={() => updatePosQty(c.id, -1)}
                              className="p-1 border rounded bg-gray-50 text-gray-500 hover:bg-gray-100"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="font-bold">{c.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updatePosQty(c.id, 1)}
                              className="p-1 border rounded bg-gray-50 text-gray-500 hover:bg-gray-100"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>

                        <span className="font-bold text-amber-950 shrink-0 whitespace-nowrap text-sm mt-0.5">
                          ${rowSub.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* POS Customer Details */}
                <div className="pt-3 border-t border-gray-100 space-y-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-1">Nombre / Identificador del Cliente</label>
                    <input
                      type="text"
                      required
                      value={posCustomer}
                      onChange={e => setPosCustomer(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 mb-1">Celular (Opcional)</label>
                      <input
                        type="text"
                        value={posPhone}
                        onChange={e => setPosPhone(e.target.value)}
                        className="w-full p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 mb-1">Propina de Mostrador ($)</label>
                      <input
                        type="number"
                        min={0}
                        value={posTip}
                        onChange={e => setPosTip(Number(e.target.value))}
                        className="w-full p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setPosPayment('efectivo')}
                      className={`py-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        posPayment === 'efectivo'
                          ? 'border-amber-500 bg-amber-50 text-amber-900'
                          : 'border-gray-200 text-gray-500'
                      }`}
                    >
                      💵 Efectivo
                    </button>
                    <button
                      type="button"
                      onClick={() => setPosPayment('transferencia')}
                      className={`py-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        posPayment === 'transferencia'
                          ? 'border-amber-500 bg-amber-50 text-amber-900'
                          : 'border-gray-200 text-gray-500'
                      }`}
                    >
                      🏦 Transferencia
                    </button>
                  </div>

                  {/* Total POS Breakdowns */}
                  <div className="p-3.5 bg-gray-50 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between text-gray-500">
                      <span>Consumo:</span>
                      <span className="font-bold">${calculatePosSubtotal().toFixed(2)} MXN</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Propina:</span>
                      <span className="font-bold">${posTip.toFixed(2)} MXN</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-amber-950 pt-1.5 border-t">
                      <span>A Cobrar:</span>
                      <span>${(calculatePosSubtotal() + posTip).toFixed(2)} MXN</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Registrar Venta e Imprimir
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* MODAL CONFIG MODIFIERS FOR POS */}
          {selectedFood && (
            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
              <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 animate-scale-up">
                <div className="p-4 bg-amber-50 border-b flex justify-between items-center">
                  <div>
                    <h4 className="font-serif font-bold text-sm text-amber-950">Complementos de Mesa</h4>
                    <p className="text-[10px] text-gray-400">{selectedFood.name}</p>
                  </div>
                  <button onClick={() => setSelectedFood(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-6 space-y-5 max-h-[50vh] overflow-y-auto">
                  {selectedFood.options?.map(option => (
                    <div key={option.title} className="space-y-2">
                      <h5 className="font-bold text-xs text-amber-950">{option.title}</h5>
                      <div className="grid grid-cols-2 gap-2">
                        {option.choices.map(choice => {
                          const isSel = (modalOptions[option.title] || []).includes(choice);
                          return (
                            <button
                              key={choice}
                              onClick={() => handleToggleOption(option.title, choice, option.multiselect)}
                              className={`p-2 border rounded-lg text-xs text-left font-medium transition-all ${
                                isSel ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold' : 'border-gray-200 text-gray-500'
                              }`}
                            >
                              {choice}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {selectedFood.extras && selectedFood.extras.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-xs text-amber-950">Ingredientes Extras</h5>
                        <span className="text-[10px] text-gray-500 font-semibold">
                          {selectedFood.extrasMultiselect !== false ? 'Múltiple' : 'Única (Máx. 1)'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedFood.extras.map(ex => {
                          const isSel = modalExtras.some(e => e.name === ex.name);
                          return (
                            <button
                              key={ex.name}
                              onClick={() => handleToggleExtra(ex)}
                              className={`p-2 border rounded-lg text-xs text-left transition-all flex items-center justify-between ${
                                isSel ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold' : 'border-gray-200 text-gray-500'
                              }`}
                            >
                              <div>
                                <p className="font-medium">{ex.name}</p>
                                <p className="text-[9px] text-amber-600">+${ex.price} MXN</p>
                              </div>
                              {isSel && (
                                <span className="text-amber-600 font-bold text-xs">✓</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
                  <button onClick={() => setSelectedFood(null)} className="px-3.5 py-1.5 border rounded-lg text-xs text-gray-500">
                    Cerrar
                  </button>
                  <button onClick={addPosModifiersToCart} className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold">
                    Agregar a Comanda
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ARQUEO Y CORTE DE CAJA DIARIO */
        <div className="space-y-6" id="cash-closeout-view">
          {/* General Math Cards */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-amber-950">Arqueo Diario de Caja</h3>
                <p className="text-xs text-gray-500">Monitorea y valida el arqueo físico de efectivo y el total bruto del día.</p>
              </div>

              <button
                onClick={() => setShowExpenseModal(true)}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Registrar Gasto (Egreso)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-1 min-w-[200px]">
                <span className="text-[10px] text-amber-800 font-semibold uppercase whitespace-nowrap">Ventas Brutas Totales</span>
                <p className="text-2xl font-bold text-amber-950 whitespace-nowrap overflow-hidden text-ellipsis" title={`${bruteTotal.toFixed(2)}`}>${bruteTotal.toFixed(2)}</p>
                <div className="flex justify-between text-[10px] text-amber-600 mt-2">
                  <span className="whitespace-nowrap">💵 Efectivo: ${bruteEfectivo.toFixed(0)}</span>
                  <span className="whitespace-nowrap">🏦 Transf: ${bruteTransferencia.toFixed(0)}</span>
                </div>
              </div>
              <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-xl space-y-1 min-w-[200px]">
                <span className="text-[10px] text-rose-800 font-semibold uppercase whitespace-nowrap">Egresos / Gastos Diarios</span>
                <p className="text-2xl font-bold text-rose-950 whitespace-nowrap overflow-hidden text-ellipsis" title={`-${totalExpenses.toFixed(2)}`}>-${totalExpenses.toFixed(2)}</p>
                <p className="text-[10px] text-rose-500 mt-2 truncate">Restado automáticamente de la neta</p>
              </div>
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1 min-w-[200px]">
                <span className="text-[10px] text-emerald-800 font-semibold uppercase whitespace-nowrap">Ganancia Neta Real</span>
                <p className="text-2xl font-bold text-emerald-950 whitespace-nowrap overflow-hidden text-ellipsis" title={`${netEarnings.toFixed(2)}`}>${netEarnings.toFixed(2)}</p>
                <div className="flex justify-between text-[10px] text-emerald-600 mt-2">
                  <span className="truncate">💖 Propinas del equipo: ${totalTips.toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Split Log Lists: Orders and Expenses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Orders list with Thermal ticket trigger */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
              <h4 className="font-serif font-bold text-sm text-amber-950">Historial de Ventas</h4>
              <div className="divide-y divide-gray-100 max-h-[350px] overflow-y-auto pr-1">
                {orders.map(order => (
                  <div key={order.id} className={`py-3 flex items-center justify-between gap-2 sm:gap-3 text-xs ${order.status === 'cancelado' ? 'opacity-50' : ''}`}>
                    <div className="min-w-0 flex-1 pr-2">
                      <p className={`font-bold leading-tight ${order.status === 'cancelado' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                        {order.orderNumber} ({order.clientName})
                        {order.status === 'cancelado' && <span className="ml-2 text-[9px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded no-underline inline-block">Cancelado</span>}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{order.createdAt.split('T')[0]} • {order.paymentMethod === 'efectivo' ? '💵 Efectivo' : '🏦 Transf'}</p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <span className={`font-bold whitespace-nowrap text-sm ${order.status === 'cancelado' ? 'text-gray-400 line-through' : 'text-amber-950'}`}>${order.total.toFixed(2)}</span>
                      {order.status !== 'cancelado' && (
                        <button
                          onClick={() => setShowThermalTicket(order)}
                          className="p-1.5 border border-gray-200 rounded hover:bg-gray-50 text-gray-600 inline-flex items-center gap-1 text-[10px]"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-600" />
                          Ticket
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Expenses List */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
              <h4 className="font-serif font-bold text-sm text-rose-950">Historial de Egresos / Gastos</h4>
              <div className="divide-y divide-gray-100 max-h-[350px] overflow-y-auto pr-1">
                {expenses.length === 0 ? (
                  <p className="text-xs text-gray-400 py-12 text-center">No hay gastos reportados el día de hoy.</p>
                ) : (
                  expenses.map(exp => (
                    <div key={exp.id} className="py-3 flex flex-row items-center justify-between gap-2 sm:gap-3 text-xs">
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-semibold text-gray-800 leading-tight">{exp.concept}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{exp.date}</p>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <span className="font-bold text-rose-600 whitespace-nowrap text-sm">-${exp.amount.toFixed(2)}</span>
                        <button
                          onClick={() => {
                            onDeleteExpense(exp.id);
                            triggerToast('info', 'Egreso Removido', 'Se ha eliminado de la contabilidad diaria.');
                          }}
                          className="text-gray-300 hover:text-rose-500 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* New Expense Modal */}
          {showExpenseModal && (
            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
              <form onSubmit={handleCreateExpense} className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl border border-gray-100 animate-scale-up">
                <div className="p-4 bg-rose-50 border-b border-rose-100 flex justify-between items-center">
                  <h4 className="font-serif font-bold text-sm text-rose-950">Registrar Salida de Efectivo</h4>
                  <button type="button" onClick={() => setShowExpenseModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Concepto del Gasto *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Bolillos (3 docenas)"
                      value={expenseConcept}
                      onChange={e => setExpenseConcept(e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Monto en Pesos ($ MXN) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={expenseAmount}
                      onChange={e => setExpenseAmount(Number(e.target.value))}
                      className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowExpenseModal(false)}
                    className="px-3.5 py-1.5 border rounded-lg text-xs text-gray-500"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold"
                  >
                    Registrar Egreso
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* THERMAL TICKET MODAL */}
          {showThermalTicket && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
              <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl border border-gray-200 animate-scale-up">
                <div className="p-4 bg-gray-100 border-b flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-xs uppercase text-gray-600 tracking-wider">Simulador Ticket Térmico</h4>
                    <p className="text-[10px] text-gray-400">Optimizado para rollo térmico de 80mm monocromático</p>
                  </div>
                  <button onClick={() => setShowThermalTicket(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
                  <span className="text-xs text-gray-600 font-medium">Habilitar impresión de Ticket</span>
                  <button
                    onClick={() => setEnableThermalToggle(!enableThermalToggle)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      enableThermalToggle ? 'bg-amber-500' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      enableThermalToggle ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {enableThermalToggle ? (
                  <div className="p-6 bg-white flex flex-col items-center">
                    {/* Thermal Paper View */}
                    <div className="w-full max-w-xs border-2 border-dashed border-gray-400 p-5 bg-gray-50/50 rounded-md font-mono text-[11px] text-gray-800 space-y-4">
                      <div className="text-center space-y-1 border-b border-dashed border-gray-300 pb-3">
                        <p className="font-bold text-sm tracking-wide">☕ DESAYUNOS CONY ☕</p>
                        <p className="text-[9px]">Sabor Casero Mexicano</p>
                        <p className="text-[9px]">Cel: {config.whatsappPhone}</p>
                        <p className="text-[9px]">Fecha: {showThermalTicket.createdAt.split('T')[0]}</p>
                      </div>

                      <div>
                        <p className="font-bold">ORDEN: {showThermalTicket.orderNumber}</p>
                        <p>Cliente: {showThermalTicket.clientName}</p>
                        <p>Atención: Mostrador / Domicilio</p>
                      </div>

                      <div className="border-y border-dashed border-gray-300 py-3 space-y-1">
                        {showThermalTicket.items.map((itm, i) => {
                          const base = itm.price;
                          const rowTot = (base + itm.selectedExtras.reduce((s, e) => s + e.price, 0)) * itm.quantity;
                          return (
                            <div key={i} className="space-y-0.5">
                              <div className="flex justify-between font-bold">
                                <span>{itm.quantity}x {itm.name}</span>
                                <span>${rowTot.toFixed(2)}</span>
                              </div>
                              {Object.values(itm.selectedOptions).flat().map((op, opIdx) => (
                                <p key={opIdx} className="text-[9px] text-gray-500 pl-2">- {op}</p>
                              ))}
                              {itm.selectedExtras.map(ex => (
                                <p key={ex.name} className="text-[9px] text-gray-600 pl-2">- Extra: {ex.name} (+${ex.price})</p>
                              ))}
                            </div>
                          );
                        })}
                      </div>

                      <div className="space-y-1 text-right">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>${showThermalTicket.subtotal.toFixed(2)}</span>
                        </div>
                        {showThermalTicket.discountAmount && showThermalTicket.discountAmount > 0 && (
                          <div className="flex justify-between text-emerald-700 font-bold">
                            <span>Descuento ({showThermalTicket.couponCode || 'Cupón'}):</span>
                            <span>-${showThermalTicket.discountAmount.toFixed(2)}</span>
                          </div>
                        )}
                        {showThermalTicket.deliveryFee > 0 && (
                          <div className="flex justify-between">
                            <span>Envío:</span>
                            <span>${showThermalTicket.deliveryFee.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Propina:</span>
                          <span>${showThermalTicket.tip.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-xs pt-1 border-t border-dashed border-gray-300">
                          <span>TOTAL COBRADO:</span>
                          <span>${showThermalTicket.total.toFixed(2)} MXN</span>
                        </div>
                      </div>

                      <div className="text-center text-[9px] border-t border-dashed border-gray-300 pt-3 space-y-1">
                        <p className="font-bold uppercase">Pago: {showThermalTicket.paymentMethod}</p>
                        <p className="italic text-gray-500">{config.ticketFooter}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        window.print();
                        triggerToast('success', 'Comprobante impreso', 'Se ha disparado a cola de impresión.');
                      }}
                      className="mt-6 w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5"
                    >
                      <Printer className="w-4 h-4" />
                      Disparar Impresión (80mm)
                    </button>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-400 text-xs">
                    El ticket térmico ha sido desactivado desde la configuración comercial. Habilítalo arriba para reanudar impresión.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
