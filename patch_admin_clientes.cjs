const fs = require('fs');
let content = fs.readFileSync('src/components/AdminClientes.tsx', 'utf8');

// Add whitespace-nowrap to all th
content = content.replace(/<th className="p-4">/g, '<th className="p-4 whitespace-nowrap">');
content = content.replace(/<th className="p-4 text-center">/g, '<th className="p-4 text-center whitespace-nowrap">');
content = content.replace(/<th className="p-4 text-right">/g, '<th className="p-4 text-right whitespace-nowrap">');

// Add whitespace-nowrap to td
content = content.replace(/<td className="p-4 font-bold text-amber-950 flex items-center gap-2">/g, '<td className="p-4 font-bold text-amber-950 flex items-center gap-2 whitespace-nowrap">');
content = content.replace(/<td className="p-4 font-medium text-gray-600">/g, '<td className="p-4 font-medium text-gray-600 whitespace-nowrap">');
content = content.replace(/<td className="p-4 max-w-xs truncate text-gray-500 font-medium">/g, '<td className="p-4 max-w-xs truncate text-gray-500 font-medium whitespace-nowrap">');
content = content.replace(/<td className="p-4">\{getTierBadge\(client\.tier\)\}<\/td>/g, '<td className="p-4 whitespace-nowrap">{getTierBadge(client.tier)}</td>');
content = content.replace(/<td className="p-4 text-right">/g, '<td className="p-4 text-right whitespace-nowrap">');

// Fix buttons layout wrapper
content = content.replace(/<div className="flex items-center gap-2\.5">/g, '<div className="flex flex-wrap items-center gap-2.5">');

// Prevent button text from wrapping
content = content.replace(/<button\n            onClick=\{handleExportCSV\}\n            className="px-3\.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold inline-flex items-center gap-1\.5"\n          >/g, '<button\n            onClick={handleExportCSV}\n            className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"\n          >');

content = content.replace(/<button\n            onClick=\{const fs = window\.print\}\n            className="px-3\.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1\.5"\n          >/g, '<button\n            onClick={() => window.print()}\n            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"\n          >');

content = content.replace(/<button\n            onClick=\{\(\) => window\.print\(\)\}\n            className="px-3\.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1\.5"\n          >/g, '<button\n            onClick={() => window.print()}\n            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"\n          >');

fs.writeFileSync('src/components/AdminClientes.tsx', content);
