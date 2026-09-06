const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(/catch \(error\) {/g, 'catch (error: any) {');

fs.writeFileSync('src/App.tsx', code);
