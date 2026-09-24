import React, { useState } from 'react';
import { ShieldCheck, User, Lock, ArrowRight, UserPlus, KeyRound, Utensils, Coins, Tag, BookOpen, Clock, Users } from 'lucide-react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { StaffRole } from '../types';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  triggerToast: (type: 'success' | 'error' | 'info', title: string, description?: string) => void;
  onSelectDemoRole?: (role: StaffRole) => void;
  onCancel?: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ 
  onLoginSuccess, 
  triggerToast, 
  onSelectDemoRole,
  onCancel 
}) => {
  const [activeTab, setActiveTab] = useState<'demo' | 'auth'>('demo');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const isOwner = user.email?.toLowerCase() === 'vmedin@gmail.com';

      // Check or create profile in cony_staff_users
      try {
        const docRef = doc(db, 'cony_staff_users', user.uid);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          await setDoc(docRef, {
            id: user.uid,
            email: user.email || '',
            name: user.displayName || user.email?.split('@')[0] || 'Personal Cony',
            phone: '',
            role: isOwner ? 'superadmin' : 'esperando',
            avatar: user.photoURL || '',
            isDemo: false,
            createdAt: new Date().toISOString()
          });
        } else if (isOwner && docSnap.data().role !== 'superadmin') {
          await updateDoc(docRef, { role: 'superadmin' });
        }
      } catch (profileErr) {
        console.warn('Could not write profile during Google auth:', profileErr);
      }

      triggerToast('success', 'Bienvenido', `Sesión iniciada como ${user.displayName || user.email}`);
      onLoginSuccess();
    } catch (error: any) {
      console.error('Google Auth Error:', error);
      let errorMsg = error.message || 'Error al autenticar con Google.';
      if (error.code === 'auth/popup-closed-by-user') {
        errorMsg = 'Ventana de inicio cerrada antes de completar.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMsg = 'El navegador bloqueó la ventana emergente. Por favor permítela.';
      }
      triggerToast('error', 'Error de Autenticación', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      triggerToast('error', 'Requerido', 'Por favor ingresa un correo electrónico.');
      return;
    }

    setIsLoading(true);
    try {
      const isOwner = email.trim().toLowerCase() === 'vmedin@gmail.com';

      if (mode === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;

        // If it is the owner, ensure superadmin role
        if (isOwner) {
          try {
            const docRef = doc(db, 'cony_staff_users', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && docSnap.data().role !== 'superadmin') {
              await updateDoc(docRef, { role: 'superadmin' });
            } else if (!docSnap.exists()) {
              await setDoc(docRef, {
                id: user.uid,
                email: user.email,
                name: 'Doña Cony (Propietario)',
                phone: '',
                role: 'superadmin',
                avatar: '',
                isDemo: false,
                createdAt: new Date().toISOString()
              });
            }
          } catch (e) {
            console.warn('Could not update role in Firestore:', e);
          }
        }

        triggerToast('success', 'Bienvenido', 'Has iniciado sesión exitosamente.');
        onLoginSuccess();
      } else if (mode === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;
        const role = isOwner ? 'superadmin' : 'esperando';

        try {
          await setDoc(doc(db, 'cony_staff_users', user.uid), {
            id: user.uid,
            email: email.trim(),
            name: email.split('@')[0],
            phone: '',
            role: role,
            avatar: '',
            isDemo: false,
            createdAt: new Date().toISOString()
          });
        } catch (dbErr) {
          console.warn('Could not save initial profile doc:', dbErr);
        }

        triggerToast(
          'success', 
          'Cuenta Creada', 
          `Registro exitoso. ${role === 'esperando' ? 'Tu cuenta está en espera de aprobación por el Administrador (vmedin@gmail.com).' : '¡Bienvenido SuperAdministrador!'}`
        );
        onLoginSuccess();
      } else if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, email.trim());
        triggerToast('success', 'Correo Enviado', 'Revisa tu bandeja de entrada para restablecer tu contraseña.');
        setMode('login');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      let errorMsg = 'Revisa tus datos e intenta de nuevo.';
      if (error.code === 'auth/operation-not-allowed') {
        errorMsg = 'El método de correo/contraseña no está activo en Firebase. Por favor usa el botón "Continuar con Google" de arriba para ingresar.';
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        errorMsg = 'Contraseña o correo incorrectos.';
      } else if (error.code === 'auth/user-not-found') {
        errorMsg = 'No existe cuenta registrada con este correo. Haz clic en "Registrarme".';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMsg = 'Este correo ya está registrado. Si ya tienes cuenta, cambia a "Iniciar Sesión".';
      } else if (error.code === 'auth/weak-password') {
        errorMsg = 'La contraseña debe tener al menos 6 caracteres.';
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      triggerToast('error', 'Error de Autenticación', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-8" id="admin-login-view">
      <div className="bg-white border border-gray-200 shadow-2xl rounded-2xl max-w-lg w-full p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500" />
        
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-amber-50 text-amber-600 mb-2">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-amber-950">
            Acceso al Sistema Cony
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Plataforma de gestión de operaciones, cocina, caja y pedidos.
          </p>
        </div>

        {/* Tab Toggle: Demo vs Auth */}
        <div className="flex p-1 bg-amber-50/80 rounded-xl border border-amber-200 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('demo')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'demo'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-amber-900 hover:text-amber-950'
            }`}
          >
            <span>🧪 Usuarios Demo (1 Clic)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('auth')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'auth'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-amber-900 hover:text-amber-950'
            }`}
          >
            <span>🔐 Google / Contraseña</span>
          </button>
        </div>

        {/* TAB 1: DEMO USERS (1-CLICK DIRECT ENTRY) */}
        {activeTab === 'demo' && (
          <div className="space-y-3 animate-fade-in">
            <p className="text-[11px] text-gray-500 text-center mb-2">
              Ingresa de inmediato con uno de los perfiles demo autorizados para probar los permisos de cada área:
            </p>

            {/* Super Admin / Owner */}
            <button
              type="button"
              onClick={() => {
                if (onSelectDemoRole) onSelectDemoRole('superadmin');
              }}
              className="w-full text-left p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 hover:bg-amber-100/60 hover:border-amber-300 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-200/80 text-amber-950 font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                  👑
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-amber-950">Superusuario (Dueño)</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-200 text-amber-900">
                      vmedin@gmail.com
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    <strong>Control total de roles del personal</strong> y acceso a todos los módulos.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-700 group-hover:translate-x-1 transition-transform">
                Entrar →
              </span>
            </button>

            {/* Cocina */}
            <button
              type="button"
              onClick={() => {
                if (onSelectDemoRole) onSelectDemoRole('cocina');
              }}
              className="w-full text-left p-3.5 rounded-xl border border-orange-200 bg-orange-50/40 hover:bg-orange-100/60 hover:border-orange-300 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-200/80 text-orange-950 font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                  🍳
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-orange-950">Cocina</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-orange-200 text-orange-900">
                      cocina@desayunador.com
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    Solo <strong>Cocina / Kanban</strong>, <strong>Menú y Platillos</strong> y <strong>Carta Digital</strong>.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-orange-700 group-hover:translate-x-1 transition-transform">
                Entrar →
              </span>
            </button>

            {/* Administrativo */}
            <button
              type="button"
              onClick={() => {
                if (onSelectDemoRole) onSelectDemoRole('admin');
              }}
              className="w-full text-left p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 hover:bg-blue-100/60 hover:border-blue-300 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-200/80 text-blue-950 font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                  📋
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-blue-950">Administrativo</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-200 text-blue-900">
                      carlos.admin@desayunador.com
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    Cocina, <strong>Caja y POS</strong>, <strong>Clientes CRM</strong>, <strong>Cupones</strong>, <strong>Menú</strong> y <strong>Carta</strong>.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-blue-700 group-hover:translate-x-1 transition-transform">
                Entrar →
              </span>
            </button>

            {/* Repartidor */}
            <button
              type="button"
              onClick={() => {
                if (onSelectDemoRole) onSelectDemoRole('repartidor');
              }}
              className="w-full text-left p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-100/60 hover:border-emerald-300 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-200/80 text-emerald-950 font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                  🛵
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-emerald-950">Repartidor</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-900">
                      reparto@desayunador.com
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    Solo <strong>Vista Repartidor</strong> y <strong>Carta Digital</strong>.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition-transform">
                Entrar →
              </span>
            </button>
          </div>
        )}

        {/* TAB 2: AUTHENTICATED ACCESS (GOOGLE / EMAIL) */}
        {activeTab === 'auth' && (
          <div className="space-y-4 animate-fade-in">
            {/* GOOGLE SIGN IN BUTTON */}
            <div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-3 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                id="google-signin-btn"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continuar con Google</span>
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-400 text-[10px] font-semibold">o ingresar con correo</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Correo Electrónico</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    placeholder="tu-correo@ejemplo.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>
              
              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-gray-600">Contraseña</label>
                    {mode === 'login' && (
                      <button 
                        type="button" 
                        onClick={() => setMode('forgot')}
                        className="text-[11px] text-amber-600 hover:text-amber-800 font-semibold"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <span>
                      {mode === 'login' ? 'Iniciar Sesión' : mode === 'register' ? 'Crear mi Cuenta' : 'Enviar Enlace'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center text-xs text-gray-500 flex items-center justify-center gap-1">
                {mode === 'login' ? (
                  <>
                    <span>¿Eres nuevo personal?</span>
                    <button 
                      type="button" 
                      onClick={() => setMode('register')}
                      className="text-amber-600 font-bold hover:underline"
                    >
                      Registrarme
                    </button>
                  </>
                ) : (
                  <>
                    <span>¿Ya tienes cuenta?</span>
                    <button 
                      type="button" 
                      onClick={() => setMode('login')}
                      className="text-amber-600 font-bold hover:underline"
                    >
                      Iniciar Sesión
                    </button>
                  </>
                )}
              </div>
            </form>

            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-[11px] text-blue-800 space-y-1">
              <strong>💡 Nota de Autorización:</strong> El correo <strong>vmedin@gmail.com</strong> tiene asignado automáticamente el rol de Dueño (Superusuario). Los demás colaboradores quedan pendientes de asignación por el Dueño en la sección de Ajustes del Negocio.
            </div>
          </div>
        )}

        {/* Cancel button */}
        {onCancel && (
          <div className="mt-5 pt-4 border-t border-gray-100 text-center">
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-gray-500 hover:text-gray-800 font-semibold underline"
            >
              Volver a la Carta Digital (Comensal)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
