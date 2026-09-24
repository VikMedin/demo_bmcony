/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useFirebaseCollection, useFirebaseDocument } from './hooks/useFirebaseState';
import { useFirebaseAuth } from './hooks/useFirebaseAuth';
import { signOut, updatePassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { cleanFirestoreData } from './utils/cleanFirestoreData';
import { normalizePhone, calculateClientTier } from './utils/phoneUtils';
import {
  ClientMenu
} from './components/ClientMenu';
import {
  AdminLogin
} from './components/AdminLogin';
import {
  AdminDashboard
} from './components/AdminDashboard';
import {
  AdminKitchen
} from './components/AdminKitchen';
import {
  AdminCaja
} from './components/AdminCaja';
import {
  AdminClientes
} from './components/AdminClientes';
import {
  AdminRepartidor
} from './components/AdminRepartidor';
import {
  AdminCupones
} from './components/AdminCupones';
import {
  CommonToast
} from './components/CommonToast';
import { getThemeStyles } from './utils/colors';
import { notifyMessengerMobile } from './utils/deliveryNotification';

import {
  Client,
  TimeEntry,
  Invoice,
  FoodItem,
  RestoClient,
  FoodOrder,
  Expense,
  BusinessConfig,
  Coupon,
  ToastMessage
} from './types';

import {
  INITIAL_CLIENTS,
  INITIAL_TIME_ENTRIES,
  INITIAL_INVOICES,
  INITIAL_FOOD_ITEMS,
  INITIAL_RESTO_CLIENTS,
  INITIAL_FOOD_ORDERS,
  INITIAL_EXPENSES,
  INITIAL_COUPONS,
  DEFAULT_BUSINESS_CONFIG
} from './data/seedData';

import {
  Utensils,
  Briefcase,
  User,
  ShieldAlert,
  Settings,
  Plus,
  Minus,
  Trash2,
  Edit2,
  Clock,
  History,
  Users,
  Lock,
  Save,
  CheckCircle,
  AlertTriangle,
  Menu,
  BookOpen,
  Coins,
  GripVertical,
  ChevronUp,
  ChevronDown,
  X,
  ImageIcon,
  Tag,
  Eye,
  EyeOff,
  RefreshCw,
  DollarSign
} from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
}

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'mensajero' | 'esperando';
}

// Helper function to resize images to avoid Firestore 1MB limit
const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to 70% quality JPEG
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

// Helper to extract first 2 letters of dish name for placeholder avatar in admin
const getDishInitials = (name: string): string => {
  if (!name) return 'PL';
  const clean = name.trim();
  return clean.slice(0, 2).toUpperCase();
};

