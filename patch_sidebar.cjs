const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const sidebarEndRegex = /<\/nav>\n            <\/aside>/;

const newSidebar = `
                  <button
                    onClick={() => setAdminTab('perfil')}
                    className={\`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 \${
                      adminTab === 'perfil'
                        ? 'bg-amber-50 text-amber-900 font-extrabold shadow-xs'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }\`}
                  >
                    <User className="w-4 h-4 text-amber-600" />
                    Mi Perfil
                  </button>
                </nav>
            </aside>`;

code = code.replace(sidebarEndRegex, newSidebar);
fs.writeFileSync('src/App.tsx', code);
