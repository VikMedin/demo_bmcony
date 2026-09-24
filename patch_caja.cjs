const fs = require('fs');
let content = fs.readFileSync('src/components/AdminCaja.tsx', 'utf8');

const regex = /<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">([\s\S]*?)<\/div>\s*<\/div>\s*{\/\* Split Log Lists: Orders and Expenses \*\//;

const replacement = `<div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              <div className="p-2.5 sm:p-3 bg-amber-50 text-amber-600 rounded-xl overflow-hidden flex flex-col justify-center">
                <span className="block text-[9px] sm:text-[10px] text-gray-400 uppercase font-semibold truncate">Ventas Brutas</span>
                <p className="text-base sm:text-xl font-bold text-amber-950 mt-0.5 whitespace-nowrap">\${bruteTotal.toFixed(2)}</p>
                <div className="flex flex-col gap-0.5 text-[8px] sm:text-[9px] text-emerald-600 font-medium mt-1">
                  <span className="truncate">💵 Efec: \${bruteEfectivo.toFixed(0)}</span>
                  <span className="truncate">🏦 Trans: \${bruteTransferencia.toFixed(0)}</span>
                </div>
              </div>
              <div className="p-2.5 sm:p-3 bg-rose-50 text-rose-600 rounded-xl overflow-hidden flex flex-col justify-center">
                <span className="block text-[9px] sm:text-[10px] text-gray-400 uppercase font-semibold truncate">Total Gastos</span>
                <p className="text-base sm:text-xl font-bold text-rose-950 mt-0.5 whitespace-nowrap">-\${totalExpenses.toFixed(2)}</p>
                <div className="flex flex-col gap-0.5 text-[8px] sm:text-[9px] text-rose-500 font-medium mt-1">
                  <span className="truncate hidden sm:block">Restado automáticamente de neta</span>
                  <span className="truncate sm:hidden">Restado de neta</span>
                </div>
              </div>
              <div className="p-2.5 sm:p-3 bg-emerald-50 text-emerald-600 rounded-xl overflow-hidden flex flex-col justify-center col-span-2 sm:col-span-1">
                <span className="block text-[9px] sm:text-[10px] text-gray-400 uppercase font-semibold truncate">Ganancia Neta</span>
                <p className="text-base sm:text-xl font-bold text-emerald-950 mt-0.5 whitespace-nowrap">\${netEarnings.toFixed(2)}</p>
                <div className="flex flex-col gap-0.5 text-[8px] sm:text-[9px] text-emerald-600 font-medium mt-1">
                  <span className="truncate">💖 Propinas: \${totalTips.toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Split Log Lists: Orders and Expenses */`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/components/AdminCaja.tsx', content);
