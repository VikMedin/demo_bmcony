const fs = require('fs');
const content = fs.readFileSync('src/components/AdminCaja.tsx', 'utf8');

const target = `            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-1">
                <span className="text-[10px] text-amber-800 font-semibold uppercase">Ventas Brutas Totales</span>
                <p className="text-2xl font-serif font-bold text-amber-950">\${bruteTotal.toFixed(2)}</p>
                <div className="flex justify-between text-[10px] text-amber-600 mt-2">
                  <span>💵 Efectivo: \${bruteEfectivo.toFixed(0)}</span>
                  <span>🏦 Transf: \${bruteTransferencia.toFixed(0)}</span>
                </div>
              </div>
              <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-xl space-y-1">
                <span className="text-[10px] text-rose-800 font-semibold uppercase">Egresos / Gastos Diarios</span>
                <p className="text-2xl font-serif font-bold text-rose-950">-\${totalExpenses.toFixed(2)}</p>
                <p className="text-[10px] text-rose-500 mt-2">Restado automáticamente de la neta</p>
              </div>
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1">
                <span className="text-[10px] text-emerald-800 font-semibold uppercase">Ganancia Neta Real</span>
                <p className="text-2xl font-serif font-bold text-emerald-950">\${netEarnings.toFixed(2)}</p>
                <div className="flex justify-between text-[10px] text-emerald-600 mt-2">
                  <span>💖 Propinas del equipo: \${totalTips.toFixed(0)}</span>
                </div>
              </div>
            </div>`;

const replacement = `            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl overflow-hidden">
                <span className="block text-[10px] text-gray-400 uppercase font-semibold truncate">Ventas Brutas</span>
                <p className="text-xl font-bold text-amber-950 mt-0.5 truncate">\${bruteTotal.toFixed(2)}</p>
                <div className="flex flex-col gap-0.5 text-[9px] text-emerald-600 font-medium mt-1.5">
                  <span className="truncate">💵 Efec: \${bruteEfectivo.toFixed(0)} | 🏦 Trans: \${bruteTransferencia.toFixed(0)}</span>
                </div>
              </div>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl overflow-hidden">
                <span className="block text-[10px] text-gray-400 uppercase font-semibold truncate">Total Gastos</span>
                <p className="text-xl font-bold text-rose-950 mt-0.5 truncate">-\${totalExpenses.toFixed(2)}</p>
                <div className="flex flex-col gap-0.5 text-[9px] text-rose-500 font-medium mt-1.5">
                  <span className="truncate">Restado automáticamente de neta</span>
                </div>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl overflow-hidden">
                <span className="block text-[10px] text-gray-400 uppercase font-semibold truncate">Ganancia Neta</span>
                <p className="text-xl font-bold text-emerald-950 mt-0.5 truncate">\${netEarnings.toFixed(2)}</p>
                <div className="flex flex-col gap-0.5 text-[9px] text-emerald-600 font-medium mt-1.5">
                  <span className="truncate">💖 Propinas: \${totalTips.toFixed(0)}</span>
                </div>
              </div>
            </div>`;

fs.writeFileSync('src/components/AdminCaja.tsx', content.replace(target, replacement));
