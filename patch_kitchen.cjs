const fs = require('fs');
let content = fs.readFileSync('src/components/AdminKitchen.tsx', 'utf8');

const regex = /<td className="p-4 font-bold text-amber-600">\$\{item\.price\.toFixed\(2\)\} MXN<\/td>/g;
const replacement = `<td className="p-4 font-bold text-amber-600 whitespace-nowrap">\${item.price.toFixed(2)} MXN</td>`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/components/AdminKitchen.tsx', content);
