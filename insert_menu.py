import sys

content = """                {adminTab === 'menu' && (userRole === 'superadmin' || userRole === 'admin') && (
                  <div className="animate-fade-in space-y-8">
                    {/* PLATILLOS MANAGEMENT (Alta y edición de platillos/precios) */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                          <h3 className="font-serif font-bold text-base text-amber-950">Catálogo de Alimentos</h3>
                          <p className="text-xs text-gray-500">Administra precios, descripciones, categorías e inventario diario del comal.</p>
                        </div>
                        <button
                          onClick={() => setShowCreateForm(!showCreateForm)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {showCreateForm ? 'Cerrar Registro' : 'Alta de Platillo'}
                        </button>
                      </div>

                      {/* CREATE DISH FORM */}
                      {showCreateForm && (
                        <form onSubmit={handleCreateDishSubmit} className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-xl mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre del Platillo *</label>
                            <input
                              type="text"
                              value={createForm.name}
                              onChange={e => setCreateForm({...createForm, name: e.target.value})}
                              placeholder="Ej. Enchiladas Verdes Doña Cony"
                              required
                              className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Categoría *</label>
                            <select
                              value={createForm.category}
                              onChange={e => setCreateForm({...createForm, category: e.target.value})}
                              className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none"
                            >
                              <option value="Chilaquiles">Chilaquiles</option>
                              <option value="Huevos">Huevos</option>
                              <option value="Antojitos">Antojitos</option>
                              <option value="Bebidas">Bebidas</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Precio Unitario ($ MXN) *</label>
                            <input
                              type="number"
                              value={createForm.price}
                              onChange={e => setCreateForm({...createForm, price: Number(e.target.value)})}
                              required
                              className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Porciones en Inventario *</label>
                            <input
                              type="number"
                              value={createForm.stock}
                              onChange={e => setCreateForm({...createForm, stock: Number(e.target.value)})}
                              required
                              className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Imagen del Platillo (Opcional)</label>
                            
                            <div className="flex flex-col sm:flex-row gap-3">
                              <div className="flex-1 p-3 bg-emerald-50/40 border border-emerald-100 rounded-xl">
                                <span className="block text-[10px] font-bold text-emerald-900 mb-1.5">📸 Subir Foto</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      try {
                                        const base64String = await resizeImage(file, 400, 400);
                                        setCreateForm({...createForm, image: base64String});
                                        triggerToast('success', 'Foto Cargada', 'La imagen del platillo está lista.');
                                      } catch (err) {
                                        triggerToast('error', 'Error', 'No se pudo leer la imagen.');
                                      }
                                    }
                                  }}
                                  className="block w-full text-[10px] text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200 cursor-pointer"
                                />
                              </div>
                              <div className="flex-1">
                                <span className="block text-[10px] font-bold text-gray-600 mb-1.5">🔗 O Pegar Enlace (URL)</span>
                                <input
                                  type="text"
                                  value={createForm.image}
                                  onChange={e => setCreateForm({...createForm, image: e.target.value})}
                                  placeholder="Ej. https://images..."
                                  className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción Breve *</label>
                            <textarea
                              value={createForm.description}
                              onChange={e => setCreateForm({...createForm, description: e.target.value})}
                              required
                              rows={2}
                              placeholder="Añade ingredientes claves o modo de preparación"
                              className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none"
                            />
                          </div>
                          <div className="md:col-span-3 flex justify-end">
                            <button
                              type="submit"
                              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-sm"
                            >
                              Guardar en Menú
                            </button>
                          </div>
                        </form>
                      )}

                      {/* EDIT MODAL DIALOG */}
                      {editingDish && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
                          <form onSubmit={handleSaveEditDishSubmit} className="bg-white rounded-2xl p-6 max-w-lg w-full border border-gray-200 shadow-2xl space-y-4 my-8">
                            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                              <h4 className="font-serif font-bold text-base text-amber-950">
                                Editar Platillo: {editingDish.name}
                              </h4>
                              <button
                                type="button"
                                onClick={() => setEditingDish(null)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            
                            {/* Nombre y Categoría */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre del Platillo *</label>
                                <input
                                  type="text"
                                  value={dishForm.name}
                                  onChange={e => setDishForm({...dishForm, name: e.target.value})}
                                  required
                                  className="w-full p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Categoría *</label>
                                <select
                                  value={dishForm.category}
                                  onChange={e => setDishForm({...dishForm, category: e.target.value})}
                                  className="w-full p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                >
                                  <option value="Chilaquiles">Chilaquiles</option>
                                  <option value="Huevos">Huevos</option>
                                  <option value="Antojitos">Antojitos</option>
                                  <option value="Bebidas">Bebidas</option>
                                  {/* Include any extra categories if present */}
                                  {Array.from(new Set(foodItems.map(f => f.category)))
                                    .filter(c => !['Chilaquiles', 'Huevos', 'Antojitos', 'Bebidas'].includes(c))
                                    .map(cat => (
                                      <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                              </div>
                            </div>

                            {/* Precio y Stock */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Precio ($ MXN) *</label>
                                <input
                                  type="number"
                                  step="0.5"
                                  value={dishForm.price}
                                  onChange={e => setDishForm({...dishForm, price: Number(e.target.value)})}
                                  required
                                  className="w-full p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Stock Diario (Porciones) *</label>
                                <input
                                  type="number"
                                  value={dishForm.stock}
                                  onChange={e => setDishForm({...dishForm, stock: Number(e.target.value)})}
                                  required
                                  className="w-full p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                />
                              </div>
                            </div>

                            {/* Descripción */}
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción del Platillo *</label>
                              <textarea
                                value={dishForm.description}
                                onChange={e => setDishForm({...dishForm, description: e.target.value})}
                                required
                                rows={2}
                                className="w-full p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                              />
                            </div>
                            
                            {/* Fotografía / Imagen con previsualización */}
                            <div className="p-3 bg-amber-50/40 border border-amber-100 rounded-xl space-y-2.5">
                              <label className="block text-xs font-bold text-amber-950">Foto del Platillo</label>
                              
                              <div className="flex items-center gap-3">
                                {dishForm.image && dishForm.image.trim() !== '' ? (
                                  <div className="relative group">
                                    <img
                                      src={dishForm.image}
                                      alt="Previsualización"
                                      className="w-16 h-16 rounded-xl object-cover border border-amber-200 shadow-sm"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setDishForm({...dishForm, image: ''})}
                                      className="absolute -top-1.5 -right-1.5 p-1 bg-rose-600 text-white rounded-full shadow-md hover:bg-rose-700 transition-colors"
                                      title="Quitar foto (dejar solo texto)"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 h-16 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 font-black text-base flex items-center justify-center uppercase tracking-wider select-none shadow-sm">
                                      {getDishInitials(dishForm.name)}
                                    </div>
                                    <div className="text-[11px] text-gray-500">
                                      <strong className="text-amber-900">Sin foto asignada.</strong>
                                      <p>En el menú público solo se mostrará el texto con precio y descripción.</p>
                                    </div>
                                  </div>
                                )}

                                {dishForm.image && dishForm.image.trim() !== '' && (
                                  <button
                                    type="button"
                                    onClick={() => setDishForm({...dishForm, image: ''})}
                                    className="text-xs text-rose-600 hover:text-rose-700 font-bold underline"
                                  >
                                    Eliminar foto
                                  </button>
                                )}
                              </div>

                              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                                <div className="flex-1">
                                  <span className="block text-[10px] font-bold text-amber-900 mb-1">📸 Subir / Reemplazar Foto</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        try {
                                          const base64String = await resizeImage(file, 400, 400);
                                          setDishForm({...dishForm, image: base64String});
                                          triggerToast('success', 'Foto Cargada', 'La imagen está lista para guardarse.');
                                        } catch (err) {
                                          triggerToast('error', 'Error', 'No se pudo leer la imagen.');
                                        }
                                      }
                                    }}
                                    className="block w-full text-[10px] text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 cursor-pointer"
                                  />
                                </div>
                                <div className="flex-1">
                                  <span className="block text-[10px] font-bold text-gray-600 mb-1">🔗 O Pegar Enlace (URL)</span>
                                  <input
                                    type="text"
                                    value={dishForm.image || ''}
                                    onChange={e => setDishForm({...dishForm, image: e.target.value})}
                                    placeholder="Ej. https://images..."
                                    className="w-full p-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Opciones y Modificadores */}
                            <div className="border border-gray-100 rounded-xl p-3 bg-gray-50/50 space-y-2">
                              <span className="block text-xs font-bold text-gray-700">Opciones de Preparación</span>
                              {dishForm.options && dishForm.options.length > 0 ? (
                                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                                  {dishForm.options.map((opt, oIdx) => (
                                    <div key={oIdx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200 text-xs">
                                      <div>
                                        <strong className="text-amber-950">{opt.title}</strong>
                                        <span className="text-[10px] text-gray-500 block">
                                          {opt.choices.join(', ')} ({opt.multiselect ? 'Múltiple' : 'Única'})
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const next = dishForm.options.filter((_, idx) => idx !== oIdx);
                                          setDishForm({...dishForm, options: next});
                                        }}
                                        className="text-rose-500 hover:text-rose-700 p-1"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-[11px] text-gray-400">Sin opciones configuradas.</p>
                              )}

                              {/* Add Option Subform */}
                              <div className="pt-2 border-t border-gray-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  placeholder="Título (Ej. Salsa, Término)"
                                  value={newOptionTitle}
                                  onChange={e => setNewOptionTitle(e.target.value)}
                                  className="p-1.5 bg-white border border-gray-200 rounded text-[11px]"
                                />
                                <input
                                  type="text"
                                  placeholder="Opciones (Ej. Verde, Roja, Pasilla)"
                                  value={newOptionChoices}
                                  onChange={e => setNewOptionChoices(e.target.value)}
                                  className="p-1.5 bg-white border border-gray-200 rounded text-[11px]"
                                />
                                <div className="sm:col-span-2 flex items-center justify-between">
                                  <label className="flex items-center gap-1.5 text-[11px] text-gray-600">
                                    <input
                                      type="checkbox"
                                      checked={newOptionMultiselect}
                                      onChange={e => setNewOptionMultiselect(e.target.checked)}
                                      className="w-3.5 h-3.5 accent-amber-500"
                                    />
                                    Permitir selección múltiple
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!newOptionTitle.trim() || !newOptionChoices.trim()) return;
                                      const choices = newOptionChoices.split(',').map(c => c.trim()).filter(Boolean);
                                      const updated = [...dishForm.options, { title: newOptionTitle.trim(), choices, multiselect: newOptionMultiselect }];
                                      setDishForm({...dishForm, options: updated});
                                      setNewOptionTitle('');
                                      setNewOptionChoices('');
                                      setNewOptionMultiselect(false);
                                    }}
                                    className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded text-[11px] font-bold"
                                  >
                                    + Añadir Opción
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Extras Adicionales */}
                            <div className="border border-gray-100 rounded-xl p-3 bg-gray-50/50 space-y-2">
                              <span className="block text-xs font-bold text-gray-700">Extras Adicionales</span>
                              {dishForm.extras && dishForm.extras.length > 0 ? (
                                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                                  {dishForm.extras.map((ext, eIdx) => (
                                    <div key={eIdx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200 text-xs">
                                      <span className="text-amber-950 font-medium">
                                        {ext.name} <strong className="text-amber-600">+${ext.price}</strong>
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const next = dishForm.extras.filter((_, idx) => idx !== eIdx);
                                          setDishForm({...dishForm, extras: next});
                                        }}
                                        className="text-rose-500 hover:text-rose-700 p-1"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-[11px] text-gray-400">Sin extras configurados.</p>
                              )}

                              {/* Add Extra Subform */}
                              <div className="pt-2 border-t border-gray-200/60 flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="Nombre (Ej. Pollo extra)"
                                  value={newExtraName}
                                  onChange={e => setNewExtraName(e.target.value)}
                                  className="flex-1 p-1.5 bg-white border border-gray-200 rounded text-[11px]"
                                />
                                <input
                                  type="number"
                                  placeholder="$ MXN"
                                  value={newExtraPrice}
                                  onChange={e => setNewExtraPrice(Number(e.target.value))}
                                  className="w-20 p-1.5 bg-white border border-gray-200 rounded text-[11px]"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!newExtraName.trim()) return;
                                    const updated = [...dishForm.extras, { name: newExtraName.trim(), price: Number(newExtraPrice) || 0 }];
                                    setDishForm({...dishForm, extras: updated});
                                    setNewExtraName('');
                                    setNewExtraPrice(15);
                                  }}
                                  className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded text-[11px] font-bold shrink-0"
                                >
                                  + Añadir Extra
                                </button>
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                              <button
                                type="button"
                                onClick={() => setEditingDish(null)}
                                className="px-3.5 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50"
                              >
                                Cancelar
                              </button>
                              <button
                                type="submit"
                                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
                              >
                                <Save className="w-3.5 h-3.5" />
                                Guardar Todos los Cambios
                              </button>
                            </div>
                          </form>
                        </div>
                      )}

                      {/* Dishes List with Drag & Drop Sorting */}
                      <div className="mb-3 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>
                            <strong>Acomodo de la Carta:</strong> Jala con el cursor hacia arriba o abajo para ordenar la carta. Este orden se reflejará exactamente en la pantalla pública de tus clientes.
                          </span>
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 shrink-0 self-start sm:self-auto">
                          {foodItems.length} platillos
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {foodItems.map((item, index) => (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={(e) => handleDragStartDish(e, index)}
                            onDragOver={(e) => handleDragOverDish(e, index)}
                            onDrop={(e) => handleDropDish(e, index)}
                            onDragEnd={handleDragEndDish}
                            className={`p-3.5 border rounded-2xl bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              draggedDishIndex === index
                                ? 'opacity-40 border-dashed border-amber-400 bg-amber-50/20'
                                : dragOverDishIndex === index
                                ? 'border-2 border-amber-500 bg-amber-50/60 shadow-md scale-[1.01]'
                                : 'border-gray-200/80 hover:border-amber-200 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {/* Drag Handle */}
                              <div
                                className="cursor-grab active:cursor-grabbing p-1.5 text-gray-400 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-colors flex items-center justify-center shrink-0"
                                title="Jala con el cursor arriba o abajo para acomodar"
                              >
                                <GripVertical className="w-4 h-4" />
                              </div>

                              {/* Position badge */}
                              <span className="w-6 text-center text-xs font-black text-gray-400 font-mono">
                                #{index + 1}
                              </span>

                              {/* Image or 2-letter box */}
                              {item.image && item.image.trim() !== '' ? (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-12 h-12 rounded-xl object-cover border border-amber-100 shadow-sm shrink-0"
                                />
                              ) : (
                                <div
                                  className="w-12 h-12 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 font-black text-sm flex items-center justify-center uppercase tracking-wider shrink-0 select-none shadow-sm"
                                  title={`Sin foto: ${item.name}`}
                                >
                                  {getDishInitials(item.name)}
                                </div>
                              )}

                              <div>
                                <div className="flex items-center gap-2">
                                  <h5 className="font-serif font-bold text-sm text-amber-950">{item.name}</h5>
                                  {(!item.image || item.image.trim() === '') && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                      Sin foto
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-gray-400 font-semibold">{item.category}</p>
                                <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold mt-1 text-gray-600">
                                  <span>Precio: <strong className="text-amber-600">${item.price.toFixed(2)}</strong></span>
                                  <span>Insumo: <strong className={item.stock > 0 ? "text-emerald-600" : "text-rose-600"}>{item.stock} pzas</strong></span>
                                  {item.options && item.options.length > 0 && (
                                    <span className="text-gray-400 font-normal">({item.options.length} opciones)</span>
                                  )}
                                  {item.extras && item.extras.length > 0 && (
                                    <span className="text-gray-400 font-normal">({item.extras.length} extras)</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1.5 self-end sm:self-center">
                              {/* Up and Down Buttons for quick move */}
                              <div className="flex flex-col gap-0.5 mr-1">
                                <button
                                  type="button"
                                  onClick={() => handleMoveDish(index, 'up')}
                                  disabled={index === 0}
                                  className="p-1 rounded bg-gray-50 hover:bg-amber-100 text-gray-500 hover:text-amber-800 disabled:opacity-20 disabled:hover:bg-gray-50 cursor-pointer"
                                  title="Subir posición"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveDish(index, 'down')}
                                  disabled={index === foodItems.length - 1}
                                  className="p-1 rounded bg-gray-50 hover:bg-amber-100 text-gray-500 hover:text-amber-800 disabled:opacity-20 disabled:hover:bg-gray-50 cursor-pointer"
                                  title="Bajar posición"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleOpenEditDish(item)}
                                className="p-2 bg-white border border-gray-200 text-gray-600 hover:border-amber-400 hover:text-amber-800 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                                title="Editar platillo en todos sus campos"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteDish(item.id)}
                                className="p-2 bg-white border border-gray-200 text-gray-500 hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                                title="Eliminar platillo"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}"""

with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

insert_idx = -1
for i, line in enumerate(lines):
    if "adminTab === 'perfil'" in line:
        insert_idx = i - 1
        break

if insert_idx != -1:
    lines.insert(insert_idx, content + "\n")
    with open('src/App.tsx', 'w') as f:
        f.writelines(lines)
    print("Success")
else:
    print("Failed to find insertion point")
