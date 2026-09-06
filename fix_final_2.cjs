const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');
const lines = code.split('\n');

const lineIndex = lines.findIndex(l => l.includes('{/* Chronological Audit logs */}'));

if (lineIndex !== -1) {
  lines.splice(lineIndex, 0, 
`                          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800 mt-4">
                            <strong>Instrucciones:</strong> Para agregar personal nuevo, pídeles que hagan clic en "Login de Personal", luego en "Registrarme". 
                            Una vez que creen su cuenta con correo y contraseña, aparecerán aquí con estatus "Pendiente" para que les asignes un rol.
                          </div>
                        </div>`
  );
  fs.writeFileSync('src/App.tsx', lines.join('\n'));
  console.log("Injected missing div at line", lineIndex);
}
