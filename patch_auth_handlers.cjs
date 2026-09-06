const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  /const handleLoginSuccess = \(role: 'superadmin' \| 'admin' \| 'mensajero'\) => {[\s\S]*?};\n\n  const handleLogout = \(\) => {[\s\S]*?};/g,
  `const handleLoginSuccess = () => {
    setIsLoggingIn(false);
    // Auto-switch done by useEffect
  };

  const handleLogout = async () => {
    await signOut(auth);
    addAuditLog(\`Cerró sesión administrativa.\`);
    setIsLoggingIn(false);
    triggerToast('info', 'Sesión Finalizada', 'Has salido del panel administrativo.');
  };`
);

fs.writeFileSync('src/App.tsx', code);
