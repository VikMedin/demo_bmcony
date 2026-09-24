const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const regex = /<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">([\s\S]*?){\/\* Charts Grid \*\/}/;

const replacement = `<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Venta Bruta */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-4 min-w-[200px]">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-gray-400 uppercase font-semibold whitespace-nowrap">Ventas Brutas</p>
            <h3 className="text-xl sm:text-2xl font-bold text-amber-950 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis" title={\`\${totalBruto.toFixed(2)}\`}>\${totalBruto.toFixed(2)}</h3>
            <p className="text-[10px] text-emerald-600 font-medium mt-1 truncate">Ingreso total en comanda</p>
          </div>
        </div>

        {/* Card 2: Egresos */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-4 min-w-[200px]">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0">
            <Percent className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-gray-400 uppercase font-semibold whitespace-nowrap">Total Gastos</p>
            <h3 className="text-xl sm:text-2xl font-bold text-rose-950 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis" title={\`-\${totalEgresos.toFixed(2)}\`}>\${totalEgresos.toFixed(2)}</h3>
            <p className="text-[10px] text-rose-500 font-medium mt-1 truncate">Conceptos de insumos / gas</p>
          </div>
        </div>

        {/* Card 3: Ganancia Neta */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-4 min-w-[200px]">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-gray-400 uppercase font-semibold whitespace-nowrap">Ganancia Neta</p>
            <h3 className="text-xl sm:text-2xl font-bold text-emerald-950 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis" title={\`\${totalNeto.toFixed(2)}\`}>\${totalNeto.toFixed(2)}</h3>
            <p className="text-[10px] text-emerald-600 font-medium mt-1 truncate">Ventas restando egresos</p>
          </div>
        </div>

        {/* Card 4: Ticket Promedio */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-4 min-w-[200px]">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-gray-400 uppercase font-semibold whitespace-nowrap">Ticket Promedio</p>
            <h3 className="text-xl sm:text-2xl font-bold text-sky-950 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis" title={\`\${ticketPromedio.toFixed(2)}\`}>\${ticketPromedio.toFixed(2)}</h3>
            <p className="text-[10px] text-sky-600 font-medium mt-1 truncate">Por comanda individual</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/components/AdminDashboard.tsx', content);
