const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  /src=\{userProfiles\[userRole as 'superadmin' \| 'admin' \| 'mensajero'\]\?\.avatar\}/g,
  `src={profile?.avatar || ''}`
);

code = code.replace(
  /\{userRole === 'superadmin' \? '👑 Super Admin' : userRole === 'admin' \? '🍳 Administrativo' : '🛵 Mensajero'\}/,
  `{userRole === 'superadmin' ? '👑 Super Admin' : userRole === 'admin' ? '🍳 Administrativo' : userRole === 'mensajero' ? '🛵 Mensajero' : '⏳ Pendiente'}`
);

fs.writeFileSync('src/App.tsx', code);
