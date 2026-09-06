const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace StaffUser interface
code = code.replace(
  /interface StaffUser \{\n  id: string;\n  name: string;\n  username: string;\n  role: 'superadmin' \| 'admin' \| 'mensajero';\n\}/,
  `interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'mensajero' | 'esperando';
}`
);

// Replace default data in useFirebaseCollection for staff users
code = code.replace(
  /const \[staffUsers, setStaffUsers\] = useFirebaseCollection<StaffUser>\('cony_staff_users', \[\s*\{ id: 'u1'.*?\}\s*\]\);/,
  `const [staffUsers, setStaffUsers] = useFirebaseCollection<StaffUser>('cony_staff_users', []);`
);

// Remove handleAddStaffUser because we will change roles inline now
code = code.replace(/const handleAddStaffUser = \([\s\S]*?};\n\n/g, '');

const usersAdminViewRegex = /<h3 className="font-serif font-bold text-sm text-amber-950 flex items-center gap-2 mb-3">[\s\S]*?<\/form>\n                        <\/div>/g;

const newUsersAdminView = `<h3 className="font-serif font-bold text-sm text-amber-950 flex items-center gap-2 mb-3">
                            <ShieldCheck className="w-4 h-4 text-amber-600" />
                            Control de Accesos
                          </h3>
                          <div className="divide-y divide-gray-100 mb-4 h-56 overflow-y-auto pr-2">
                            {staffUsers.map(user => (
                              <div key={user.id} className="py-3 flex items-center justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-xs text-amber-950">{user.name}</p>
                                  <div className="flex gap-2 text-[9px] mt-1">
                                    <span className="text-gray-400 font-medium">{user.email}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <select
                                    value={user.role}
                                    onChange={async (e) => {
                                      const newRole = e.target.value as any;
                                      const { doc, setDoc } = await import('firebase/firestore');
                                      const { db } = await import('./firebase');
                                      await setDoc(doc(db, 'cony_staff_users', user.id), { ...user, role: newRole });
                                      triggerToast('success', 'Rol Actualizado', \`El rol de \${user.name} se cambió a \${newRole}.\`);
                                    }}
                                    disabled={user.role === 'superadmin' && staffUsers.filter(u => u.role === 'superadmin').length <= 1}
                                    className="text-[10px] p-1 border border-gray-200 rounded text-amber-950 bg-amber-50"
                                  >
                                    <option value="superadmin">SuperAdmin</option>
                                    <option value="admin">Administrador</option>
                                    <option value="mensajero">Repartidor</option>
                                    <option value="esperando">Pendiente / Suspendido</option>
                                  </select>
                                  {user.role !== 'superadmin' && (
                                    <button
                                      onClick={() => handleDeleteStaffUser(user.id)}
                                      className="p-1 text-gray-400 hover:text-rose-600 rounded-lg"
                                      title="Eliminar del sistema"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800">
                            <strong>Instrucciones:</strong> Para agregar personal nuevo, pídeles que hagan clic en "Login de Personal", luego en "Registrarme". 
                            Una vez que creen su cuenta con correo y contraseña, aparecerán aquí con estatus "Pendiente" para que les asignes un rol.
                          </div>
                        </div>`;

code = code.replace(usersAdminViewRegex, newUsersAdminView);

fs.writeFileSync('src/App.tsx', code);
