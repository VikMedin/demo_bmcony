const fs = require('fs');
let content = fs.readFileSync('src/components/AdminClientes.tsx', 'utf8');

const regex = /<td className="p-4 font-bold text-emerald-600">\$\{client\.totalSpent\.toFixed\(2\)\} MXN<\/td>/g;
const replacement = `<td className="p-4 font-bold text-emerald-600 whitespace-nowrap">\${client.totalSpent.toFixed(2)} MXN</td>`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/components/AdminClientes.tsx', content);
