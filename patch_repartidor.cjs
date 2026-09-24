const fs = require('fs');
let content = fs.readFileSync('src/components/AdminRepartidor.tsx', 'utf8');

const regex = /<p className="font-bold text-amber-950 text-sm">\$\{order\.total\.toFixed\(2\)\} MXN<\/p>/g;
const replacement = `<p className="font-bold text-amber-950 text-sm whitespace-nowrap">\${order.total.toFixed(2)} MXN</p>`;

content = content.replace(regex, replacement);
content = content.replace(/<span className="text-\[10px\] px-2 py-0\.5 bg-gray-200 text-gray-700 font-bold rounded">/g, '<span className="text-[10px] px-2 py-0.5 bg-gray-200 text-gray-700 font-bold rounded shrink-0 ml-2 text-right">');

fs.writeFileSync('src/components/AdminRepartidor.tsx', content);
