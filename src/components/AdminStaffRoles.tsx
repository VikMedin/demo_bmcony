import React, { useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  UserCheck, 
  Clock, 
  Sparkles, 
  Utensils, 
  Coins, 
  Tag, 
  BookOpen, 
  Play, 
  CheckCircle2, 
  AlertTriangle,
  Mail,
  UserPlus
} from 'lucide-react';
import { StaffUser, StaffRole } from '../types';

interface AdminStaffRolesProps {
  staffUsers: StaffUser[];
  onUpdateRole: (userId: string, newRole: StaffRole) => void;
  onDeleteStaffUser: (userId: string) => void;
  onAddStaffUser: (user: Omit<StaffUser, 'id'>) => void;
  onSwitchDemoRole: (role: StaffRole) => void;
  currentRole: StaffRole;
  triggerToast: (type: 'success' | 'error' | 'info', title: string, description?: string) => void;
  addAuditLog: (actionText: string) => void;
}

export const AdminStaffRoles: React.FC<AdminStaffRolesProps> = ({
  staffUsers,
  onUpdateRole,
  onDeleteStaffUser,
  onAddStaffUser,
  onSwitchDemoRole,
  currentRole,
  triggerToast,
  addAuditLog
}) => {
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<StaffRole>('cocina');
  const [newIsDemo, setNewIsDemo] = useState(true);
  const [newNotes, setNewNotes] = useState('');

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const pendingUsers = staffUsers.filter(u => u.role === 'esperando');
  const activeUsers = staffUsers.filter(u => u.role !== 'esperando');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      triggerToast('error', 'Campos Requeridos', 'Por favor ingresa nombre y correo.');
      return;
    }

    const emailTrim = newEmail.trim().toLowerCase();
    if (staffUsers.some(u => u.email.toLowerCase() === emailTrim)) {
      triggerToast('error', 'Usuario Existente', 'Ya existe un usuario con este correo electrónico.');
      return;
    }

    onAddStaffUser({
      name: newName.trim(),
      email: emailTrim,
      phone: newPhone.trim(),
      role: newRole,
      isDemo: newIsDemo,
      notes: newNotes.trim(),
      createdAt: new Date().toISOString()
    });

    addAuditLog?.(`Registró al colaborador ${newName.trim()} (${emailTrim}) con rol ${newRole}.`);
    triggerToast('success', 'Colaborador Registrado', `Se guardó a ${newName.trim()} con rol ${getRoleLabel(newRole)}.`);
    
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewRole('cocina');
    setNewNotes('');
    setIsAddingUser(false);
  };

  const getRoleLabel = (role: StaffRole) => {
    switch (role) {
      case 'superadmin':
        return '👑 Superusuario (Dueño)';
      case 'cocina':
        return '🍳 Cocina';
      case 'admin':
        return '📋 Administrativo';
      case 'repartidor':
      case 'mensajero':
        return '🛵 Repartidor';
      case 'esperando':
        return '⏳ Pendiente de Autorización';
      default:
        return role;
    }
  };

  const getRoleBadgeClasses = (role: StaffRole) => {
    switch (role) {
      case 'superadmin':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold';
      case 'cocina':
        return 'bg-orange-100 text-orange-900 border-orange-300 font-bold';
      case 'admin':
        return 'bg-blue-100 text-blue-900 border-blue-300 font-bold';
      case 'repartidor':
      case 'mensajero':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold';
      case 'esperando':
        return 'bg-yellow-100 text-yellow-900 border-yellow-300 font-bold animate-pulse';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-6" id="admin-staff-roles-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif font-bold text-lg text-amber-950 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-600" />
              Control de Roles del Personal
            </h3>
            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
              👑 Exclusivo Dueño (vmedin@gmail.com)
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Supervisa accesos, asigna roles de negocio y autoriza nuevos colaboradores autenticados por Google o contraseña.
          </p>
        </div>

        <button
          onClick={() => setIsAddingUser(!isAddingUser)}
          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          {isAddingUser ? 'Cancelar' : <><UserPlus className="w-3.5 h-3.5" /> + Registrar Personal</>}
        </button>
      </div>

      {/* Permission Matrix Guide Card */}
      <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200/70 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5 uppercase tracking-wide">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            Matriz Oficial de Permisos por Rol
          </span>
          <span className="text-[10px] text-gray-500">Configurado según directivas de negocio</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 bg-white rounded-lg border border-amber-100 flex items-start gap-2">
            <span className="text-base leading-none">👑</span>
            <div>
              <strong className="text-amber-950 font-bold block">Superusuario (Dueño / vmedin@gmail.com):</strong>
              <p className="text-[11px] text-gray-600">
                Tiene <strong>todo el control de roles del personal</strong> y acceso total a todas las áreas operativas, financieras y de configuración.
              </p>
            </div>
          </div>

          <div className="p-2.5 bg-white rounded-lg border border-amber-100 flex items-start gap-2">
            <span className="text-base leading-none">🍳</span>
            <div>
              <strong className="text-amber-950 font-bold block">Cocina:</strong>
              <p className="text-[11px] text-gray-600">
                Solo acceso a <strong>Cocina / Kanban</strong>, <strong>Menú y Platillos</strong> y <strong>Carta Digital</strong> para apoyo del comensal.
              </p>
            </div>
          </div>

          <div className="p-2.5 bg-white rounded-lg border border-amber-100 flex items-start gap-2">
            <span className="text-base leading-none">📋</span>
            <div>
              <strong className="text-amber-950 font-bold block">Administrativo:</strong>
              <p className="text-[11px] text-gray-600">
                Solo acceso a <strong>Cocina / Kanban</strong>, <strong>Caja chica y POS</strong>, <strong>Clientes Estrella CRM</strong>, <strong>Cupones y Descuentos</strong>, <strong>Menú y Platillos</strong> y <strong>Carta Digital</strong>.
              </p>
            </div>
          </div>

          <div className="p-2.5 bg-white rounded-lg border border-amber-100 flex items-start gap-2">
            <span className="text-base leading-none">🛵</span>
            <div>
              <strong className="text-amber-950 font-bold block">Repartidor:</strong>
              <p className="text-[11px] text-gray-600">
                Solo acceso a <strong>Vista Repartidor</strong> y <strong>Carta Digital</strong> para apoyo del comensal.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Subform */}
      {isAddingUser && (
        <form onSubmit={handleCreateSubmit} className="p-4 bg-amber-50/80 border border-amber-300 rounded-xl space-y-3 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-amber-200">
            <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-amber-700" />
              Alta de Nuevo Colaborador o Cuenta Demo
            </h4>
            <span className="text-[10px] text-amber-800 font-semibold">Configuración de Acceso</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre Completo *</label>
              <input
                type="text"
                required
                placeholder="Ej. Chef Manuel, Sandra Cajera"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Correo Electrónico (Google o Corporativo) *</label>
              <input
                type="email"
                required
                placeholder="ejemplo@gmail.com"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Rol Asignado *</label>
              <select
                value={newRole}
                onChange={e => setNewRole(e.target.value as StaffRole)}
                className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
              >
                <option value="cocina">🍳 Cocina</option>
                <option value="admin">📋 Administrativo</option>
                <option value="repartidor">🛵 Repartidor</option>
                <option value="superadmin">👑 Superusuario (Dueño)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Teléfono Móvil (WhatsApp)</label>
              <input
                type="tel"
                placeholder="5512345678"
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Tipo de Cuenta</label>
              <select
                value={newIsDemo ? 'demo' : 'auth'}
                onChange={e => setNewIsDemo(e.target.value === 'demo')}
                className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
              >
                <option value="demo">🧪 Usuario Demo (Prueba Rápida)</option>
                <option value="auth">🔐 Autenticado Oficial (Google/Clave)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Notas u Observaciones</label>
            <input
              type="text"
              placeholder="Ej. Turno matutino, encargado de estación de chilaquiles"
              value={newNotes}
              onChange={e => setNewNotes(e.target.value)}
              className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-amber-200/70">
            <button
              type="button"
              onClick={() => setIsAddingUser(false)}
              className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Guardar y Autorizar
            </button>
          </div>
        </form>
      )}

      {/* Pending Approval Section */}
      {pendingUsers.length > 0 && (
        <div className="p-4 bg-amber-100/70 border-2 border-amber-400 rounded-xl space-y-3 animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-amber-950">
                ⚠️ {pendingUsers.length} Colaborador(es) Registrado(s) Pendiente(s) de Autorización
              </h4>
              <p className="text-[11px] text-amber-900">
                Se han registrado mediante Google o correo y requieren que el Dueño les asigne su rol de acceso.
              </p>
            </div>
          </div>

          <div className="divide-y divide-amber-200">
            {pendingUsers.map(user => (
              <div key={user.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <span className="font-bold text-xs text-amber-950">{user.name}</span>
                  <span className="text-[11px] text-gray-600 block">{user.email}</span>
                </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-gray-500 font-bold mr-1">Autorizar como:</span>
                  <button
                    onClick={() => {
                      onUpdateRole(user.id, 'cocina');
                      addAuditLog?.(`Autorizó al colaborador ${user.name} como Cocina.`);
                      triggerToast('success', 'Colaborador Autorizado', `${user.name} ahora tiene rol de Cocina.`);
                    }}
                    className="px-2.5 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-[10px] font-bold shadow-2xs"
                  >
                    🍳 Cocina
                  </button>
                  <button
                    onClick={() => {
                      onUpdateRole(user.id, 'admin');
                      addAuditLog?.(`Autorizó al colaborador ${user.name} como Administrativo.`);
                      triggerToast('success', 'Colaborador Autorizado', `${user.name} ahora tiene rol de Administrativo.`);
                    }}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold shadow-2xs"
                  >
                    📋 Administrativo
                  </button>
                  <button
                    onClick={() => {
                      onUpdateRole(user.id, 'repartidor');
                      addAuditLog?.(`Autorizó al colaborador ${user.name} como Repartidor.`);
                      triggerToast('success', 'Colaborador Autorizado', `${user.name} ahora tiene rol de Repartidor.`);
                    }}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-2xs"
                  >
                    🛵 Repartidor
                  </button>
                  <button
                    onClick={() => onDeleteStaffUser(user.id)}
                    className="p-1 text-gray-400 hover:text-rose-600 rounded-md"
                    title="Rechazar / Eliminar Registro"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Users & Demos List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
            Colaboradores y Cuentas de Acceso ({staffUsers.length})
          </span>
          <span className="text-[10px] text-gray-400">
            Los roles se sincronizan en tiempo real
          </span>
        </div>

        <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
          {staffUsers.map(user => {
            const isOwner = user.email.toLowerCase() === 'vmedin@gmail.com';
            return (
              <div 
                key={user.id} 
                className="p-3.5 hover:bg-amber-50/20 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                {/* User Info */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 font-black text-sm flex items-center justify-center shrink-0 shadow-2xs uppercase">
                    {user.name ? user.name.substring(0, 2) : 'US'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-xs text-amber-950">{user.name}</h4>
                      {isOwner && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 border border-amber-300">
                          👑 Dueño Principal
                        </span>
                      )}
                      <span className={`text-[9px] px-1.5 py-0.2 rounded border ${
                        user.isDemo 
                          ? 'bg-amber-50 text-amber-800 border-amber-200' 
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}>
                        {user.isDemo ? '🧪 Cuenta Demo' : '🔐 Autenticado'}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                      <Mail className="w-3 h-3 text-gray-400" />
                      {user.email}
                      {user.phone && <span className="text-gray-400">• Tel: {user.phone}</span>}
                    </p>
                    {user.notes && (
                      <p className="text-[10px] text-gray-400 italic mt-0.5">{user.notes}</p>
                    )}
                  </div>
                </div>

                {/* Role Selector & Quick Actions */}
                <div className="flex items-center gap-2 flex-wrap self-end md:self-center">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-gray-500 hidden sm:inline">Rol:</span>
                    <select
                      value={user.role}
                      disabled={isOwner}
                      onChange={(e) => {
                        const nextRole = e.target.value as StaffRole;
                        onUpdateRole(user.id, nextRole);
                        addAuditLog?.(`Modificó el rol de ${user.name} a ${getRoleLabel(nextRole)}.`);
                        triggerToast('success', 'Rol Actualizado', `${user.name} ahora tiene rol: ${getRoleLabel(nextRole)}`);
                      }}
                      className={`text-xs py-1 px-2.5 rounded-lg border focus:ring-1 focus:ring-amber-500 focus:outline-hidden font-bold cursor-pointer disabled:opacity-80 disabled:cursor-not-allowed ${getRoleBadgeClasses(user.role)}`}
                    >
                      <option value="superadmin">👑 Superusuario (Dueño)</option>
                      <option value="cocina">🍳 Cocina</option>
                      <option value="admin">📋 Administrativo</option>
                      <option value="repartidor">🛵 Repartidor</option>
                      <option value="esperando">⏳ Pendiente</option>
                    </select>
                  </div>

                  {/* 1-Click Test Role Button */}
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchDemoRole(user.role);
                      triggerToast('info', 'Probando Vista', `Cambiando a vista de prueba como: ${getRoleLabel(user.role)}`);
                    }}
                    className="px-2.5 py-1 text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg flex items-center gap-1 transition-colors"
                    title={`Probar la interfaz inmediatamente con el rol de ${user.name}`}
                  >
                    <Play className="w-2.5 h-2.5 text-amber-700" />
                    <span>Probar Vista</span>
                  </button>

                  {/* Delete / Revoke (Cannot delete owner) */}
                  {!isOwner && (
                    confirmDeleteId === user.id ? (
                      <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 p-1 rounded-lg animate-fade-in">
                        <span className="text-[9px] text-rose-800 font-bold px-1">¿Quitar?</span>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteStaffUser(user.id);
                            addAuditLog?.(`Removió al colaborador ${user.name} (${user.email}).`);
                            triggerToast('info', 'Colaborador Removido', `Se revocó el acceso a ${user.name}.`);
                            setConfirmDeleteId(null);
                          }}
                          className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[9px] font-bold"
                        >
                          Sí
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-1.5 py-0.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-[9px] font-bold"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(user.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Remover Acceso"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Helpful Instructions Box */}
      <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
        <p className="font-bold flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          ¿Cómo agregar personal nuevo y pasar de Demo a Autenticado?
        </p>
        <p className="text-[11px] text-blue-800 leading-relaxed">
          Pide a tu colaborador que haga clic en <strong>"Panel de Negocio"</strong>, y elija <strong>"Continuar con Google"</strong> o <strong>"Registrarme"</strong>. Una vez creada su cuenta, aparecerá automáticamente aquí arriba con estatus <em>"Pendiente de Autorización"</em> para que con un solo clic le concedas su rol oficial (Cocina, Administrativo o Repartidor).
        </p>
      </div>
    </div>
  );
};