export default function App() {
  // --- Desayunos Cony States ---
  const [foodItems, setFoodItems] = useFirebaseCollection<FoodItem>('cony_food_items', INITIAL_FOOD_ITEMS);
  const [restoClients, setRestoClients] = useFirebaseCollection<RestoClient>('cony_resto_clients', INITIAL_RESTO_CLIENTS);
  const [orders, setOrders] = useFirebaseCollection<FoodOrder>('cony_orders', INITIAL_FOOD_ORDERS);
  const [expenses, setExpenses] = useFirebaseCollection<Expense>('cony_expenses', INITIAL_EXPENSES);
  const [coupons, setCoupons] = useFirebaseCollection<Coupon>('cony_coupons', INITIAL_COUPONS);
  const [businessConfig, setBusinessConfig] = useFirebaseDocument<BusinessConfig>('settings/cony_business_config', DEFAULT_BUSINESS_CONFIG);
  
  // Role switcher state (Simulation only - keep local)
  const { firebaseUser, profile, setProfile, loading: authLoading } = useFirebaseAuth();
  const [demoRole, setDemoRole] = useState<'superadmin' | 'admin' | 'mensajero' | null>(null);
  
  const activeProfile = demoRole ? {
    id: 'demo-user',
    email: 'demo@demo.com',
    name: `Usuario Demo (${demoRole === 'superadmin' ? 'Dueño' : demoRole === 'admin' ? 'Caja/Comedor' : 'Repartidor'})`,
    phone: '',
    role: demoRole,
    avatar: 'https://ui-avatars.com/api/?name=Demo&background=f59e0b&color=fff',
    createdAt: new Date().toISOString()
  } as any : profile;

  const userRole = activeProfile?.role || 'publico';
  const [adminTab, setAdminTab] = useState<'dashboard' | 'kitchen' | 'caja' | 'clientes' | 'repartidor' | 'cupones' | 'config' | 'perfil' | 'menu' | 'carta_publica'>('dashboard');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState('');

  // Controlled states for Business Operational Status
  const [isOpenManualState, setIsOpenManualState] = useState<boolean>(businessConfig?.isOpenManual ?? true);
  const [is24HoursState, setIs24HoursState] = useState<boolean>(Boolean(businessConfig?.is24Hours));
  const [scheduleStartState, setScheduleStartState] = useState<string>(
    businessConfig?.scheduleStart && businessConfig.scheduleStart !== '00:00'
      ? businessConfig.scheduleStart
      : '07:30'
  );
  const [scheduleEndState, setScheduleEndState] = useState<string>(
    businessConfig?.scheduleEnd && businessConfig.scheduleEnd !== '24:00'
      ? businessConfig.scheduleEnd
      : '13:30'
  );

  useEffect(() => {
    if (businessConfig) {
      setIsOpenManualState(businessConfig.isOpenManual ?? true);
      setIs24HoursState(Boolean(businessConfig.is24Hours));
      if (businessConfig.scheduleStart && businessConfig.scheduleStart !== '00:00') {
        setScheduleStartState(businessConfig.scheduleStart);
      }
      if (businessConfig.scheduleEnd && businessConfig.scheduleEnd !== '24:00') {
        setScheduleEndState(businessConfig.scheduleEnd);
      }
    }
  }, [businessConfig?.isOpenManual, businessConfig?.is24Hours, businessConfig?.scheduleStart, businessConfig?.scheduleEnd]);

  const [userProfiles, setUserProfiles] = useFirebaseDocument<{
    superadmin: { name: string; phone: string; avatar: string; email: string };
    admin: { name: string; phone: string; avatar: string; email: string };
    mensajero: { name: string; phone: string; avatar: string; email: string };
  }>('settings/cony_user_profiles_v3', {
    superadmin: { name: 'Doña Cony Especial', phone: '5512345678', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150', email: 'cony@desayunador.com' },
    admin: { name: 'Carlos Administrador', phone: '5587654321', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150', email: 'carlos@desayunador.com' },
    mensajero: { name: 'Ramiro Repartidor', phone: '5544332211', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150', email: 'ramiro@desayunador.com' }
  });

  // --- Super Admin Simulated Databases ---
  const [staffUsers, setStaffUsers] = useFirebaseCollection<StaffUser>('cony_staff_users', []);

  const [auditLogs, setAuditLogs] = useFirebaseCollection<AuditLog>('cony_audit_logs', [
    { id: 'log-1', timestamp: new Date(Date.now() - 3 * 3600 * 1000).toLocaleString(), user: 'Doña Cony Especial', role: 'superadmin', action: 'Inició el servicio diario de cocina.' },
    { id: 'log-2', timestamp: new Date(Date.now() - 2 * 3600 * 1000).toLocaleString(), user: 'Carlos Administrador', role: 'admin', action: 'Habilitó manualmente la apertura de tienda.' },
    { id: 'log-3', timestamp: new Date(Date.now() - 1 * 3600 * 1000).toLocaleString(), user: 'Carlos Administrador', role: 'admin', action: 'Registró compra de gas LP de 20kg por $395.00.' }
  ]);

  // --- Active Toast Notification State ---
  const [activeToast, setActiveToast] = useState<ToastMessage | null>(null);

  const triggerToast = (type: 'success' | 'error' | 'info', title: string, description?: string) => {
    setActiveToast({
      id: `toast-${Date.now()}`,
      type,
      title,
      description
    });
  };

  // Add Log Entry Helper
  const addAuditLog = (actionText: string) => {
    let currentUser = 'Invitado Público';
    if (userRole === 'superadmin') currentUser = 'Doña Cony Especial';
    else if (userRole === 'admin') currentUser = 'Carlos Administrador';
    else if (userRole === 'mensajero') currentUser = 'Ramiro Repartidor';

    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      user: currentUser,
      role: userRole === 'publico' ? 'invitado' : userRole,
      action: actionText
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // --- Unified Real-Time CRM Clients Engine ---
  // Constant is the telephone number: it determines the entire history of orders placed,
  // accumulates orderCount and totalSpent, and categorizes loyalty/VIP tiers accordingly.
  const unifiedClients: RestoClient[] = useMemo(() => {
    interface ClientAgg {
      id: string;
      name: string;
      phone: string;
      address: string;
      orderCount: number;
      totalSpent: number;
      lastOrderTime?: string;
    }

    const orderAggMap = new Map<string, ClientAgg>();

    // 1. Group all orders strictly by normalized phone number
    (orders || []).forEach(order => {
      if (order.status === 'cancelado') return;
      const rawName = (order.clientName || '').trim();
      const phoneNorm = normalizePhone(order.clientPhone);

      // Skip generic walk-in counter orders with placeholder phone unless a real client name was supplied
      if (rawName.toLowerCase() === 'comensal mostrador' && (!phoneNorm || phoneNorm === '5500000000')) {
        return;
      }

      // Telephone number is the constant identifier
      const key = (phoneNorm && phoneNorm.length >= 7)
        ? `phone_${phoneNorm}`
        : (rawName ? `name_${rawName.toLowerCase()}` : '');

      if (!key) return;

      const orderCost = Number(order.total) || 0;
      const orderAddr = order.address && order.address !== 'Retiro en Local' ? order.address : '';
      const orderDate = order.createdAt;

      const existing = orderAggMap.get(key);
      if (!existing) {
        orderAggMap.set(key, {
          id: `client-${phoneNorm || order.id}`,
          name: rawName || 'Comensal',
          phone: order.clientPhone || phoneNorm,
          address: orderAddr || order.address || 'Retiro en Local',
          orderCount: 1,
          totalSpent: orderCost,
          lastOrderTime: orderDate
        });
      } else {
        existing.orderCount += 1;
        existing.totalSpent += orderCost;
        // Keep the latest name associated with this phone number
        if (rawName && (!existing.lastOrderTime || !orderDate || new Date(orderDate) >= new Date(existing.lastOrderTime))) {
          existing.name = rawName;
        }
        if (orderAddr && (!existing.address || existing.address === 'Retiro en Local')) {
          existing.address = orderAddr;
        }
        if (order.clientPhone) {
          existing.phone = order.clientPhone;
        }
        if (orderDate && (!existing.lastOrderTime || new Date(orderDate) > new Date(existing.lastOrderTime))) {
          existing.lastOrderTime = orderDate;
        }
      }
    });

    // 2. Merge with base/stored restoClients using the phone number as constant
    const result: RestoClient[] = [];
    const processedKeys = new Set<string>();

    (restoClients || []).forEach(base => {
      const phoneNorm = normalizePhone(base.phone);
      const key = (phoneNorm && phoneNorm.length >= 7)
        ? `phone_${phoneNorm}`
        : ((base.name || '').trim() ? `name_${base.name.trim().toLowerCase()}` : '');

      if (!key) return;
      processedKeys.add(key);

      const live = orderAggMap.get(key);
      if (live) {
        // Base client has order history on this phone:
        // Use total orders (max between base record and live orders count)
        const totalCount = Math.max(base.orderCount || 0, live.orderCount);
        const totalSpent = Math.max(base.totalSpent || 0, live.totalSpent);
        // Name is the freshest name from orders (e.g. "Vik" on latest orders)
        const clientName = live.name || base.name;

        result.push({
          id: base.id,
          name: clientName,
          phone: base.phone || live.phone,
          address: (base.address && base.address !== 'Retiro en Local') ? base.address : (live.address || base.address),
          orderCount: totalCount,
          totalSpent: totalSpent,
          tier: calculateClientTier(totalCount)
        });
      } else {
        result.push({
          ...base,
          tier: calculateClientTier(base.orderCount || 0)
        });
      }
    });

    // 3. Add clients discovered from orders who are not yet in restoClients
    orderAggMap.forEach((live, key) => {
      if (!processedKeys.has(key)) {
        processedKeys.add(key);
        result.push({
          id: live.id,
          name: live.name,
          phone: live.phone,
          address: live.address || 'Retiro en Local',
          orderCount: live.orderCount,
          totalSpent: live.totalSpent,
          tier: calculateClientTier(live.orderCount)
        });
      }
    });

    // 4. Sort: Star/VIP first, then Honor, then Frecuente, then Nuevo; then orders desc, totalSpent desc
    result.sort((a, b) => {
      const tierRank: Record<string, number> = { estrella: 4, honor: 3, frecuente: 2, nuevo: 1 };
      const rankDiff = (tierRank[b.tier] || 0) - (tierRank[a.tier] || 0);
      if (rankDiff !== 0) return rankDiff;
      if (b.orderCount !== a.orderCount) return b.orderCount - a.orderCount;
      return b.totalSpent - a.totalSpent;
    });

    return result;
  }, [orders, restoClients]);

  // --- CRM Update Hook (When order is completed or added) ---
  const updateCRMForOrder = (order: FoodOrder) => {
    const rawName = (order.clientName || '').trim();
    const phoneNorm = normalizePhone(order.clientPhone);
    const clientName = rawName || 'Comensal';
    const clientAddress = order.address || 'Retiro en Local';
    const amount = Number(order.total) || 0;

    if (rawName.toLowerCase() === 'comensal mostrador' && (!phoneNorm || phoneNorm === '5500000000')) {
      return;
    }

    setRestoClients(prevClients => {
      // Find client strictly by normalized phone number
      const existingIdx = prevClients.findIndex(c => {
        const cPhone = normalizePhone(c.phone);
        if (phoneNorm && cPhone && phoneNorm === cPhone) {
          return true;
        }
        if (!phoneNorm && !cPhone && (c.name || '').trim().toLowerCase() === rawName.toLowerCase()) {
          return true;
        }
        return false;
      });

      if (existingIdx > -1) {
        // Update existing client for this phone number
        return prevClients.map((c, idx) => {
          if (idx === existingIdx) {
            const nextCount = (c.orderCount || 0) + 1;
            const nextSpent = (c.totalSpent || 0) + amount;
            return {
              ...c,
              name: clientName !== 'Comensal' ? clientName : c.name, // Keep freshest name
              phone: order.clientPhone || c.phone,
              address: clientAddress !== 'Retiro en Local' ? clientAddress : c.address,
              orderCount: nextCount,
              totalSpent: nextSpent,
              tier: calculateClientTier(nextCount)
            };
          }
          return c;
        });
      } else {
        // Create new client record for this phone number
        return [
          ...prevClients,
          {
            id: `client-${phoneNorm || Date.now()}`,
            phone: order.clientPhone || '',
            name: clientName,
            address: clientAddress,
            orderCount: 1,
            totalSpent: amount,
            tier: calculateClientTier(1)
          }
        ];
      }
    });
  };

  // --- Desayunos Cony Handlers ---
  const handlePlaceOrder = (newOrder: FoodOrder) => {
    const sanitizedOrder: FoodOrder = {
      ...newOrder,
      address: newOrder.deliveryType === 'domicilio'
        ? (newOrder.address?.trim() || 'Entrega a Domicilio')
        : 'Retiro en Local',
      notes: newOrder.notes || ''
    };

    setOrders(prev => [sanitizedOrder, ...prev]);
    // Save to Firestore so kitchen can see incoming customer orders in real-time
    const firestorePayload = cleanFirestoreData(sanitizedOrder);
    setDoc(doc(db, 'cony_orders', sanitizedOrder.id), firestorePayload).catch((err) => {
      console.warn('Firestore setDoc notice for order:', err);
    });
    updateCRMForOrder(sanitizedOrder);
    
    // Play kitchen chime sound
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {}

    addAuditLog(`Comensal ordenó por WhatsApp: ${sanitizedOrder.orderNumber} por $${sanitizedOrder.total.toFixed(2)}.`);
    triggerToast('success', '¡Pedido Registrado!', `Folio: ${sanitizedOrder.orderNumber}. Revisa tu WhatsApp para enviar.`);
  };

  const handleUpdateOrderStatus = (orderId: string, nextStatus: FoodOrder['status']) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
          const updated = { ...o, status: nextStatus };
          addAuditLog(`Actualizó estatus del pedido ${o.orderNumber} a: "${nextStatus}".`);

          // If order is ready and for delivery, trigger mobile notification for the messenger
          if (nextStatus === 'listo' && o.deliveryType === 'domicilio') {
            notifyMessengerMobile(updated);
          }

          return updated;
        }
        return o;
      })
    );
    triggerToast('success', 'Estatus Actualizado', `El pedido ahora está en "${nextStatus}".`);
  };

  const handleUpdateStock = (itemId: string, newStock: number) => {
    setFoodItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          addAuditLog(`Ajustó inventario de "${item.name}" a ${newStock} porciones.`);
          return { ...item, stock: newStock };
        }
        return item;
      })
    );
    triggerToast('info', 'Stock Modificado', 'Se guardaron los ajustes de insumos correctamente.');
  };

  const handleAddCustomDish = (dish: FoodItem) => {
    setFoodItems(prev => [...prev, dish]);
    addAuditLog(`Creó nuevo platillo: "${dish.name}" en la categoría "${dish.category}".`);
    triggerToast('success', 'Platillo Guardado', `"${dish.name}" ya se muestra en el menú digital.`);
  };

  const handleDeleteDish = (id: string) => {
    const item = foodItems.find(f => f.id === id);
    if (!item) return;
    setFoodItems(prev => prev.filter(f => f.id !== id));
    addAuditLog(`Eliminó platillo: "${item.name}".`);
    triggerToast('error', 'Platillo Eliminado', `"${item.name}" se removió permanentemente.`);
  };

  const handleEditDish = (updatedDish: FoodItem) => {
    setFoodItems(prev => prev.map(f => f.id === updatedDish.id ? updatedDish : f));
    addAuditLog(`Editó precio/detalles del platillo: "${updatedDish.name}".`);
    triggerToast('success', 'Platillo Editado', `Los cambios en "${updatedDish.name}" fueron guardados.`);
  };

  const handleToggleHideDish = (id: string) => {
    const item = foodItems.find(f => f.id === id);
    if (!item) return;
    const nextHidden = !item.hidden;
    setFoodItems(prev => prev.map(f => f.id === id ? { ...f, hidden: nextHidden } : f));
    addAuditLog(`${nextHidden ? 'Ocultó' : 'Mostró'} en menú comensal: "${item.name}".`);
    triggerToast(
      nextHidden ? 'info' : 'success',
      nextHidden ? 'Platillo Ocultado' : 'Platillo Visible',
      `"${item.name}" ${nextHidden ? 'ya NO se mostrará a comensales en el menú' : 'ahora es visible para los comensales'}.`
    );
  };

  const handleAddOrderCaja = (newOrder: FoodOrder) => {
    setOrders(prev => [newOrder, ...prev]);
    updateCRMForOrder(newOrder);
    addAuditLog(`Caja registró comanda mostrador: ${newOrder.orderNumber} por $${newOrder.total.toFixed(2)}.`);
    triggerToast('success', 'Comanda de Caja Registrada', `Imprimiendo recibo para ${newOrder.clientName}.`);
  };

  const handleAddExpense = (newExpense: Expense) => {
    setExpenses(prev => [...prev, newExpense]);
    addAuditLog(`Caja registró egreso: "${newExpense.concept}" por $${newExpense.amount.toFixed(2)}.`);
    triggerToast('success', 'Gasto Registrado', `Se descontaron $${newExpense.amount} del saldo de hoy.`);
  };

  const handleDeleteExpense = (expenseId: string) => {
    const exp = expenses.find(e => e.id === expenseId);
    if (!exp) return;
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
    addAuditLog(`Eliminó egreso: "${exp.concept}".`);
    triggerToast('info', 'Gasto Removido', 'Se recalculó el balance neto diario.');
  };

  const handleSaveConfig = (newConfig: BusinessConfig) => {
    setBusinessConfig(newConfig);
    setDoc(doc(db, 'settings', 'cony_business_config'), cleanFirestoreData(newConfig)).catch(() => {});
    addAuditLog('Modificó configuraciones del negocio (teléfono, horario, pie de ticket).');
    triggerToast('success', 'Configuraciones Guardadas', 'Doña Cony aplicó los cambios correctamente.');
  };

  // --- Cupones Handlers ---
  const handleAddCoupon = async (newCoupon: Coupon) => {
    try {
      await setCoupons(prev => [newCoupon, ...prev]);
      addAuditLog(`Creó nuevo cupón de descuento: ${newCoupon.code} (${newCoupon.discountPercentage}% OFF).`);
      triggerToast('success', 'Cupón Creado con Éxito', `El código "${newCoupon.code}" ahora está disponible para comensales.`);
    } catch (e: any) {
      triggerToast('error', 'Error al crear cupón', e?.message || 'No se pudo guardar el cupón.');
    }
  };

  const handleToggleCoupon = async (id: string, isActive: boolean) => {
    try {
      await setCoupons(prev => prev.map(c => c.id === id ? { ...c, isActive } : c));
      addAuditLog(`${isActive ? 'Activó' : 'Pausó'} cupón ID: ${id}`);
      triggerToast('info', 'Estado del Cupón Actualizado', `El cupón fue ${isActive ? 'activado' : 'pausado'}.`);
    } catch (e: any) {
      triggerToast('error', 'Error al actualizar', e?.message);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    try {
      const target = coupons.find(c => c.id === id);
      await setCoupons(prev => prev.filter(c => c.id !== id));
      addAuditLog(`Eliminó cupón: ${target?.code || id}`);
      triggerToast('info', 'Cupón Eliminado', 'El cupón ha sido removido del sistema.');
    } catch (e: any) {
      triggerToast('error', 'Error al eliminar', e?.message);
    }
  };

  // --- Simulated SuperAdmin User Staff Handlers ---
    const handleDeleteStaffUser = (id: string) => {
    const u = staffUsers.find(x => x.id === id);
    if (!u) return;
    setStaffUsers(prev => prev.filter(x => x.id !== id));
    addAuditLog(`Super Admin removió al personal: ${u.name}.`);
    triggerToast('error', 'Colaborador Removido', `El acceso de ${u.name} fue revocado.`);
  };

  // --- Simulated Authentication Handlers ---
  const handleLoginSuccess = () => {
    setIsLoggingIn(false);
    // Auto-switch done by useEffect
  };

  const handleLogout = async () => {
    setDemoRole(null);
    await signOut(auth);
    addAuditLog(`Cerró sesión administrativa.`);
    setIsLoggingIn(false);
    triggerToast('info', 'Sesión Finalizada', 'Has salido del panel administrativo.');
  };

  // Auto-switch Admin Tab if role transitions and is restricted
  useEffect(() => {
    if (userRole === 'esperando') {
      setAdminTab('perfil');
    } else if (userRole === 'mensajero') {
      setAdminTab('repartidor');
    } else if (userRole !== 'publico' && adminTab === 'repartidor') {
      setAdminTab('dashboard');
    }
  }, [userRole]);

  useEffect(() => {
    if (activeProfile?.fontSizePreference === 'large') {
      document.documentElement.classList.add('font-size-large');
    } else {
      document.documentElement.classList.remove('font-size-large');
    }
  }, [activeProfile?.fontSizePreference]);

  // Modals / Helpers for edit plate inside settings
  const [editingDish, setEditingDish] = useState<FoodItem | null>(null);
  const [dishForm, setDishForm] = useState<{
    name: string;
    description: string;
    price: number;
    category: string;
    stock: number;
    hidden: boolean;
    image: string;
    options: { title: string; choices: string[]; multiselect: boolean }[];
    extras: { name: string; price: number }[];
    extrasMultiselect: boolean;
  }>({
    name: '',
    description: '',
    price: 0,
    category: 'Chilaquiles',
    stock: 20,
    hidden: false,
    image: '',
    options: [],
    extras: [],
    extrasMultiselect: true
  });

  const [isEditCustomCategory, setIsEditCustomCategory] = useState<boolean>(false);
  const [editCustomCategoryInput, setEditCustomCategoryInput] = useState<string>('');

  // State for adding new option/extra in edit modal
  const [newOptionTitle, setNewOptionTitle] = useState('');
  const [newOptionChoices, setNewOptionChoices] = useState('');
  const [newOptionMultiselect, setNewOptionMultiselect] = useState(false);
  const [newExtraName, setNewExtraName] = useState('');
  const [newExtraPrice, setNewExtraPrice] = useState(15);

  const handleOpenEditDish = (dish: FoodItem) => {
    setEditingDish(dish);
    setDishForm({
      name: dish.name,
      description: dish.description || '',
      price: dish.price,
      category: dish.category || 'Chilaquiles',
      stock: dish.stock,
      hidden: dish.hidden || false,
      image: dish.image || '',
      options: dish.options ? JSON.parse(JSON.stringify(dish.options)) : [],
      extras: dish.extras ? JSON.parse(JSON.stringify(dish.extras)) : [],
      extrasMultiselect: dish.extrasMultiselect !== undefined ? dish.extrasMultiselect : true
    });
    setIsEditCustomCategory(false);
    setEditCustomCategoryInput('');
    setNewOptionTitle('');
    setNewOptionChoices('');
    setNewOptionMultiselect(false);
    setNewExtraName('');
    setNewExtraPrice(15);
  };

  const handleSaveEditDishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDish) return;
    const finalCategory = (isEditCustomCategory ? editCustomCategoryInput.trim() : dishForm.category.trim()) || 'General';
    const updated: FoodItem = {
      ...editingDish,
      name: dishForm.name.trim(),
      description: dishForm.description.trim(),
      price: Number(dishForm.price),
      category: finalCategory,
      stock: Number(dishForm.stock),
      hidden: Boolean(dishForm.hidden),
      image: dishForm.image ? dishForm.image.trim() : '',
      options: dishForm.options,
      extras: dishForm.extras,
      extrasMultiselect: dishForm.extrasMultiselect
    };
    handleEditDish(updated);
    setEditingDish(null);
  };

  // Drag & drop sorting for dishes in menu
  const [draggedDishIndex, setDraggedDishIndex] = useState<number | null>(null);
  const [dragOverDishIndex, setDragOverDishIndex] = useState<number | null>(null);

  const handleDragStartDish = (e: React.DragEvent, index: number) => {
    setDraggedDishIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', index.toString());
    } catch {}
  };

  const handleDragOverDish = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverDishIndex !== index) {
      setDragOverDishIndex(index);
    }
  };

  const handleDropDish = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedDishIndex === null || draggedDishIndex === targetIndex) {
      setDraggedDishIndex(null);
      setDragOverDishIndex(null);
      return;
    }

    const newItems = [...foodItems];
    const [movedItem] = newItems.splice(draggedDishIndex, 1);
    newItems.splice(targetIndex, 0, movedItem);

    const ordered = newItems.map((item, idx) => ({
      ...item,
      order: idx
    }));

    setFoodItems(ordered);
    setDraggedDishIndex(null);
    setDragOverDishIndex(null);
    addAuditLog(`Reordenó la carta: "${movedItem.name}" ahora en posición #${targetIndex + 1}.`);
    triggerToast('success', 'Orden de Carta Actualizado', `"${movedItem.name}" acomodado. Se refleja en el menú público.`);
  };

  const handleDragEndDish = () => {
    setDraggedDishIndex(null);
    setDragOverDishIndex(null);
  };

  const handleMoveDish = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= foodItems.length) return;

    const newItems = [...foodItems];
    const [movedItem] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, movedItem);

    const ordered = newItems.map((item, idx) => ({
      ...item,
      order: idx
    }));

    setFoodItems(ordered);
    addAuditLog(`Acomodó platillo "${movedItem.name}" a posición #${targetIndex + 1}.`);
    triggerToast('info', 'Posición Actualizada', `"${movedItem.name}" se movió a #${targetIndex + 1}.`);
  };

  // Custom Dish Creator state inside Settings (Altas)
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    price: 85,
    category: 'Chilaquiles',
    stock: 25,
    hidden: false,
    image: ''
  });
  const [isCreateCustomCategory, setIsCreateCustomCategory] = useState<boolean>(false);
  const [createCustomCategoryInput, setCreateCustomCategoryInput] = useState<string>('');

  const handleCreateDishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = (isCreateCustomCategory ? createCustomCategoryInput.trim() : createForm.category.trim()) || 'General';
    const newDish: FoodItem = {
      id: `f-${Date.now()}`,
      name: createForm.name.trim(),
      description: createForm.description.trim(),
      price: Number(createForm.price),
      category: finalCategory,
      stock: Number(createForm.stock),
      hidden: Boolean(createForm.hidden),
      image: createForm.image ? createForm.image.trim() : '',
      order: foodItems.length,
      options: [],
      extras: [],
      extrasMultiselect: true
    };
    handleAddCustomDish(newDish);
    setShowCreateForm(false);
    setIsCreateCustomCategory(false);
    setCreateCustomCategoryInput('');
    setCreateForm({
      name: '',
      description: '',
      price: 85,
      category: 'Chilaquiles',
      stock: 25,
      hidden: false,
      image: ''
    });
  };

  const handleReloadOfficialMenu = () => {
    setFoodItems(INITIAL_FOOD_ITEMS);
    setBusinessConfig(prev => ({
      ...prev,
      ...DEFAULT_BUSINESS_CONFIG
    }));
    addAuditLog('Cargó el menú oficial completo BM Desayunos Cony (21 platillos con fotos).');
    triggerToast('success', 'Menú Oficial BM Desayunos Cony', 'Se cargaron los 21 platillos con descripciones persuasivas, opciones y fotos.');
  };

  // Auto-upgrade to BM Desayunos Cony official menu if empty or holding legacy sample items
  useEffect(() => {
    if (foodItems && foodItems.length > 0 && foodItems.some(f => f.id === 'f1')) {
      setFoodItems(INITIAL_FOOD_ITEMS);
      setBusinessConfig(prev => ({
        ...prev,
        ...DEFAULT_BUSINESS_CONFIG
      }));
    }
  }, [foodItems]);

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#2C241E] flex flex-col font-sans selection:bg-amber-200">
      <style>{getThemeStyles(businessConfig.themeColor || '#f59e0b')}</style>
      
      {/* GLOBAL MASTER HEADER */}
      <header className="bg-white border-b border-gray-150 sticky top-0 z-40 shadow-xs" id="master-header">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          
          {/* Left Side: Logged-in User Avatar & Brand Logo */}
          <div className="flex items-center gap-3">
            {/* 1:1 User Avatar - ONLY visible when logged in */}
            {userRole !== 'publico' && (
              <button 
                onClick={() => setAdminTab('perfil')}
                className="h-10 w-10 shrink-0 rounded-full overflow-hidden border-2 border-amber-500 shadow-sm focus:outline-hidden hover:scale-105 transition-transform cursor-pointer"
                title="Mi Perfil de Usuario"
                id="header-user-avatar"
              >
                <img 
                  src={activeProfile?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150'} 
                  alt={`Avatar ${userRole}`} 
                  className="h-full w-full object-cover" 
                />
              </button>
            )}

            {/* Dynamic Brand Logo and Text Space */}
            <div className="flex items-center gap-2">
              <img 
                src={businessConfig.brandLogo} 
                alt="Logo Desayunador" 
                className="h-10 w-10 rounded-xl object-cover border border-amber-200/60 shadow-xs shrink-0" 
              />
              <div className="flex flex-col">
                <span className="font-serif font-extrabold text-base sm:text-lg text-amber-950 tracking-tight leading-tight">{businessConfig.businessName || 'Desayunos Cony'}</span>
                <span className="text-[9px] sm:text-[10px] text-amber-600 font-bold leading-none">{businessConfig.slogan || 'El auténtico sabor de casa'}</span>
              </div>
            </div>
          </div>

          {/* Right Side: Role details or Login trigger */}
          <div className="flex items-center gap-3">
            {userRole !== 'publico' ? (
              <div className="flex items-center gap-2">
                {/* Quick Button: View Public Menu / Assist Customer without logging out */}
                <button
                  onClick={() => setAdminTab(adminTab === 'carta_publica' ? (userRole === 'mensajero' ? 'repartidor' : 'kitchen') : 'carta_publica')}
                  className={`px-3 py-1.5 rounded-xl border transition-all text-xs font-bold flex items-center gap-1.5 shadow-2xs ${
                    adminTab === 'carta_publica'
                      ? 'bg-amber-600 text-white border-amber-600 ring-2 ring-amber-300 shadow-amber-200'
                      : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100 hover:border-amber-300'
                  }`}
                  title="Ver Carta Pública para Apoyar al Comensal sin Salir del Perfil"
                  id="header-carta-publica-btn"
                >
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">
                    {adminTab === 'carta_publica' ? '← Volver al Panel' : 'Carta Digital (Asistir)'}
                  </span>
                  <span className="sm:hidden">
                    {adminTab === 'carta_publica' ? 'Panel' : 'Carta'}
                  </span>
                </button>

                <div className="text-right hidden sm:block space-y-0.5">
                  <span className="block text-[9px] font-extrabold text-amber-600 uppercase tracking-wider">
                    {activeProfile?.name || userProfiles[userRole as 'superadmin' | 'admin' | 'mensajero']?.name || 'Personal Cony'}
                  </span>
                  <span className="inline-block text-[10px] font-bold text-gray-600 capitalize bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                    {userRole === 'superadmin' ? '👑 Super Admin' : userRole === 'admin' ? '🍳 Administrativo' : userRole === 'mensajero' ? '🛵 Mensajero' : '⏳ Pendiente'}
                  </span>
                </div>
                <button
                  onClick={() => setAdminTab('perfil')}
                  className="p-2 text-amber-700 hover:bg-amber-50 rounded-xl border border-amber-100 transition-colors text-xs font-bold flex items-center gap-1.5"
                  title="Configurar Perfil"
                  id="admin-profile-btn"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden xs:inline">Mi Perfil</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-100 transition-colors"
                  title="Cerrar Sesión"
                  id="admin-logout-btn"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              !isLoggingIn && (
                <button
                  onClick={() => {
                    setIsLoggingIn(true);
                    triggerToast('info', 'Validación del Personal', 'Por favor ingresa tus credenciales de negocio.');
                  }}
                  className="px-3.5 py-1.5 border border-amber-200 hover:bg-amber-50 rounded-xl text-xs font-bold text-amber-900 transition-colors shadow-2xs"
                  id="admin-portal-login-btn"
                >
                  🔒 Panel de Negocio
                </button>
              )
            )}
          </div>

        </div>
      </header>

      {/* SYSTEM ROUTER CONTROLLER */}
      <main className="flex-1 w-full flex flex-col">
        {userRole === 'publico' ? (
          isLoggingIn ? (
            // DEMO LOGIN SCREEN (TEMPORARY FOR PRESENTATION)
            <div className="py-12 bg-amber-50/20 flex-1 flex items-center justify-center p-4">
              <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-amber-200">
                <h2 className="text-2xl font-serif font-bold text-amber-950 mb-2 text-center">Modo Demo Activado</h2>
                <p className="text-gray-500 text-sm text-center mb-6">Selecciona un rol para probar la aplicación rápida sin registrarte.</p>
                <div className="space-y-3">
                  <button onClick={() => { setDemoRole('superadmin'); setIsLoggingIn(false); }} className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-colors">Ingresar como Administrador (Dueño)</button>
                  <button onClick={() => { setDemoRole('admin'); setIsLoggingIn(false); }} className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-colors">Ingresar como Cajero/Comedor</button>
                  <button onClick={() => { setDemoRole('mensajero'); setIsLoggingIn(false); }} className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-colors">Ingresar como Repartidor</button>
                </div>
                <button onClick={() => setIsLoggingIn(false)} className="w-full mt-6 py-2 text-gray-500 hover:bg-gray-50 rounded-xl font-bold text-sm border border-gray-200 transition-colors">Volver a la Carta Pública</button>
              </div>
            </div>
          ) : (
            // PUBLIC DINER MENU
            <div className="animate-fade-in flex-1">
              <div className="bg-amber-500/10 border-b border-amber-200/50 py-2.5 text-center px-4">
                <p className="text-xs font-medium text-amber-950">
                  🛒 ¿Eres del personal de Doña Cony? Haz clic en <strong className="text-amber-900 font-bold">🔒 Panel de Negocio</strong> en la esquina superior para administrar pedidos.
                </p>
              </div>
              <ClientMenu
                foodItems={foodItems}
                config={businessConfig}
                coupons={coupons}
                onPlaceOrder={handlePlaceOrder}
                triggerToast={triggerToast}
              />
            </div>
          )
        ) : (
          // LOGGED IN ADMIN PANEL (Accessible ONLY after successful login)
          <div className="flex-1 flex flex-col md:flex-row">
            {/* SIDEBAR NAVIGATION CONTROLS */}
            <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-200/80 p-5 space-y-1.5 shrink-0" id="admin-sidebar">
              <div className="pb-4 mb-4 border-b border-gray-100">
                <h3 className="font-serif font-bold text-sm text-amber-950">Administración Cony</h3>
                  <p className="text-[11px] text-gray-500">Gestión física, cocina, pedidos y caja.</p>
                </div>

                <nav className="space-y-1.5">
                  {/* Carta Pública / Asistencia a Comensales - DISPONIBLE PARA TODOS LOS ROLES (SuperAdmin, Admin, Mensajero) */}
                  <button
                    onClick={() => setAdminTab('carta_publica')}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                      adminTab === 'carta_publica'
                        ? 'bg-amber-500 text-white font-extrabold shadow-sm'
                        : 'text-amber-950 bg-amber-50/70 border border-amber-200/80 hover:bg-amber-100/80 hover:text-amber-900'
                    }`}
                    id="tab-carta-publica"
                  >
                    <span className="flex items-center gap-2">
                      <BookOpen className={`w-4 h-4 ${adminTab === 'carta_publica' ? 'text-white' : 'text-amber-700'}`} />
                      Carta Digital (Apoyar Comensal)
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${adminTab === 'carta_publica' ? 'bg-amber-600 text-white' : 'bg-amber-200 text-amber-900'}`}>
                      En vivo
                    </span>
                  </button>

                  {/* Dashboard - Authorized to SuperAdmin & Admin */}
                  {(userRole === 'superadmin' || userRole === 'admin') && (
                    <button
                      onClick={() => setAdminTab('dashboard')}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                        adminTab === 'dashboard'
                          ? 'bg-amber-50 text-amber-900 font-extrabold shadow-xs'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      id="tab-dashboard"
                    >
                      <span className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600" />
                        Métricas y Reportes
                      </span>
                    </button>
                  )}

                  {/* Kitchen / Kanban - Authorized to SuperAdmin & Admin */}
                  {(userRole === 'superadmin' || userRole === 'admin') && (
                    <button
                      onClick={() => setAdminTab('kitchen')}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                        adminTab === 'kitchen'
                          ? 'bg-amber-50 text-amber-900 font-extrabold shadow-xs'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      id="tab-kitchen"
                    >
                      <span className="flex items-center gap-2">
                        <Utensils className="w-4 h-4 text-amber-600" />
                        Cocina / Kanban
                      </span>
                    </button>
                  )}

                  {/* Caja / POS - Authorized to SuperAdmin & Admin */}
                  {(userRole === 'superadmin' || userRole === 'admin') && (
                    <button
                      onClick={() => setAdminTab('caja')}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                        adminTab === 'caja'
                          ? 'bg-amber-50 text-amber-900 font-extrabold shadow-xs'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      id="tab-caja"
                    >
                      <span className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-amber-600" />
                        Caja Chica y POS
                      </span>
                    </button>
                  )}

                  {/* Clientes CRM - Authorized to SuperAdmin & Admin */}
                  {(userRole === 'superadmin' || userRole === 'admin') && (
                    <button
                      onClick={() => setAdminTab('clientes')}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                        adminTab === 'clientes'
                          ? 'bg-amber-50 text-amber-900 font-extrabold shadow-xs'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      id="tab-clientes"
                    >
                      <span className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-amber-600" />
                        Clientes Estrella CRM
                      </span>
                    </button>
                  )}

                  {/* Cupones de Descuento - Authorized to SuperAdmin & Admin */}
                  {(userRole === 'superadmin' || userRole === 'admin') && (
                    <button
                      onClick={() => setAdminTab('cupones')}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                        adminTab === 'cupones'
                          ? 'bg-amber-50 text-amber-900 font-extrabold shadow-xs'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      id="tab-cupones"
                    >
                      <span className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-amber-600" />
                        Cupones y Descuentos
                      </span>
                      {coupons.filter(c => c.isActive).length > 0 && (
                        <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          {coupons.filter(c => c.isActive).length}
                        </span>
                      )}
                    </button>
                  )}

                  {/* Delivery / Repartidor - Authorized to ALL admin roles */}
                  <button
                    onClick={() => setAdminTab('repartidor')}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                      adminTab === 'repartidor'
                        ? 'bg-amber-50 text-amber-900 font-extrabold shadow-xs'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    id="tab-repartidor"
                  >
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      Vista Repartidor
                    </span>
                    {orders.filter(o => o.status === 'camino').length > 0 && (
                      <span className="bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        {orders.filter(o => o.status === 'camino').length}
                      </span>
                    )}
                  </button>

                  {/* Menú Management - Authorized to SuperAdmin & Admin */}
                  {(userRole === 'superadmin' || userRole === 'admin') && (
                    <button
                      onClick={() => setAdminTab('menu')}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                        adminTab === 'menu'
                          ? 'bg-amber-50 text-amber-900 font-extrabold shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      id="tab-menu"
                    >
                      <span className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-amber-600" />
                        Menú y Platillos
                      </span>
                    </button>
                  )}

                  {/* Configurations Settings - Authorized to SuperAdmin & Admin */}
                  {(userRole === 'superadmin' || userRole === 'admin') && (
                    <button
                      onClick={() => setAdminTab('config')}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                        adminTab === 'config'
                          ? 'bg-amber-50 text-amber-900 font-extrabold shadow-xs'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      id="tab-config"
                    >
                      <span className="flex items-center gap-2">
                        <Settings className="w-4 h-4 text-amber-600" />
                        Ajustes del Negocio
                      </span>
                    </button>
                  )}
                </nav>

                <div className="pt-8 mt-8 border-t border-gray-100 flex flex-col gap-2">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Sistema de Roles (En Vivo)</p>
                  <div className="bg-[#FAF9F5] p-3 rounded-xl border border-gray-200">
                    <p className="text-[10px] font-bold text-green-700">
                      ✅ Cambios Reflejados Correctamente
                    </p>
                    <p className="text-[9px] text-gray-500 mt-0.5">
                      Este es tu rol de prueba actual: <strong className="text-amber-900">{userRole.toUpperCase()}</strong>.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setAdminTab('carta_publica');
                      triggerToast('info', 'Carta Digital', 'Visualizando la carta pública para apoyar a los comensales.');
                    }}
                    className="w-full py-2 bg-amber-500 text-white text-[11px] font-bold rounded-lg hover:bg-amber-600 transition-colors inline-flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Ver Carta Pública (Apoyar Comensal)
                  </button>
                </div>
              </aside>

              {/* ADMIN PANEL WORKSPACE CONTENT */}
              <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
                {/* CARTA PÚBLICA / ASISTENCIA A COMENSALES (ACCESIBLE PARA TODOS LOS ROLES) */}
                {adminTab === 'carta_publica' && (
                  <div className="animate-fade-in space-y-4">
                    {/* Header banner indicating Staff Support Mode */}
                    <div className="bg-linear-to-r from-amber-500/15 via-orange-500/10 to-amber-50 border border-amber-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs mt-0.5 shrink-0">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-serif font-bold text-base text-amber-950">Carta Digital Doña Cony — Modo Apoyo a Comensales</h3>
                            <span className="text-[10px] font-extrabold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full uppercase">
                              Sesión activa: {userRole}
                            </span>
                          </div>
                          <p className="text-xs text-amber-900/80 mt-1 max-w-2xl leading-relaxed">
                            Estás visualizando la carta oficial interactiva con tu sesión activa de <strong className="text-amber-950 font-bold">{activeProfile?.name || 'Personal Doña Cony'}</strong>. Puedes usar esta vista para dictar platillos, revisar fotos, precios e ingredientes en vivo, y levantar pedidos asistiendo directamente al cliente.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setAdminTab(userRole === 'mensajero' ? 'repartidor' : 'kitchen')}
                          className="px-3.5 py-2 bg-white border border-amber-300 text-amber-950 hover:bg-amber-50 rounded-xl text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5"
                        >
                          <span>Volver a {userRole === 'mensajero' ? 'Repartidor' : 'Operaciones'}</span>
                        </button>
                      </div>
                    </div>

                    {/* ClientMenu Component with full features */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
                      <ClientMenu
                        foodItems={foodItems}
                        config={businessConfig}
                        coupons={coupons}
                        onPlaceOrder={handlePlaceOrder}
                        triggerToast={triggerToast}
                      />
                    </div>
                  </div>
                )}
                {adminTab === 'dashboard' && (userRole === 'superadmin' || userRole === 'admin') && (
                  <div className="animate-fade-in">
                    <AdminDashboard
                      orders={orders}
                      expenses={expenses}
                      triggerToast={triggerToast}
                      role={userRole as 'superadmin' | 'admin'}
                      config={businessConfig}
                    />
                  </div>
                )}

                {adminTab === 'kitchen' && (userRole === 'superadmin' || userRole === 'admin') && (
                  <div className="animate-fade-in">
                    <AdminKitchen
                      orders={orders}
                      foodItems={foodItems}
                      clients={unifiedClients}
                      onUpdateOrderStatus={handleUpdateOrderStatus}
                      onUpdateStock={handleUpdateStock}
                      onAddCustomDish={handleAddCustomDish}
                      onEditDish={handleOpenEditDish}
                      onToggleHideDish={handleToggleHideDish}
                      triggerToast={triggerToast}
                      config={businessConfig}
                    />
                  </div>
                )}

                {adminTab === 'caja' && (userRole === 'superadmin' || userRole === 'admin') && (
                  <div className="animate-fade-in">
                    <AdminCaja
                      orders={orders}
                      foodItems={foodItems}
                      expenses={expenses}
                      config={businessConfig}
                      onAddOrder={handleAddOrderCaja}
                      onAddExpense={handleAddExpense}
                      onDeleteExpense={handleDeleteExpense}
                      triggerToast={triggerToast}
                    />
                  </div>
                )}

                {adminTab === 'clientes' && (userRole === 'superadmin' || userRole === 'admin') && (
                  <div className="animate-fade-in">
                    <AdminClientes
                      clients={unifiedClients}
                      coupons={coupons}
                      triggerToast={triggerToast}
                    />
                  </div>
                )}

                {adminTab === 'cupones' && (userRole === 'superadmin' || userRole === 'admin') && (
                  <div className="animate-fade-in">
                    <AdminCupones
                      coupons={coupons}
                      onAddCoupon={handleAddCoupon}
                      onToggleCoupon={handleToggleCoupon}
                      onDeleteCoupon={handleDeleteCoupon}
                      triggerToast={triggerToast}
                    />
                  </div>
                )}

                {adminTab === 'repartidor' && (
                  <div className="animate-fade-in">
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 mb-6 flex items-start gap-3">
                      <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-xs text-amber-950">Vista Móvil del Mensajero</h4>
                        <p className="text-[10px] text-gray-600 mt-0.5 leading-normal">
                          Muestra únicamente comandas despachadas con estatus <strong className="text-amber-900 font-bold">"En camino"</strong>. Los botones de llamada directa y GPS abren aplicaciones nativas.
                        </p>
                      </div>
                    </div>
                    <AdminRepartidor
                      orders={orders}
                      onUpdateOrderStatus={handleUpdateOrderStatus}
                      triggerToast={triggerToast}
                      currentRole={userRole}
                      config={businessConfig}
                    />
                  </div>
                )}

                {adminTab === 'config' && (userRole === 'superadmin' || userRole === 'admin') && (
                  <div className="animate-fade-in space-y-8">
                    {/* Header settings */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-200">
                      <h2 className="font-serif font-bold text-lg text-amber-950">Ajustes Generales del Negocio</h2>
                      <p className="text-xs text-gray-500 mt-1">Configura parámetros globales del comal, cobro de envíos y datos de contacto de WhatsApp.</p>
                      
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const target = e.target as any;
                          const isAllDay = Boolean(is24HoursState);
                          const startVal = isAllDay ? '00:00' : (scheduleStartState.trim() || '07:30').replace(/\./g, ':');
                          const endVal = isAllDay ? '24:00' : (scheduleEndState.trim() || '13:30').replace(/\./g, ':');

                          handleSaveConfig({
                            whatsappPhone: target.whatsapp.value,
                            deliveryPhone: target.deliveryPhone?.value || businessConfig.deliveryPhone || '',
                            scheduleStart: startVal,
                            scheduleEnd: endVal,
                            isOpenManual: isOpenManualState,
                            is24Hours: isAllDay,
                            ticketFooter: target.footer.value,
                            deliveryFee: Number(target.fee.value),
                            suggestedTip: Number(target.suggestedTip?.value ?? 10),
                            defaultOpeningStock: Number(target.defaultOpeningStock?.value ?? 25),
                            brandLogo: target.brandLogo ? target.brandLogo.value : businessConfig.brandLogo,
                            businessName: target.businessName.value,
                            slogan: target.slogan.value,
                            address: target.address.value,
                            themeColor: target.themeColor.value
                          });
                        }}
                        className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4"
                      >
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-gray-100">
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre del Negocio *</label>
                            <input
                              type="text"
                              name="businessName"
                              defaultValue={businessConfig.businessName || 'Desayunos Cony'}
                              placeholder="Ej. Desayunos Cony"
                              className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Eslogan *</label>
                            <input
                              type="text"
                              name="slogan"
                              defaultValue={businessConfig.slogan || 'El auténtico sabor de casa'}
                              placeholder="Ej. El auténtico sabor de casa"
                              className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                              required
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Dirección del Local</label>
                            <input
                              type="text"
                              name="address"
                              defaultValue={businessConfig.address || ''}
                              placeholder="Ej. Av. Principal #123, Colonia Centro"
                              className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                            />
                          </div>
                          
                          {/* COLOR THEME PICKER */}
                          <div className="md:col-span-2 pt-2">
                            <label className="block text-xs font-semibold text-gray-600 mb-2">Color Principal de la Marca</label>
                            <div className="flex flex-wrap items-center gap-3">
                              {/* Swatches */}
                              {[
                                { name: 'Ámbar (Original)', hex: '#f59e0b' },
                                { name: 'Rojo Carmesí', hex: '#ef4444' },
                                { name: 'Verde Esmeralda', hex: '#10b981' },
                                { name: 'Azul Océano', hex: '#0ea5e9' },
                                { name: 'Violeta Real', hex: '#8b5cf6' },
                                { name: 'Rosa Vivo', hex: '#ec4899' },
                              ].map(c => (
                                <button
                                  key={c.hex}
                                  type="button"
                                  title={c.name}
                                  onClick={() => {
                                    const el = document.getElementById('themeColorInput') as HTMLInputElement;
                                    if (el) el.value = c.hex;
                                  }}
                                  className="w-8 h-8 rounded-full border-2 border-white shadow-sm ring-1 ring-gray-200 transition-transform hover:scale-110"
                                  style={{ backgroundColor: c.hex }}
                                />
                              ))}
                              
                              <div className="h-6 w-px bg-gray-300 mx-2" />
                              
                              {/* Custom Hex Color Picker */}
                              <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                                <label htmlFor="themeColorInput" className="text-[10px] text-gray-500 font-bold ml-1 cursor-pointer">
                                  Personalizado:
                                </label>
                                <input
                                  type="color"
                                  id="themeColorInput"
                                  name="themeColor"
                                  defaultValue={businessConfig.themeColor || '#f59e0b'}
                                  className="w-8 h-8 cursor-pointer rounded bg-transparent border-0 p-0 color-input-style"
                                />
                              </div>
                            </div>
                            <p className="text-[9px] text-gray-400 mt-2">El color seleccionado modificará los botones, acentos visuales e identidad gráfica de la plataforma.</p>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">WhatsApp del Negocio *</label>
                          <input
                            type="text"
                            name="whatsapp"
                            defaultValue={businessConfig.whatsappPhone}
                            placeholder="Ej. 525512345678 (Con código de país)"
                            className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                            required
                          />
                          <p className="text-[9px] text-gray-400 mt-1">Número donde el cliente enviará su comanda de compra.</p>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center justify-between">
                            <span>Móvil / WhatsApp del Mensajero *</span>
                            <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              🛵 Avisos al Móvil
                            </span>
                          </label>
                          <input
                            type="text"
                            name="deliveryPhone"
                            defaultValue={businessConfig.deliveryPhone || '525598765432'}
                            placeholder="Ej. 525598765432 (Con código de país)"
                            className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                          />
                          <p className="text-[9px] text-gray-400 mt-1">Número móvil donde el mensajero recibirá avisos por WhatsApp de pedidos listos para entregar.</p>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Costo de Envío a Domicilio ($ MXN) *</label>
                          <input
                            type="number"
                            name="fee"
                            min="0"
                            step="1"
                            defaultValue={businessConfig.deliveryFee}
                            className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center justify-between">
                            <span>Propuesta de Propina ($ MXN) *</span>
                            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Configurable por Dueño
                            </span>
                          </label>
                          <input
                            type="number"
                            name="suggestedTip"
                            min="0"
                            step="1"
                            defaultValue={businessConfig.suggestedTip !== undefined ? businessConfig.suggestedTip : 10}
                            placeholder="Ej. 10 (Sugerencia por pedido)"
                            className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                            required
                          />
                          <p className="text-[9px] text-gray-400 mt-1">Monto de propina sugerido al comensal en la comanda (pon $0 si no deseas sugerir).</p>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center justify-between">
                            <span>Porciones de Apertura por Platillo (Stock Inicial) *</span>
                            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Configurable por Dueño
                            </span>
                          </label>
                          <input
                            type="number"
                            name="defaultOpeningStock"
                            min="1"
                            step="1"
                            defaultValue={businessConfig.defaultOpeningStock !== undefined ? businessConfig.defaultOpeningStock : 25}
                            placeholder="Ej. 25 (Porciones al iniciar el día)"
                            className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                            required
                          />
                          <p className="text-[9px] text-gray-400 mt-1">
                            Cantidad de porciones con las que abre cada platillo en cocina al iniciar el turno o al aplicar la acción de apertura.
                          </p>
                        </div>

                        {/* ESTADO OPERATIVO DEL COMAL (ABIERTO / CERRADO) */}
                        <div className="md:col-span-2 p-4 rounded-2xl border bg-gray-50/80 border-gray-200 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <label className="block text-xs font-bold text-amber-950">
                                Estado Operativo del Establecimiento
                              </label>
                              <p className="text-[11px] text-gray-500">
                                Controla si la cocina y el carrito de pedidos están disponibles para los comensales.
                              </p>
                            </div>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                              isOpenManualState ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              <span className={`w-2 h-2 rounded-full ${isOpenManualState ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                              {isOpenManualState ? 'Comal Abierto (Recibiendo pedidos)' : 'Comal Pausado (Cerrado temporal)'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            {/* Botón Abierto */}
                            <button
                              type="button"
                              onClick={() => setIsOpenManualState(true)}
                              className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                                isOpenManualState
                                  ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-200 text-emerald-950 shadow-xs'
                                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              <div className={`p-2 rounded-lg shrink-0 ${isOpenManualState ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                <CheckCircle className="w-5 h-5" />
                              </div>
                              <div>
                                <span className="block text-xs font-bold text-gray-900">🟢 Tienda Abierta (Activa)</span>
                                <span className="text-[11px] text-gray-500 leading-snug block mt-0.5">
                                  El comal recibe pedidos normalmente y el carrito está habilitado.
                                </span>
                              </div>
                            </button>

                            {/* Botón Cerrado */}
                            <button
                              type="button"
                              onClick={() => setIsOpenManualState(false)}
                              className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                                !isOpenManualState
                                  ? 'bg-rose-50/90 border-rose-400 ring-2 ring-rose-200 text-rose-950 shadow-xs'
                                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              <div className={`p-2 rounded-lg shrink-0 ${!isOpenManualState ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                <AlertTriangle className="w-5 h-5" />
                              </div>
                              <div>
                                <span className="block text-xs font-bold text-gray-900">🔴 Tienda Cerrada (Pausar)</span>
                                <span className="text-[11px] text-gray-500 leading-snug block mt-0.5">
                                  El comal descansa temporalmente. La carta solo será informativa.
                                </span>
                              </div>
                            </button>
                          </div>
                        </div>

                        {/* HORARIO DE SERVICIO */}
                        <div className="md:col-span-2 p-4 rounded-2xl border bg-amber-50/40 border-amber-200/80 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <label className="block text-xs font-bold text-amber-950 flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-amber-600" />
                                Horario de Atención al Público
                              </label>
                              <p className="text-[11px] text-gray-500">
                                Define el horario de servicio o activa el modo continuo de todo el día (24 Horas).
                              </p>
                            </div>

                            {/* Checkbox Abierto 24 Horas */}
                            <label className="inline-flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-amber-200 shadow-2xs hover:bg-amber-50/50">
                              <input
                                type="checkbox"
                                checked={is24HoursState}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setIs24HoursState(checked);
                                  if (!checked) {
                                    if (scheduleStartState === '00:00') setScheduleStartState('07:30');
                                    if (scheduleEndState === '24:00' || scheduleEndState === '23:59') setScheduleEndState('13:30');
                                  }
                                }}
                                className="w-4 h-4 accent-amber-500 rounded"
                              />
                              <span className="text-xs font-bold text-amber-950">☀️ Abierto Todo el Día (24 Horas)</span>
                            </label>
                          </div>

                          {!is24HoursState ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Apertura (Horario de Inicio) *</label>
                                <input
                                  type="text"
                                  name="start"
                                  value={scheduleStartState}
                                  onChange={(e) => setScheduleStartState(e.target.value)}
                                  placeholder="Ej. 07:30 (Formato 24 hrs)"
                                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden font-mono"
                                  required
                                />
                                <p className="text-[10px] text-gray-400 mt-1">Hora en que inicia la atención (ej. 07:30).</p>
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Cierre (Horario de Término) *</label>
                                <input
                                  type="text"
                                  name="end"
                                  value={scheduleEndState}
                                  onChange={(e) => setScheduleEndState(e.target.value)}
                                  placeholder="Ej. 13:30 (Formato 24 hrs)"
                                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden font-mono"
                                  required
                                />
                                <p className="text-[10px] text-gray-400 mt-1">Hora en que finalizan los pedidos (ej. 13:30 o 24:00).</p>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                              <span className="text-base">✨</span>
                              <span>
                                <strong>Modo 24 Horas Activo:</strong> El negocio está configurado para operar todo el día en horario corrido. En la carta se mostrará como <em>"Abierto las 24 Horas (Todo el día)"</em> y los comensales podrán pedir siempre.
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Pie de Ticket Térmico</label>
                          <input
                            type="text"
                            name="footer"
                            defaultValue={businessConfig.ticketFooter}
                            placeholder="Mensaje de agradecimiento en PDF impreso"
                            className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                          />
                        </div>

                        <div className="md:col-span-2 space-y-4">
                          <label className="block text-xs font-semibold text-gray-600">Logotipo del Desayunador (Marca) *</label>
                          
                          <div className="p-4 bg-amber-50/40 border border-amber-100 rounded-xl space-y-3">
                            <span className="block text-xs font-bold text-amber-950">📸 Cargar Imagen (Móvil / PC)</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={userRole !== 'superadmin'}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    const base64String = await resizeImage(file, 400, 400);
                                    const input = document.getElementById('brandLogoInput') as HTMLInputElement;
                                    if (input) input.value = base64String;
                                    triggerToast('success', 'Logo Procesado', 'El logo se ha cargado. No olvides pulsar Guardar Configuración.');
                                  } catch (err) {
                                    triggerToast('error', 'Error', 'No se pudo leer la imagen.');
                                  }
                                }
                              }}
                              className={`block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 cursor-pointer ${userRole !== 'superadmin' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                          </div>

                          <div>
                            <input
                              type="hidden"
                              id="brandLogoInput"
                              name="brandLogo"
                              defaultValue={businessConfig.brandLogo}
                            />
                            {userRole !== 'superadmin' ? (
                              <p className="text-[9.5px] text-rose-600 mt-1 font-bold">⚠️ El logotipo del desayunador solo puede ser modificado por el Superadministrador.</p>
                            ) : (
                              <p className="text-[9.5px] text-gray-400 mt-1">Los cambios se reflejarán en toda la aplicación al guardar.</p>
                            )}
                          </div>
                        </div>

                        <div className="md:col-span-2 pt-2 flex justify-end">
                          <button
                            type="submit"
                            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
                          >
                            <Save className="w-4 h-4" />
                            Guardar Configuración
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* SUPER ADMIN ONLY - GESTIÓN DE USUARIOS Y AUDITORÍA */}
                    {userRole === 'superadmin' && (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* Users & Roles Management */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 lg:col-span-5 space-y-4">
                          <div>
                            <h3 className="font-serif font-bold text-base text-amber-950 flex items-center gap-1.5">
                              <Users className="w-4 h-4 text-amber-600" />
                              Control de Roles del Personal
                            </h3>
                            <p className="text-[11px] text-gray-500">Supervisa accesos, contraseñas de negocio y añade nuevos colaboradores autorizados.</p>
                          </div>

                          <div className="divide-y divide-gray-150">
                            {staffUsers.map(user => (
                              <div key={user.id} className="py-3 flex items-center justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-xs text-amber-950">{user.name}</p>
                                  <div className="flex gap-2 text-[9px] mt-1">
                                    <span className="text-gray-400 font-medium">User: {user.email}</span>
                                    <span className="font-bold text-amber-700 capitalize bg-amber-50 px-1 py-0.2 rounded">{user.role}</span>
                                  </div>
                                </div>
                                {user.role !== 'superadmin' && (
                                  <button
                                    onClick={() => handleDeleteStaffUser(user.id)}
                                    className="p-1 text-gray-400 hover:text-rose-600 rounded-lg"
                                    title="Remover Colaborador"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>


                          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800 mt-4">
                            <strong>Instrucciones:</strong> Para agregar personal nuevo, pídeles que hagan clic en "Login de Personal", luego en "Registrarme". 
                            Una vez que creen su cuenta con correo y contraseña, aparecerán aquí con estatus "Pendiente" para que les asignes un rol.
                          </div>
                        </div>
                        {/* Chronological Audit logs */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 lg:col-span-7 space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-serif font-bold text-base text-amber-950 flex items-center gap-1.5">
                                <History className="w-4 h-4 text-amber-600" />
                                Auditoría Interna / Bitácora
                              </h3>
                              <p className="text-[11px] text-gray-500">Historial inmutable en tiempo real de operaciones de seguridad y flujo de comandas.</p>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold uppercase">
                              Seguro 🔒
                            </span>
                          </div>

                          <div className="overflow-y-auto max-h-[310px] border border-gray-100 rounded-xl divide-y divide-gray-100">
                            {auditLogs.map(log => (
                              <div key={log.id} className="p-3 text-[11px] hover:bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="space-y-0.5 flex-1 pr-4">
                                  <p className="text-gray-700 leading-normal">{log.action}</p>
                                  <div className="flex gap-2 text-[9px] font-medium text-gray-400">
                                    <span>Por: <strong>{log.user}</strong></span>
                                    <span>•</span>
                                    <span className="capitalize text-amber-700">{log.role}</span>
                                  </div>
                                </div>
                                <span className="text-[10px] text-gray-400 shrink-0 font-medium">
                                  {log.timestamp}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                )}
                {adminTab === 'menu' && (userRole === 'superadmin' || userRole === 'admin') && (
                  <div className="animate-fade-in space-y-8">
                    {/* PLATILLOS MANAGEMENT (Alta y edición de platillos/precios) */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                          <h3 className="font-serif font-bold text-base text-amber-950">Catálogo de Alimentos</h3>
                          <p className="text-xs text-gray-500">Administra precios, descripciones, categorías e inventario diario del comal.</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={handleReloadOfficialMenu}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                            title="Restaura o sincroniza los 21 platillos oficiales de BM Desayunos Cony con fotos y precios"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Cargar Menú Oficial BM Cony
                          </button>
                          <button
                            onClick={() => setShowCreateForm(!showCreateForm)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            {showCreateForm ? 'Cerrar Registro' : 'Alta de Platillo'}
                          </button>
                        </div>
                      </div>

                      {/* CREATE DISH FORM */}
                      {showCreateForm && (
                        <form onSubmit={handleCreateDishSubmit} className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-xl mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre del Platillo *</label>
                            <input
                              type="text"
                              value={createForm.name}
                              onChange={e => setCreateForm({...createForm, name: e.target.value})}
                              placeholder="Ej. Enchiladas Verdes Doña Cony"
                              required
                              className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-semibold text-gray-600">Categoría *</label>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsCreateCustomCategory(!isCreateCustomCategory);
                                  if (!isCreateCustomCategory) {
                                    setCreateCustomCategoryInput('');
                                  }
                                }}
                                className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                              >
                                {isCreateCustomCategory ? '← Lista existente' : '+ Personalizar'}
                              </button>
                            </div>

                            {isCreateCustomCategory ? (
                              <input
                                type="text"
                                required
                                placeholder="Escribe nueva categoría..."
                                value={createCustomCategoryInput}
                                onChange={e => setCreateCustomCategoryInput(e.target.value)}
                                className="w-full p-2 bg-emerald-50/40 border border-emerald-300 rounded-lg text-xs font-bold text-gray-800 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                                autoFocus
                              />
                            ) : (
                              <select
                                value={createForm.category}
                                onChange={e => {
                                  if (e.target.value === '__NEW__') {
                                    setIsCreateCustomCategory(true);
                                    setCreateCustomCategoryInput('');
                                  } else {
                                    setCreateForm({...createForm, category: e.target.value});
                                  }
                                }}
                                className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none cursor-pointer"
                              >
                                {Array.from(new Set(['Chilaquiles', 'Huevos', 'Antojitos', 'Bebidas', ...foodItems.map(f => f.category)].filter(Boolean))).map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                                <option value="__NEW__" className="font-bold text-emerald-700">+ Otra categoría personalizada...</option>
                              </select>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Precio Unitario ($ MXN) *</label>
                            <input
                              type="number"
                              value={createForm.price}
                              onChange={e => setCreateForm({...createForm, price: Number(e.target.value)})}
                              required
                              className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center justify-between">
                              <span>Porciones en Inventario *</span>
                              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                Apertura: {businessConfig.defaultOpeningStock || 25}
                              </span>
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={createForm.stock}
                              onChange={e => setCreateForm({...createForm, stock: Math.max(0, Number(e.target.value) || 0)})}
                              required
                              className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                            />
                            <p className="text-[9px] text-gray-400 mt-1">
                              Porciones iniciales disponibles para la venta (predeterminado de apertura: {businessConfig.defaultOpeningStock || 25}).
                            </p>
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Imagen del Platillo (Opcional)</label>
                            
                            <div className="flex flex-col sm:flex-row gap-3">
                              <div className="flex-1 p-3 bg-emerald-50/40 border border-emerald-100 rounded-xl">
                                <span className="block text-[10px] font-bold text-emerald-900 mb-1.5">📸 Subir Foto</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      try {
                                        const base64String = await resizeImage(file, 400, 400);
                                        setCreateForm({...createForm, image: base64String});
                                        triggerToast('success', 'Foto Cargada', 'La imagen del platillo está lista.');
                                      } catch (err) {
                                        triggerToast('error', 'Error', 'No se pudo leer la imagen.');
                                      }
                                    }
                                  }}
                                  className="block w-full text-[10px] text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200 cursor-pointer"
                                />
                              </div>
                              <div className="flex-1">
                                <span className="block text-[10px] font-bold text-gray-600 mb-1.5">🔗 O Pegar Enlace (URL)</span>
                                <input
                                  type="text"
                                  value={createForm.image}
                                  onChange={e => setCreateForm({...createForm, image: e.target.value})}
                                  placeholder="Ej. https://images..."
                                  className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción Breve *</label>
                            <textarea
                              value={createForm.description}
                              onChange={e => setCreateForm({...createForm, description: e.target.value})}
                              required
                              rows={2}
                              placeholder="Añade ingredientes claves o modo de preparación"
                              className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none"
                            />
                          </div>
                          <div className="md:col-span-3 bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between gap-3 shadow-2xs">
                            <div className="flex items-start gap-2.5">
                              <div className={`p-2 rounded-lg ${createForm.hidden ? 'bg-amber-100 text-amber-900' : 'bg-emerald-50 text-emerald-800'}`}>
                                {createForm.hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </div>
                              <div>
                                <span className="text-xs font-bold text-gray-900 block">
                                  Ocultar platillo del menú para comensales
                                </span>
                                <p className="text-[10px] text-gray-500">
                                  {createForm.hidden
                                    ? 'Oculto: Los comensales NO verán este platillo en el menú digital (solo visible en cocina y caja).'
                                    : 'Visible: Los clientes podrán consultar y ordenar este platillo en el menú digital.'}
                                </p>
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer shrink-0">
                              <input
                                type="checkbox"
                                checked={createForm.hidden}
                                onChange={e => setCreateForm({...createForm, hidden: e.target.checked})}
                                className="sr-only peer"
                              />
                              <div className="w-10 h-5 bg-gray-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                            </label>
                          </div>
                          <div className="md:col-span-3 flex justify-end">
                            <button
                              type="submit"
                              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-sm"
                            >
                              Guardar en Menú
                            </button>
                          </div>
                        </form>
                      )}

                      {/* Dishes List with Drag & Drop Sorting */}
                      <div className="mb-3 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>
                            <strong>Acomodo de la Carta:</strong> Jala con el cursor hacia arriba o abajo para ordenar la carta. Este orden se reflejará exactamente en la pantalla pública de tus clientes.
                          </span>
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 shrink-0 self-start sm:self-auto">
                          {foodItems.length} platillos
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {foodItems.map((item, index) => (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={(e) => handleDragStartDish(e, index)}
                            onDragOver={(e) => handleDragOverDish(e, index)}
                            onDrop={(e) => handleDropDish(e, index)}
                            onDragEnd={handleDragEndDish}
                            className={`p-3.5 border rounded-2xl bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              draggedDishIndex === index
                                ? 'opacity-40 border-dashed border-amber-400 bg-amber-50/20'
                                : dragOverDishIndex === index
                                ? 'border-2 border-amber-500 bg-amber-50/60 shadow-md scale-[1.01]'
                                : 'border-gray-200/80 hover:border-amber-200 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {/* Drag Handle */}
                              <div
                                className="cursor-grab active:cursor-grabbing p-1.5 text-gray-400 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-colors flex items-center justify-center shrink-0"
                                title="Jala con el cursor arriba o abajo para acomodar"
                              >
                                <GripVertical className="w-4 h-4" />
                              </div>

                              {/* Position badge */}
                              <span className="w-6 text-center text-xs font-black text-gray-400 font-mono">
                                #{index + 1}
                              </span>

                              {/* Image or 2-letter box */}
                              {item.image && item.image.trim() !== '' ? (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-12 h-12 rounded-xl object-cover border border-amber-100 shadow-sm shrink-0"
                                />
                              ) : (
                                <div
                                  className="w-12 h-12 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 font-black text-sm flex items-center justify-center uppercase tracking-wider shrink-0 select-none shadow-sm"
                                  title={`Sin foto: ${item.name}`}
                                >
                                  {getDishInitials(item.name)}
                                </div>
                              )}

                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h5 className="font-serif font-bold text-sm text-amber-950">{item.name}</h5>
                                  {item.hidden && (
                                    <span className="text-[9.5px] font-bold px-2 py-0.5 rounded bg-gray-200 text-gray-700 border border-gray-300 inline-flex items-center gap-1">
                                      <EyeOff className="w-3 h-3 text-gray-500" />
                                      Oculto en menú
                                    </span>
                                  )}
                                  {(!item.image || item.image.trim() === '') && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                      Sin foto
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-gray-400 font-semibold">{item.category}</p>
                                <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-bold mt-1.5 text-gray-600">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditDish(item)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 transition-all cursor-pointer shadow-2xs hover:scale-102"
                                    title="Clic para editar precio o detalles"
                                  >
                                    <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Precio:</span>
                                    <strong className="text-amber-800 text-xs font-black">${item.price.toFixed(2)}</strong>
                                    <Edit2 className="w-3 h-3 text-amber-600 ml-0.5" />
                                  </button>
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-50 border border-gray-200">
                                    Insumo: <strong className={item.stock > 0 ? "text-emerald-600" : "text-rose-600"}>{item.stock} pzas</strong>
                                  </span>
                                  {item.options && item.options.length > 0 && (
                                    <span className="text-gray-400 font-normal">({item.options.length} opciones)</span>
                                  )}
                                  {item.extras && item.extras.length > 0 && (
                                    <span className="text-gray-500 font-normal">
                                      ({item.extras.length} extras · {item.extrasMultiselect !== false ? 'Múltiple' : 'Única'})
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1.5 self-end sm:self-center">
                              {/* Up and Down Buttons for quick move */}
                              <div className="flex flex-col gap-0.5 mr-1">
                                <button
                                  type="button"
                                  onClick={() => handleMoveDish(index, 'up')}
                                  disabled={index === 0}
                                  className="p-1 rounded bg-gray-50 hover:bg-amber-100 text-gray-500 hover:text-amber-800 disabled:opacity-20 disabled:hover:bg-gray-50 cursor-pointer"
                                  title="Subir posición"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveDish(index, 'down')}
                                  disabled={index === foodItems.length - 1}
                                  className="p-1 rounded bg-gray-50 hover:bg-amber-100 text-gray-500 hover:text-amber-800 disabled:opacity-20 disabled:hover:bg-gray-50 cursor-pointer"
                                  title="Bajar posición"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleToggleHideDish(item.id)}
                                className={`p-2 border rounded-xl transition-colors cursor-pointer ${
                                  item.hidden
                                    ? 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                }`}
                                title={item.hidden ? "Oculto en menú comensal. Clic para mostrar." : "Visible en menú comensal. Clic para ocultar."}
                              >
                                {item.hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEditDish(item)}
                                className="p-2 bg-white border border-gray-200 text-gray-600 hover:border-amber-400 hover:text-amber-800 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                                title="Editar platillo en todos sus campos"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteDish(item.id)}
                                className="p-2 bg-white border border-gray-200 text-gray-500 hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                                title="Eliminar platillo"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {adminTab === 'perfil' && activeProfile && (
                  <div className="animate-fade-in max-w-2xl mx-auto space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                      <h2 className="font-serif font-bold text-lg text-amber-950 flex items-center gap-2">
                        <User className="w-5 h-5 text-amber-600" />
                        Mi Perfil de Personal
                      </h2>
                      <p className="text-xs text-gray-500 mt-1">Personaliza tus datos de contacto, foto de avatar y contraseña.</p>

                      {/* AVATAR PREVIEW BLOCK */}
                      <div className="mt-6 flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-150">
                        <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-amber-100 shadow-md shrink-0 bg-amber-50 flex items-center justify-center">
                          {activeProfile.avatar ? (
                            <img 
                              src={activeProfile.avatar} 
                              alt="Tu Avatar" 
                              className="h-full w-full object-cover" 
                            />
                          ) : (
                            <User className="w-12 h-12 text-amber-300" />
                          )}
                        </div>
                        <div className="text-center sm:text-left space-y-1">
                          <h3 className="font-serif font-bold text-base text-amber-950">
                            {activeProfile.name || 'Nombre no configurado'}
                          </h3>
                          <p className="text-xs font-semibold text-amber-600 capitalize">
                            Rol del Sistema: {userRole}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {userRole === 'esperando' ? 'Pendiente de Aprobación ⏳' : 'Estatus de Acceso: Concedido 🔒'}
                          </p>
                        </div>
                      </div>

                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const target = e.target as any;
                          const updatedName = target.fullName.value.trim();
                          const updatedPhone = target.phone.value.trim();
                          const updatedAvatar = target.avatarUrl.value.trim();
                          const updatedFontSize = target.fontSizePreference.value;
                          
                          if (updatedName && firebaseUser) {
                            const newProf = { 
                              ...activeProfile, 
                              name: updatedName, 
                              phone: updatedPhone, 
                              avatar: updatedAvatar,
                              fontSizePreference: updatedFontSize
                            };
                            // update firestore
                            const { doc, setDoc } = await import('firebase/firestore');
                            const { db } = await import('./firebase');
                            await setDoc(doc(db, 'cony_staff_users', firebaseUser.uid), newProf);
                            setProfile(newProf);
                            triggerToast('success', 'Perfil Guardado', 'Tus datos han sido actualizados con éxito.');
                          }

                          if (newPassword && firebaseUser) {
                            try {
                              await updatePassword(firebaseUser, newPassword);
                              triggerToast('success', 'Contraseña Actualizada', 'Tu contraseña ha sido cambiada correctamente.');
                              setNewPassword('');
                            } catch (error) {
                              if (error.code === 'auth/requires-recent-login') {
                                triggerToast('error', 'Seguridad', 'Debes cerrar sesión y volver a iniciarla para cambiar tu contraseña.');
                              } else {
                                triggerToast('error', 'Error', 'No se pudo cambiar la contraseña.');
                              }
                            }
                          }
                        }}
                        className="mt-6 space-y-5"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* FULL NAME */}
                          <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Nombre Completo *</label>
                            <input
                              type="text"
                              name="fullName"
                              defaultValue={activeProfile.name}
                              placeholder="Ej. Doña Cony Especial"
                              className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                              required
                            />
                          </div>

                          {/* PHONE NUMBER */}
                          <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Teléfono de Contacto</label>
                            <input
                              type="text"
                              name="phone"
                              defaultValue={activeProfile.phone}
                              placeholder="Ej. 5512345678"
                              className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                            />
                          </div>

                          {/* EMAIL ADDRESS */}
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-gray-600 mb-1">Correo Electrónico (No modificable)</label>
                            <input
                              type="email"
                              name="email"
                              defaultValue={activeProfile.email}
                              disabled
                              className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-gray-50 text-gray-500 cursor-not-allowed"
                            />
                          </div>
                          
                          {/* FONT SIZE PREFERENCE */}
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-gray-600 mb-1">Tamaño de Letra (a — A)</label>
                            <select
                              name="fontSizePreference"
                              defaultValue={activeProfile.fontSizePreference || 'normal'}
                              className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                            >
                              <option value="normal">Normal (Predeterminado)</option>
                              <option value="large">Grande (Facilita la lectura)</option>
                            </select>
                            <p className="text-[10px] text-gray-500 mt-1">
                              Guarda los cambios para aplicar el nuevo tamaño de letra a toda la aplicación.
                            </p>
                          </div>
                          
                          {/* PASSWORD UPDATE */}
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-gray-600 mb-1">Nueva Contraseña (Opcional)</label>
                            <input
                              type="password"
                              value={newPassword}
                              onChange={e => setNewPassword(e.target.value)}
                              placeholder="Déjalo en blanco si no quieres cambiarla"
                              className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                            />
                          </div>
                        </div>

                        {/* AVATAR OPTION A: UPLOAD FILE FROM PC/MOBILE */}
                        <div className="p-4 bg-amber-50/40 border border-amber-100 rounded-xl space-y-3">
                          <span className="block text-xs font-bold text-amber-950">📸 Opción A: Cargar Foto desde Dispositivo (Móvil / PC)</span>
                          <input 
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const base64String = await resizeImage(file, 200, 200);
                                  const newProf = { ...activeProfile, avatar: base64String };
                                  const { doc, setDoc } = await import('firebase/firestore');
                                  const { db } = await import('./firebase');
                                  await setDoc(doc(db, 'cony_staff_users', firebaseUser.uid), newProf);
                                  setProfile(newProf);
                                  triggerToast('success', 'Foto Actualizada', 'Tu avatar se ha actualizado con la nueva imagen.');
                                } catch (err) {
                                  triggerToast('error', 'Error de Imagen', 'La imagen es demasiado grande o no soportada.');
                                }
                              }
                            }}
                            className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 cursor-pointer"
                          />
                        </div>

                        {/* AVATAR OPTION B: URL INPUT */}
                        <div className="p-4 bg-gray-50/50 border border-gray-200 rounded-xl">
                          <label className="block text-xs font-bold text-gray-600 mb-2">Opción B: URL de Imagen de Avatar</label>
                          <input
                            type="url"
                            name="avatarUrl"
                            id="avatarUrlField"
                            key={activeProfile.avatar}
                            defaultValue={activeProfile.avatar}
                            placeholder="Ej. https://images.unsplash.com/..."
                            className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-colors shadow-sm"
                        >
                          Guardar Cambios de Perfil
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        }
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-150 py-5 text-center mt-auto" id="master-footer">
        <p className="text-[11px] text-gray-500 font-semibold">
          © 2026 ConySuite Global. Todos los derechos reservados.
        </p>
        <p className="text-[10px] text-gray-400 mt-1">
          Desarrollado de manera responsiva para PC, tablets y dispositivos móviles inteligentes.
        </p>
      </footer>

      {/* EDIT DISH MODAL DIALOG (GLOBAL FOR KITCHEN & MENU CONFIG) */}
      {editingDish && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <form
            onSubmit={handleSaveEditDishSubmit}
            className="bg-white rounded-2xl max-w-xl w-full border border-gray-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-fade-in"
          >
            {/* STICKY HEADER */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-150 bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <Edit2 className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="font-serif font-bold text-base text-amber-950 leading-tight">
                    Editar Platillo: {dishForm.name || editingDish.name}
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Modifica el precio, inventario, descripción, foto y opciones.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingDish(null)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SCROLLABLE BODY */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain">
              {/* SECCIÓN DESTACADA: PRECIO Y STOCK */}
              <div className="p-4 bg-gradient-to-br from-amber-50 via-orange-50/50 to-amber-100/40 border-2 border-amber-300 rounded-2xl shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-amber-500 text-white rounded-lg shadow-2xs">
                      <DollarSign className="w-4 h-4" />
                    </span>
                    <div>
                      <h5 className="text-xs font-black text-amber-950 uppercase tracking-wider">Precio de Venta al Público *</h5>
                      <p className="text-[10px] text-amber-900/70">Precio visible en el menú digital y en caja.</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-amber-800 bg-amber-200/80 px-2.5 py-1 rounded-full border border-amber-300 font-mono">
                    ${Number(dishForm.price || 0).toFixed(2)} MXN
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-950 mb-1">
                      Precio en Efectivo / Digital ($ MXN) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-800 font-black text-lg select-none">$</span>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={dishForm.price === 0 ? '' : dishForm.price}
                        onChange={e => setDishForm({...dishForm, price: e.target.value === '' ? 0 : Number(e.target.value)})}
                        placeholder="0.00"
                        required
                        className="w-full pl-8 pr-3 py-2.5 bg-white border-2 border-amber-400 focus:border-amber-600 rounded-xl text-lg font-black text-amber-950 focus:ring-2 focus:ring-amber-200 focus:outline-hidden shadow-xs"
                      />
                    </div>
                    {/* Botones de ajuste rápido */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[10px] text-gray-500 font-semibold">Ajustes:</span>
                      <button
                        type="button"
                        onClick={() => setDishForm({...dishForm, price: Math.max(0, (dishForm.price || 0) - 5)})}
                        className="px-2 py-0.5 bg-white hover:bg-amber-100 border border-amber-300 rounded text-[10px] font-bold text-amber-900 transition-colors cursor-pointer"
                        title="Restar $5"
                      >
                        -$5
                      </button>
                      <button
                        type="button"
                        onClick={() => setDishForm({...dishForm, price: (dishForm.price || 0) + 5})}
                        className="px-2 py-0.5 bg-white hover:bg-amber-100 border border-amber-300 rounded text-[10px] font-bold text-amber-900 transition-colors cursor-pointer"
                        title="Sumar $5"
                      >
                        +$5
                      </button>
                      <button
                        type="button"
                        onClick={() => setDishForm({...dishForm, price: (dishForm.price || 0) + 10})}
                        className="px-2 py-0.5 bg-white hover:bg-amber-100 border border-amber-300 rounded text-[10px] font-bold text-amber-900 transition-colors cursor-pointer"
                        title="Sumar $10"
                      >
                        +$10
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-amber-950 mb-1 flex items-center justify-between">
                      <span>Stock Diario (Porciones) *</span>
                      <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                        {dishForm.stock > 0 ? `${dishForm.stock} disponibles` : 'Agotado'}
                      </span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={dishForm.stock}
                      onChange={e => setDishForm({...dishForm, stock: Math.max(0, Number(e.target.value) || 0)})}
                      required
                      className="w-full p-2.5 bg-white border border-gray-300 focus:border-amber-500 rounded-xl text-base font-bold text-gray-900 focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                    />
                    <p className="text-[10px] text-gray-500 mt-2">Porciones disponibles actualmente en el comal.</p>
                  </div>
                </div>
              </div>
            
              {/* Nombre y Categoría */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre del Platillo *</label>
                  <input
                    type="text"
                    value={dishForm.name}
                    onChange={e => setDishForm({...dishForm, name: e.target.value})}
                    required
                    className="w-full p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-gray-600">Categoría *</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditCustomCategory(!isEditCustomCategory);
                        if (!isEditCustomCategory) {
                          setEditCustomCategoryInput('');
                        }
                      }}
                      className="text-[10px] font-bold text-amber-600 hover:text-amber-800 underline cursor-pointer"
                    >
                      {isEditCustomCategory ? '← Existente' : '+ Personalizar'}
                    </button>
                  </div>

                  {isEditCustomCategory ? (
                    <input
                      type="text"
                      required
                      placeholder="Escribe categoría..."
                      value={editCustomCategoryInput}
                      onChange={e => setEditCustomCategoryInput(e.target.value)}
                      className="w-full p-2 border border-amber-400 bg-amber-50/40 rounded-lg text-xs font-bold text-gray-800 focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                      autoFocus
                    />
                  ) : (
                    <select
                      value={dishForm.category}
                      onChange={e => {
                        if (e.target.value === '__NEW__') {
                          setIsEditCustomCategory(true);
                          setEditCustomCategoryInput('');
                        } else {
                          setDishForm({...dishForm, category: e.target.value});
                        }
                      }}
                      className="w-full p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none bg-white cursor-pointer"
                    >
                      {Array.from(new Set(['Desayunos', 'Antojitos', 'Tortas y Sándwiches', 'Bebidas', 'Para Endulzar el Día', ...foodItems.map(f => f.category)].filter(Boolean))).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="__NEW__" className="font-bold text-amber-600">+ Otra categoría personalizada...</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción del Platillo (Copy Gastronómico) *</label>
                <textarea
                  value={dishForm.description}
                  onChange={e => setDishForm({...dishForm, description: e.target.value})}
                  required
                  rows={2}
                  className="w-full p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            
              {/* Fotografía / Imagen con previsualización */}
              <div className="p-3 bg-amber-50/40 border border-amber-100 rounded-xl space-y-2.5">
                <label className="block text-xs font-bold text-amber-950">Foto del Platillo</label>
                
                <div className="flex items-center gap-3">
                  {dishForm.image && dishForm.image.trim() !== '' ? (
                    <div className="relative group">
                      <img
                        src={dishForm.image}
                        alt="Previsualización"
                        className="w-16 h-16 rounded-xl object-cover border border-amber-200 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setDishForm({...dishForm, image: ''})}
                        className="absolute -top-1.5 -right-1.5 p-1 bg-rose-600 text-white rounded-full shadow-md hover:bg-rose-700 transition-colors"
                        title="Quitar foto (dejar solo texto)"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-16 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 font-black text-base flex items-center justify-center uppercase tracking-wider select-none shadow-sm">
                        {getDishInitials(dishForm.name)}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        <strong className="text-amber-900">Sin foto asignada.</strong>
                        <p>En el menú público solo se mostrará el texto con precio y descripción.</p>
                      </div>
                    </div>
                  )}

                  {dishForm.image && dishForm.image.trim() !== '' && (
                    <button
                      type="button"
                      onClick={() => setDishForm({...dishForm, image: ''})}
                      className="text-xs text-rose-600 hover:text-rose-700 font-bold underline"
                    >
                      Eliminar foto
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <div className="flex-1">
                    <span className="block text-[10px] font-bold text-amber-900 mb-1">📸 Subir / Reemplazar Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const base64String = await resizeImage(file, 400, 400);
                            setDishForm({...dishForm, image: base64String});
                            triggerToast('success', 'Foto Cargada', 'La imagen está lista para guardarse.');
                          } catch (err) {
                            triggerToast('error', 'Error', 'No se pudo leer la imagen.');
                          }
                        }
                      }}
                      className="block w-full text-[10px] text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="block text-[10px] font-bold text-gray-600 mb-1">🔗 O Pegar Enlace (URL)</span>
                    <input
                      type="text"
                      value={dishForm.image || ''}
                      onChange={e => setDishForm({...dishForm, image: e.target.value})}
                      placeholder="Ej. https://images..."
                      className="w-full p-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Opciones y Modificadores */}
              <div className="border border-gray-100 rounded-xl p-3 bg-gray-50/50 space-y-2">
                <span className="block text-xs font-bold text-gray-700">Opciones de Preparación</span>
                {dishForm.options && dishForm.options.length > 0 ? (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {dishForm.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200 text-xs">
                        <div>
                          <strong className="text-amber-950">{opt.title}</strong>
                          <span className="text-[10px] text-gray-500 block">
                            {opt.choices.join(', ')} ({opt.multiselect ? 'Múltiple' : 'Única'})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const next = dishForm.options.filter((_, idx) => idx !== oIdx);
                            setDishForm({...dishForm, options: next});
                          }}
                          className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-400">Sin opciones configuradas.</p>
                )}

                {/* Add Option Subform */}
                <div className="pt-2 border-t border-gray-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Título (Ej. Salsa, Término)"
                    value={newOptionTitle}
                    onChange={e => setNewOptionTitle(e.target.value)}
                    className="p-1.5 bg-white border border-gray-200 rounded text-[11px]"
                  />
                  <input
                    type="text"
                    placeholder="Opciones (Ej. Verde, Roja, Pasilla)"
                    value={newOptionChoices}
                    onChange={e => setNewOptionChoices(e.target.value)}
                    className="p-1.5 bg-white border border-gray-200 rounded text-[11px]"
                  />
                  <div className="sm:col-span-2 flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-[11px] text-gray-600">
                      <input
                        type="checkbox"
                        checked={newOptionMultiselect}
                        onChange={e => setNewOptionMultiselect(e.target.checked)}
                        className="w-3.5 h-3.5 accent-amber-500"
                      />
                      Permitir selección múltiple
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (!newOptionTitle.trim() || !newOptionChoices.trim()) return;
                        const choices = newOptionChoices.split(',').map(c => c.trim()).filter(Boolean);
                        const updated = [...dishForm.options, { title: newOptionTitle.trim(), choices, multiselect: newOptionMultiselect }];
                        setDishForm({...dishForm, options: updated});
                        setNewOptionTitle('');
                        setNewOptionChoices('');
                        setNewOptionMultiselect(false);
                      }}
                      className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded text-[11px] font-bold cursor-pointer"
                    >
                      + Añadir Opción
                    </button>
                  </div>
                </div>
              </div>

              {/* Extras Adicionales */}
              <div className="border border-gray-100 rounded-xl p-3 bg-gray-50/50 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-1 border-b border-gray-200/60">
                  <div className="flex items-center gap-2">
                    <span className="block text-xs font-bold text-gray-700">Extras Adicionales</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      dishForm.extrasMultiselect
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-100 text-amber-900 border-amber-300'
                    }`}>
                      {dishForm.extrasMultiselect ? 'Múltiple' : 'Única'}
                    </span>
                  </div>

                  {/* Selector Múltiple o Única */}
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-gray-200 text-[10px] font-bold self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setDishForm({...dishForm, extrasMultiselect: false})}
                      className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                        !dishForm.extrasMultiselect
                          ? 'bg-amber-500 text-white shadow-2xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Única (Máx. 1)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDishForm({...dishForm, extrasMultiselect: true})}
                      className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                        dishForm.extrasMultiselect
                          ? 'bg-amber-500 text-white shadow-2xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Múltiple (Varios)
                    </button>
                  </div>
                </div>

                {dishForm.extras && dishForm.extras.length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {dishForm.extras.map((ext, eIdx) => (
                      <div key={eIdx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-amber-950 font-medium">{ext.name}</span>
                          <strong className="text-amber-600">+${ext.price}</strong>
                          <span className="text-[9.5px] text-gray-500 font-semibold">
                            ({dishForm.extrasMultiselect ? 'Múltiple' : 'Única'})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const next = dishForm.extras.filter((_, idx) => idx !== eIdx);
                            setDishForm({...dishForm, extras: next});
                          }}
                          className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-400">Sin extras configurados.</p>
                )}

                {/* Add Extra Subform */}
                <div className="pt-2 border-t border-gray-200/60 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Nombre (Ej. Pollo extra)"
                      value={newExtraName}
                      onChange={e => setNewExtraName(e.target.value)}
                      className="flex-1 p-1.5 bg-white border border-gray-200 rounded text-[11px]"
                    />
                    <input
                      type="number"
                      placeholder="$ MXN"
                      value={newExtraPrice}
                      onChange={e => setNewExtraPrice(Number(e.target.value))}
                      className="w-20 p-1.5 bg-white border border-gray-200 rounded text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newExtraName.trim()) return;
                        const updated = [...dishForm.extras, { name: newExtraName.trim(), price: Number(newExtraPrice) || 0 }];
                        setDishForm({...dishForm, extras: updated});
                        setNewExtraName('');
                        setNewExtraPrice(15);
                      }}
                      className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded text-[11px] font-bold shrink-0 cursor-pointer"
                    >
                      + Añadir Extra
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-600">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={dishForm.extrasMultiselect}
                        onChange={e => setDishForm({...dishForm, extrasMultiselect: e.target.checked})}
                        className="w-3.5 h-3.5 accent-amber-500 rounded"
                      />
                      <span>Permitir selección múltiple de extras</span>
                    </label>
                    <span className="text-[10px] text-gray-500 italic">
                      {dishForm.extrasMultiselect ? 'Comensal puede elegir varios' : 'Comensal solo puede elegir 1'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Opción de Visibilidad: Ocultar del Menú Comensal */}
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className={`p-2 rounded-lg ${dishForm.hidden ? 'bg-amber-200/80 text-amber-900' : 'bg-emerald-100 text-emerald-800'}`}>
                    {dishForm.hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">
                      Ocultar platillo del menú para comensales
                    </span>
                    <p className="text-[10px] text-gray-500">
                      {dishForm.hidden
                        ? 'Oculto: Los comensales NO verán este platillo en el menú digital (solo cocina y caja).'
                        : 'Visible: Los clientes pueden consultar y pedir este platillo en el menú digital.'}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={Boolean(dishForm.hidden)}
                    onChange={e => setDishForm({...dishForm, hidden: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>
            </div>

            {/* STICKY FOOTER */}
            <div className="px-5 sm:px-6 py-3.5 border-t border-gray-150 bg-gray-50 flex items-center justify-between gap-3 shrink-0 rounded-b-2xl">
              <div className="text-xs text-gray-600">
                <span>Precio a guardar: </span>
                <strong className="text-amber-700 font-black text-sm">${Number(dishForm.price || 0).toFixed(2)} MXN</strong>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDish(null)}
                  className="px-3.5 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Guardar Todos los Cambios
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* TOAST SYSTEM CONTAINER */}
      <CommonToast toast={activeToast} onClose={() => setActiveToast(null)} />
    </div>
  );
}
