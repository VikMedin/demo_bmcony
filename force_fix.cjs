const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');
const lines = code.split('\n');

const startIndex = lines.findIndex(l => l.includes('{auditLogs.map(log => ('));
if (startIndex !== -1) {
  const endIndex = lines.findIndex((l, idx) => idx > startIndex && l.includes('</main>'));
  if (endIndex !== -1) {
    const replacement = `                            {auditLogs.map(log => (
                              <div key={log.id} className="p-3 text-[11px] hover:bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="space-y-0.5 flex-1 pr-4">
                                  <p className="text-gray-700 leading-normal">{log.action}</p>
                                  <div className="flex gap-2 text-[9px] font-medium text-gray-400">
                                    <span>Por: <strong>{log.user}</strong></span>
                                    <span>•</span>
                                    <span className="capitalize text-amber-700">{log.role}</span>
                                  </div>
                                </div>
                                <span className="text-[10px] text-gray-400 shrink-0 font-medium">
                                  {log.timestamp}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {adminTab === 'perfil' && profile && (
                  <div className="animate-fade-in max-w-2xl mx-auto space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                      <h2 className="font-serif font-bold text-lg text-amber-950 flex items-center gap-2">
                        <User className="w-5 h-5 text-amber-600" />
                        Mi Perfil de Personal
                      </h2>
                      <p className="text-xs text-gray-500 mt-1">Personaliza tus datos de contacto, foto de avatar y contraseña.</p>

                      {/* AVATAR PREVIEW BLOCK */}
                      <div className="mt-6 flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-150">
                        <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-amber-100 shadow-md shrink-0 bg-amber-50 flex items-center justify-center">
                          {profile.avatar ? (
                            <img 
                              src={profile.avatar} 
                              alt="Tu Avatar" 
                              className="h-full w-full object-cover" 
                            />
                          ) : (
                            <User className="w-12 h-12 text-amber-300" />
                          )}
                        </div>
                        <div className="text-center sm:text-left space-y-1">
                          <h3 className="font-serif font-bold text-base text-amber-950">
                            {profile.name || 'Nombre no configurado'}
                          </h3>
                          <p className="text-xs font-semibold text-amber-600 capitalize">
                            Rol del Sistema: {userRole}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {userRole === 'esperando' ? 'Pendiente de Aprobación ⏳' : 'Estatus de Acceso: Concedido 🔒'}
                          </p>
                        </div>
                      </div>

                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const target = e.target;
                          const updatedName = target.fullName.value.trim();
                          const updatedPhone = target.phone.value.trim();
                          const updatedAvatar = target.avatarUrl.value.trim();
                          
                          if (updatedName && firebaseUser) {
                            const newProf = { ...profile, name: updatedName, phone: updatedPhone, avatar: updatedAvatar };
                            // update firestore
                            const { doc, setDoc } = await import('firebase/firestore');
                            const { db } = await import('./firebase');
                            await setDoc(doc(db, 'cony_staff_users', firebaseUser.uid), newProf);
                            setProfile(newProf);
                            triggerToast('success', 'Perfil Guardado', 'Tus datos han sido actualizados con éxito.');
                          }

                          if (newPassword && firebaseUser) {
                            try {
                              await updatePassword(firebaseUser, newPassword);
                              triggerToast('success', 'Contraseña Actualizada', 'Tu contraseña ha sido cambiada correctamente.');
                              setNewPassword('');
                            } catch (error) {
                              if (error.code === 'auth/requires-recent-login') {
                                triggerToast('error', 'Seguridad', 'Debes cerrar sesión y volver a iniciarla para cambiar tu contraseña.');
                              } else {
                                triggerToast('error', 'Error', 'No se pudo cambiar la contraseña.');
                              }
                            }
                          }
                        }}
                        className="mt-6 space-y-5"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* FULL NAME */}
                          <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Nombre Completo *</label>
                            <input
                              type="text"
                              name="fullName"
                              defaultValue={profile.name}
                              placeholder="Ej. Doña Cony Especial"
                              className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                              required
                            />
                          </div>

                          {/* PHONE NUMBER */}
                          <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Teléfono de Contacto</label>
                            <input
                              type="text"
                              name="phone"
                              defaultValue={profile.phone}
                              placeholder="Ej. 5512345678"
                              className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                            />
                          </div>

                          {/* EMAIL ADDRESS */}
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-gray-600 mb-1">Correo Electrónico (No modificable)</label>
                            <input
                              type="email"
                              name="email"
                              defaultValue={profile.email}
                              disabled
                              className="w-full p-2.5 border border-gray-200 rounded-xl text-xs bg-gray-50 text-gray-500 cursor-not-allowed"
                            />
                          </div>
                          
                          {/* PASSWORD UPDATE */}
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-gray-600 mb-1">Nueva Contraseña (Opcional)</label>
                            <input
                              type="password"
                              value={newPassword}
                              onChange={e => setNewPassword(e.target.value)}
                              placeholder="Déjalo en blanco si no quieres cambiarla"
                              className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                            />
                          </div>
                        </div>

                        {/* AVATAR OPTION A: UPLOAD FILE FROM PC/MOBILE */}
                        <div className="p-4 bg-amber-50/40 border border-amber-100 rounded-xl space-y-3">
                          <span className="block text-xs font-bold text-amber-950">📸 Opción A: Cargar Foto desde Dispositivo (Móvil / PC)</span>
                          <input 
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const base64String = await resizeImage(file, 200, 200);
                                  const newProf = { ...profile, avatar: base64String };
                                  const { doc, setDoc } = await import('firebase/firestore');
                                  const { db } = await import('./firebase');
                                  await setDoc(doc(db, 'cony_staff_users', firebaseUser.uid), newProf);
                                  setProfile(newProf);
                                  triggerToast('success', 'Foto Actualizada', 'Tu avatar se ha actualizado con la nueva imagen.');
                                } catch (err) {
                                  triggerToast('error', 'Error de Imagen', 'La imagen es demasiado grande o no soportada.');
                                }
                              }
                            }}
                            className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 cursor-pointer"
                          />
                        </div>

                        {/* AVATAR OPTION B: URL INPUT */}
                        <div className="p-4 bg-gray-50/50 border border-gray-200 rounded-xl">
                          <label className="block text-xs font-bold text-gray-600 mb-2">Opción B: URL de Imagen de Avatar</label>
                          <input
                            type="url"
                            name="avatarUrl"
                            id="avatarUrlField"
                            key={profile.avatar}
                            defaultValue={profile.avatar}
                            placeholder="Ej. https://images.unsplash.com/..."
                            className="w-full p-2.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-colors shadow-sm"
                        >
                          Guardar Cambios de Perfil
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        }
      </main>`;
    
    const newLines = [
      ...lines.slice(0, startIndex),
      replacement,
      ...lines.slice(endIndex + 1)
    ];
    fs.writeFileSync('src/App.tsx', newLines.join('\n'));
    console.log("Replaced lines", startIndex, "to", endIndex);
  }
}
