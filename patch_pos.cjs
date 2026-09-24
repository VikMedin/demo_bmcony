const fs = require('fs');
let content = fs.readFileSync('src/components/AdminCaja.tsx', 'utf8');

content = content.replace(
  /<div key=\{c\.id\} className="py-2\.5 flex items-start justify-between gap-3 text-xs">\s*<div className="flex-1 min-w-0">/g,
  `<div key={c.id} className="py-2.5 flex items-start justify-between gap-2 sm:gap-3 text-xs">
                        <div className="flex-1 min-w-0 pr-2">`
).replace(
  /<span className="font-bold text-amber-950 shrink-0">/g,
  `<span className="font-bold text-amber-950 shrink-0 whitespace-nowrap text-sm mt-0.5">`
);

fs.writeFileSync('src/components/AdminCaja.tsx', content);
