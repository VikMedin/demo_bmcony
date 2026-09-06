import React, { useState } from 'react';
import { ShieldCheck, User, Lock, ArrowRight, UserPlus, KeyRound } from 'lucide-react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  triggerToast: (type: 'success' | 'error' | 'info', title: string, description?: string) => void;
  onCancel?: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, triggerToast, onCancel }) => {
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

      // Check or create profile
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
            createdAt: new Date().toISOString()
          });
        } catch (dbErr) {
          console.warn('Could not save initial profile doc:', dbErr);
        }

        triggerToast(
          'success', 
          'Cuenta Creada', 
          `Registro exitoso. ${role === 'esperando' ? 'Tu cuenta está en espera de aprobación por el Administrador.' : '¡Bienvenido SuperAdministrador!'}`
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
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4" id="admin-login-view">
      <div className="bg-white border border-gray-200 shadow-xl rounded-2xl max-w-md w-full p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500" />
        
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-amber-50 text-amber-600 mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-amber-950">
            {mode === 'login' ? 'Panel de Control' : mode === 'register' ? 'Crear Cuenta' : 'Recuperar Acceso'}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {mode === 'login' ? 'Ingresa con tu cuenta para administrar Desayunos Cony.' : 
             mode === 'register' ? 'Regístrate para obtener acceso al sistema del desayunador.' : 
             'Te enviaremos un enlace para cambiar tu contraseña.'}
          </p>
        </div>

        {/* GOOGLE SIGN IN BUTTON */}
        <div className="mb-5">
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
              <label className="block text-xs font-semibold text-gray-600 mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
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
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm mt-2 cursor-pointer"
          >
            {isLoading ? 'Procesando...' : (
              <>
                {mode === 'login' ? 'Validar Acceso' : mode === 'register' ? 'Registrarme' : 'Enviar Enlace'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-2.5">
          {mode === 'login' && (
            <>
              <button type="button" onClick={() => setMode('register')} className="text-xs text-amber-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer">
                <UserPlus className="w-3.5 h-3.5" /> No tengo cuenta, registrarme
              </button>
              <button type="button" onClick={() => setMode('forgot')} className="text-xs text-gray-500 hover:underline flex items-center gap-1 cursor-pointer">
                <KeyRound className="w-3.5 h-3.5" /> Olvidé mi contraseña
              </button>
            </>
          )}
          {mode !== 'login' && (
            <button type="button" onClick={() => setMode('login')} className="text-xs text-amber-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer">
              <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Volver a Iniciar Sesión
            </button>
          )}
        </div>

        {onCancel && (
          <div className="mt-5 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-gray-200 cursor-pointer"
            >
              Volver a la Carta Pública
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
