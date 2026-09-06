const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  /                          <\/div>\n                        \{\/\* Chronological Audit logs \*\/\}/,
  `                          </div>
                          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800">
                            <strong>Instrucciones:</strong> Para agregar personal nuevo, pídeles que hagan clic en "Login de Personal", luego en "Registrarme". 
                            Una vez que creen su cuenta con correo y contraseña, aparecerán aquí con estatus "Pendiente" para que les asignes un rol.
                          </div>
                        </div>
                        {/* Chronological Audit logs */}`
);

fs.writeFileSync('src/App.tsx', code);
