const fs = require('fs');
let content = fs.readFileSync('src/components/ClientMenu.tsx', 'utf8');

const regex1 = /<div className="text-right">\s*<p className="text-xs font-bold text-amber-950">\$\{rowTotal\.toFixed\(2\)\}<\/p>/g;

const replacement1 = `<div className="text-right shrink-0">
                            <p className="text-xs font-bold text-amber-950 whitespace-nowrap">\${rowTotal.toFixed(2)}</p>`;

content = content.replace(regex1, replacement1);
fs.writeFileSync('src/components/ClientMenu.tsx', content);
