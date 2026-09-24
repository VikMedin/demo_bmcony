const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

content = content.replace(
  /<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">([\s\S]*?)<\!-- Charts Grid -->/,
  `<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Venta Bruta */}
        <div className="bg-white p-3 sm:p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="p-2 sm:p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Ventas Brutas</p>
            <h3 className="text-lg sm:text-xl font-bold text-amber-950 mt-0.5 whitespace-nowrap">\${totalBruto.toFixed(2)}</h3>
            <p className="text-[9px] text-emerald-600 font-medium mt-1 leading-tight line-clamp-2">Ingreso total</p>
          </div>
        </div>

        {/* Card 2: Egresos */}
        <div className="bg-white p-3 sm:p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="p-2 sm:p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0">
            <Percent className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Total Gastos</p>
            <h3 className="text-lg sm:text-xl font-bold text-rose-950 mt-0.5 whitespace-nowrap">\${totalEgresos.toFixed(2)}</h3>
            <p className="text-[9px] text-rose-500 font-medium mt-1 leading-tight line-clamp-2">Insumos / Gas</p>
          </div>
        </div>

        {/* Card 3: Ganancia Neta */}
        <div className="bg-white p-3 sm:p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="p-2 sm:p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Ganancia Neta</p>
            <h3 className="text-lg sm:text-xl font-bold text-emerald-950 mt-0.5 whitespace-nowrap">\${totalNeto.toFixed(2)}</h3>
            <p className="text-[9px] text-emerald-600 font-medium mt-1 leading-tight line-clamp-2">Restando egresos</p>
          </div>
        </div>

        {/* Card 4: Ticket Promedio */}
        <div className="bg-white p-3 sm:p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="p-2 sm:p-3 bg-sky-50 text-sky-600 rounded-xl shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Ticket Promedio</p>
            <h3 className="text-lg sm:text-xl font-bold text-sky-950 mt-0.5 whitespace-nowrap">\${ticketPromedio.toFixed(2)}</h3>
            <p className="text-[9px] text-sky-600 font-medium mt-1 leading-tight line-clamp-2">Por comanda</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */`
);

fs.writeFileSync('src/components/AdminDashboard.tsx', content);
