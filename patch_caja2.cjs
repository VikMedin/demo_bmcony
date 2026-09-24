const fs = require('fs');
let content = fs.readFileSync('src/components/AdminCaja.tsx', 'utf8');

const regex = /<div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">([\s\S]*?)<\/div>\s*<\/div>\s*{\/\* Split Log Lists: Orders and Expenses \*\//;

const replacement = `<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-1 min-w-[200px]">
                <span className="text-[10px] text-amber-800 font-semibold uppercase whitespace-nowrap">Ventas Brutas Totales</span>
                <p className="text-2xl font-bold text-amber-950 whitespace-nowrap overflow-hidden text-ellipsis" title={\`\${bruteTotal.toFixed(2)}\`}>\${bruteTotal.toFixed(2)}</p>
                <div className="flex justify-between text-[10px] text-amber-600 mt-2">
                  <span className="whitespace-nowrap">💵 Efectivo: \${bruteEfectivo.toFixed(0)}</span>
                  <span className="whitespace-nowrap">🏦 Transf: \${bruteTransferencia.toFixed(0)}</span>
                </div>
              </div>
              <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-xl space-y-1 min-w-[200px]">
                <span className="text-[10px] text-rose-800 font-semibold uppercase whitespace-nowrap">Egresos / Gastos Diarios</span>
                <p className="text-2xl font-bold text-rose-950 whitespace-nowrap overflow-hidden text-ellipsis" title={\`-\${totalExpenses.toFixed(2)}\`}>-\${totalExpenses.toFixed(2)}</p>
                <p className="text-[10px] text-rose-500 mt-2 truncate">Restado automáticamente de la neta</p>
              </div>
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1 min-w-[200px]">
                <span className="text-[10px] text-emerald-800 font-semibold uppercase whitespace-nowrap">Ganancia Neta Real</span>
                <p className="text-2xl font-bold text-emerald-950 whitespace-nowrap overflow-hidden text-ellipsis" title={\`\${netEarnings.toFixed(2)}\`}>\${netEarnings.toFixed(2)}</p>
                <div className="flex justify-between text-[10px] text-emerald-600 mt-2">
                  <span className="truncate">💖 Propinas del equipo: \${totalTips.toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Split Log Lists: Orders and Expenses */`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/components/AdminCaja.tsx', content);
