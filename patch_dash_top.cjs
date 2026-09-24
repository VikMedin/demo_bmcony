const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const regex1 = /<div className="flex items-center justify-between text-xs">\s*<span className="font-semibold text-amber-950 truncate">\{p\.name\}<\/span>\s*<span className="font-bold text-gray-500">\{p\.count\} piezas<\/span>\s*<\/div>/g;

const replacement1 = `<div className="flex items-center justify-between gap-2 sm:gap-3 text-xs">
                        <span className="font-semibold text-amber-950 truncate flex-1 min-w-0 pr-2 leading-tight">{p.name}</span>
                        <span className="font-bold text-gray-500 shrink-0 whitespace-nowrap">{p.count} piezas</span>
                      </div>`;

content = content.replace(regex1, replacement1);
fs.writeFileSync('src/components/AdminDashboard.tsx', content);
