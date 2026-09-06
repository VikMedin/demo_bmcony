const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  /useEffect\(\(\) => \{\n    if \(userRole === 'mensajero'\) \{\n      setAdminTab\('repartidor'\);\n    \} else if \(userRole !== 'publico' && adminTab === 'repartidor'\) \{\n      setAdminTab\('dashboard'\);\n    \}\n  \}, \[userRole\]\);/g,
  `useEffect(() => {
    if (userRole === 'esperando') {
      setAdminTab('perfil');
    } else if (userRole === 'mensajero') {
      setAdminTab('repartidor');
    } else if (userRole !== 'publico' && adminTab === 'repartidor') {
      setAdminTab('dashboard');
    }
  }, [userRole]);`
);

fs.writeFileSync('src/App.tsx', code);
