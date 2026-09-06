const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  /const \[userRole, setUserRole\].*\n  const \[adminTab, setAdminTab\].*\n  const \[isLoggingIn, setIsLoggingIn\].*/g,
  `const { firebaseUser, profile, setProfile, loading: authLoading } = useFirebaseAuth();
  const userRole = profile?.role || 'publico';
  const [adminTab, setAdminTab] = useState<'dashboard' | 'kitchen' | 'caja' | 'clientes' | 'repartidor' | 'config' | 'perfil'>('dashboard');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState('');`
);

fs.writeFileSync('src/App.tsx', code);
