const fs = require('fs');
let content = fs.readFileSync('src/components/BillingManager.tsx', 'utf8');

content = content.replace(
  /<p className="text-2xl font-serif font-bold text-emerald-600 mt-1">\$\{totalBilledVal\.toFixed\(2\)\}<\/p>/g,
  `<p className="text-2xl font-serif font-bold text-emerald-600 mt-1 whitespace-nowrap overflow-hidden text-ellipsis">\${totalBilledVal.toFixed(2)}</p>`
).replace(
  /<p className="text-2xl font-serif font-bold text-rose-500 mt-1">\$\{totalPendingVal\.toFixed\(2\)\}<\/p>/g,
  `<p className="text-2xl font-serif font-bold text-rose-500 mt-1 whitespace-nowrap overflow-hidden text-ellipsis">\${totalPendingVal.toFixed(2)}</p>`
).replace(
  /<p className="text-2xl font-serif font-bold text-amber-950 mt-1">\s*\{\(totalMinutesWorked \/ 60\)\.toFixed\(1\)\} hrs\s*<\/p>/g,
  `<p className="text-2xl font-serif font-bold text-amber-950 mt-1 whitespace-nowrap overflow-hidden text-ellipsis">
                {(totalMinutesWorked / 60).toFixed(1)} hrs
              </p>`
).replace(
  /<span className="font-bold text-emerald-600">\$\{inv\.total\.toFixed\(2\)\}<\/span>/g,
  `<span className="font-bold text-emerald-600 whitespace-nowrap text-sm">\${inv.total.toFixed(2)}</span>`
).replace(
  /<div className="flex items-center gap-3">\s*<span className="font-bold text-emerald-600 whitespace-nowrap text-sm">\$\{inv\.total\.toFixed\(2\)\}<\/span>/g,
  `<div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span className="font-bold text-emerald-600 whitespace-nowrap text-sm">\${inv.total.toFixed(2)}</span>`
).replace(
  /<div className="flex-1">\s*<p className="font-bold text-amber-950">\{inv\.invoiceNumber\}<\/p>/g,
  `<div className="flex-1 min-w-0 pr-2">
                    <p className="font-bold text-amber-950 truncate">{inv.invoiceNumber}</p>`
).replace(
  /<p className="text-\[10px\] text-gray-400 mt-0\.5">Cliente: \{inv\.clientName\} • Vence: \{inv\.dueDate\}<\/p>/g,
  `<p className="text-[10px] text-gray-400 mt-0.5 truncate">Cliente: {inv.clientName} • Vence: {inv.dueDate}</p>`
);

fs.writeFileSync('src/components/BillingManager.tsx', content);
