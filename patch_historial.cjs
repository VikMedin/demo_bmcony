const fs = require('fs');
let content = fs.readFileSync('src/components/AdminCaja.tsx', 'utf8');

const regexOrders = /<div key=\{order\.id\} className=\{\`py-3 flex items-center justify-between gap-3 text-xs \$\{order\.status === 'cancelado' \? 'opacity-50' : ''\}\`\}>\s*<div>\s*<p className=\{\`font-bold \$\{order\.status === 'cancelado' \? 'text-gray-400 line-through' : 'text-gray-800'\}\`\}>\s*\{order\.orderNumber\} \(\{order\.clientName\}\)\s*\{order\.status === 'cancelado' && <span className="ml-2 text-\[9px\] bg-rose-100 text-rose-800 px-1\.5 py-0\.5 rounded no-underline">Cancelado<\/span>\}\s*<\/p>\s*<p className="text-\[10px\] text-gray-400">\{order\.createdAt\.split\('T'\)\[0\]\} • \{order\.paymentMethod === 'efectivo' \? '💵 Efectivo' : '🏦 Transf'\}<\/p>\s*<\/div>\s*<div className="flex items-center gap-3">\s*<span className=\{\`font-bold \$\{order\.status === 'cancelado' \? 'text-gray-400 line-through' : 'text-amber-950'\}\`\}>\$\{order\.total\.toFixed\(2\)\}<\/span>/g;

const replacementOrders = `<div key={order.id} className={\`py-3 flex items-center justify-between gap-2 sm:gap-3 text-xs \${order.status === 'cancelado' ? 'opacity-50' : ''}\`}>
                    <div className="min-w-0 flex-1 pr-2">
                      <p className={\`font-bold leading-tight \${order.status === 'cancelado' ? 'text-gray-400 line-through' : 'text-gray-800'}\`}>
                        {order.orderNumber} ({order.clientName})
                        {order.status === 'cancelado' && <span className="ml-2 text-[9px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded no-underline inline-block">Cancelado</span>}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{order.createdAt.split('T')[0]} • {order.paymentMethod === 'efectivo' ? '💵 Efectivo' : '🏦 Transf'}</p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <span className={\`font-bold whitespace-nowrap text-sm \${order.status === 'cancelado' ? 'text-gray-400 line-through' : 'text-amber-950'}\`}>\${order.total.toFixed(2)}</span>`;


const regexExpenses = /<div key=\{exp\.id\} className="py-3 flex items-center justify-between gap-3 text-xs">\s*<div>\s*<p className="font-semibold text-gray-800">\{exp\.concept\}<\/p>\s*<p className="text-\[10px\] text-gray-400">\{exp\.date\}<\/p>\s*<\/div>\s*<div className="flex items-center gap-3">\s*<span className="font-bold text-rose-600">-\$\{exp\.amount\.toFixed\(2\)\}<\/span>/g;

const replacementExpenses = `<div key={exp.id} className="py-3 flex flex-row items-center justify-between gap-2 sm:gap-3 text-xs">
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-semibold text-gray-800 leading-tight">{exp.concept}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{exp.date}</p>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <span className="font-bold text-rose-600 whitespace-nowrap text-sm">-\${exp.amount.toFixed(2)}</span>`;

content = content.replace(regexOrders, replacementOrders);
content = content.replace(regexExpenses, replacementExpenses);

fs.writeFileSync('src/components/AdminCaja.tsx', content);
