sed -i '519,542c\
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">\
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl overflow-hidden">\
                <span className="block text-[10px] text-gray-400 uppercase font-semibold truncate">Ventas Brutas</span>\
                <p className="text-xl font-bold text-amber-950 mt-0.5 truncate">${bruteTotal.toFixed(2)}</p>\
                <div className="flex flex-col gap-0.5 text-[9px] text-emerald-600 font-medium mt-1.5">\
                  <span className="truncate">💵 Efec: ${bruteEfectivo.toFixed(0)} | 🏦 Trans: ${bruteTransferencia.toFixed(0)}</span>\
                </div>\
              </div>\
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl overflow-hidden">\
                <span className="block text-[10px] text-gray-400 uppercase font-semibold truncate">Total Gastos</span>\
                <p className="text-xl font-bold text-rose-950 mt-0.5 truncate">-${totalExpenses.toFixed(2)}</p>\
                <div className="flex flex-col gap-0.5 text-[9px] text-rose-500 font-medium mt-1.5">\
                  <span className="truncate">Restado automáticamente de neta</span>\
                </div>\
              </div>\
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl overflow-hidden">\
                <span className="block text-[10px] text-gray-400 uppercase font-semibold truncate">Ganancia Neta</span>\
                <p className="text-xl font-bold text-emerald-950 mt-0.5 truncate">${netEarnings.toFixed(2)}</p>\
                <div className="flex flex-col gap-0.5 text-[9px] text-emerald-600 font-medium mt-1.5">\
                  <span className="truncate">💖 Propinas: ${totalTips.toFixed(0)}</span>\
                </div>\
              </div>\
            </div>' src/components/AdminCaja.tsx
