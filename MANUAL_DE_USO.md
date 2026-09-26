# Manual de Uso Operativo del Sistema — BM Desayunos Cony
> **Guía Oficial para la Operación, Administración y Diseño Gráfico del Manual de Usuario**  
> **Versión del Sistema:** 2.4 (Plataforma Restaurantera Multi-Rol & PWA)  
> **Fecha de Emisión:** 2026

---

## 📑 Índice General
1. [Introducción y Visión General del Sistema](#1-introducción-y-visión-general-del-sistema)
2. [Matriz de Roles y Niveles de Acceso](#2-matriz-de-roles-y-niveles-de-acceso)
3. [Área 1: Carta Digital Pública (Comensal y Asistencia)](#3-área-1-carta-digital-pública-comensal-y-asistencia)
4. [Área 2: Cocina / Kanban (Operación del Comal)](#4-área-2-cocina--kanban-operación-del-comal)
5. [Área 3: Caja Chica y Punto de Venta (POS)](#5-área-3-caja-chica-y-punto-de-venta-pos)
6. [Área 4: Clientes Estrella CRM](#6-área-4-clientes-estrella-crm)
7. [Área 7: Cupones y Descuentos](#7-área-5-cupones-y-descuentos)
8. [Área 6: Menú y Platillos (Catálogo de Alimentos)](#8-área-6-menú-y-platillos-catálogo-de-alimentos)
9. [Área 7: Vista Repartidor (Logística y Despacho)](#9-área-7-vista-repartidor-logística-y-despacho)
10. [Área 8: Métricas y Reportes (Dirección y Finanzas)](#10-área-8-métricas-y-reportes-dirección-y-finanzas)
11. [Área 9: Ajustes del Negocio y Seguridad](#11-área-9-ajustes-del-negocio-y-seguridad)
12. [Guía para el Generador Gráfico / IA de Maquetación](#12-guía-para-el-generador-gráfico--ia-de-maquetación)

---

## 1. Introducción y Visión General del Sistema

El sistema **BM Desayunos Cony** es una solución integral diseñada para digitalizar de extremo a extremo las operaciones de un restaurante y comal de desayunos tradicionales:
- **Para los comensales:** Una carta digital dinámica, rápida y accesible desde cualquier smartphone, sin descargas pesadas, que permite armar pedidos personalizados con extras, aplicar cupones y enviar la comanda directamente vía WhatsApp o retiro en mostrador.
- **Para el equipo de trabajo:** Un panel operativo en tiempo real estructurado por áreas con control estricto de roles (Superusuario/Dueño, Cocina, Administrativo y Repartidor), con sincronización en la nube, alarmas sonoras de comandas, geolocalización de entregas y control financiero.

---

## 2. Matriz de Roles y Niveles de Acceso

El sistema cuenta con un control de acceso basado en roles (RBAC) que garantiza que cada colaborador visualice únicamente las herramientas necesarias para su trabajo diario:

| Área del Sistema | 👑 Superusuario / Dueño (`vmedin@gmail.com`) | 🍳 Cocina / Comal | 💼 Administrativo / Caja | 🛵 Repartidor / Mensajero |
| :--- | :---: | :---: | :---: | :---: |
| **Métricas y Reportes** | ✅ Total | ❌ Sin acceso | ❌ Sin acceso | ❌ Sin acceso |
| **Cocina / Kanban** | ✅ Total | ✅ Operativo | ✅ Operativo | ❌ Sin acceso |
| **Caja Chica y POS** | ✅ Total | ❌ Sin acceso | ✅ Operativo | ❌ Sin acceso |
| **Clientes Estrella CRM** | ✅ Total | ❌ Sin acceso | ✅ Operativo | ❌ Sin acceso |
| **Cupones y Descuentos** | ✅ Total | ❌ Sin acceso | ✅ Operativo | ❌ Sin acceso |
| **Menú y Platillos** | ✅ Total | ✅ Operativo | ✅ Operativo | ❌ Sin acceso |
| **Vista Repartidor** | ✅ Total | ❌ Sin acceso | ❌ Sin acceso | ✅ Operativo |
| **Ajustes del Negocio** | ✅ Total | ❌ Sin acceso | ❌ Sin acceso | ❌ Sin acceso |
| **Carta Digital (Apoyar Comensal)** | ✅ Total | ✅ Total | ✅ Total | ✅ Total |

> 💡 **Nota para Modo Demo:** En la parte superior del panel se dispone de un selector rápido para alternar en 1 clic entre los 4 roles y verificar la interfaz que ve cada usuario en tiempo real.

---

## 3. Área 1: Carta Digital Pública (Comensal y Asistencia)

### Objetivo
Permitir al cliente (y al personal en modo apoyo) explorar el catálogo de desayunos tradicionales, configurar opciones personalizadas, aplicar descuentos y generar el pedido sin fricciones.

### Elementos Clave de la Interfaz
1. **Encabezado Comercial:**
   - Logotipo de Doña Cony, eslogan e indicador en tiempo real de apertura del comal (`🟢 Abierto` / `🔴 Cerrado temporalmente`).
   - Botón de acceso al **🔒 Panel de Negocio** para colaboradores autorizados.
2. **Selector de Categorías:**
   - Pestañas rápidas con iconos: Todos, Tortas, Chilaquiles, Enchiladas, Huevos al Gusto, Bebidas, Postres, etc.
   - Barra de búsqueda instantánea por nombre o ingredientes.
3. **Ficha del Platillo:**
   - Fotografía del platillo en alta definición.
   - Nombre, descripción de ingredientes y precio base en moneda nacional (MXN).
   - *(Por diseño de experiencia comensal, las etiquetas de inventario interno están ocultas para no saturar al cliente).*
4. **Modal de Personalización de Platillo:**
   - **Opciones Base:** Selección de salsas (verde, roja, pasilla, mole), término de cocción, tipo de pan/tortilla.
   - **Complementos y Extras con Costo:** Añadir queso extra, huevo adicional, aguacate, porción de carne con sumatoria automática de precio.
   - Selector de cantidad de porciones y botón "Agregar a la comanda".
5. **Carrito y Proceso de Pago (Checkout):**
   - **Tipo de Entrega:** Botones de selección rápida entre `🛵 A Domicilio` y `🏪 Retiro en Local`.
   - **Datos del Cliente:** Nombre, Teléfono celular (clave única para el CRM de lealtad) y Dirección detallada con referencias de entrega.
   - **Sugerencias de Compra Adicional:** Módulo inteligente no invasivo que recomienda exactamente 3 opciones clave (bebidas refrescantes, café de olla y postres tradicionales) para incrementar el ticket promedio.
   - **Cupones de Descuento:** Campo para canjear códigos activos (ej. `CONYLOVE10`). El sistema valida automáticamente el consumo mínimo y los niveles VIP.
   - **Propina Voluntaria:** Botones rápidos de 10%, 15% o monto personalizado en apoyo al personal de cocina y reparto.
   - **Despacho del Pedido:** Botón oficial para enviar comanda vía WhatsApp con folio generado y confirmación en tiempo real.

---

## 4. Área 2: Cocina / Kanban (Operación del Comal)

### Objetivo
Gestionar el flujo de preparación física de los alimentos con control de tiempos, alertas sonoras y visualización ordenada de comandas.

### Flujo de Estados en el Tablero Kanban
El tablero se divide en columnas dinámicas con tarjetas de comanda:
1. **📥 Recibidos (Nuevos):**
   - Comandas que acaban de ingresar desde la carta digital o punto de venta.
   - **Alarma acústica y visual:** Alerta automática para avisar al cocinero de una nueva orden.
   - Cronómetro de tiempo transcurrido respecto al SLA estándar (promedio 25 minutos).
2. **🍳 En Preparación:**
   - Comandas pasadas al comal. El cocinero tiene a la vista los ingredientes específicos, notas del cliente ("sin cebolla", "salsa roja aparte") y extras añadidos.
3. **✅ Listos (Empacados):**
   - Comandas terminadas y empaquetadas.
   - Si es **Retiro en Local**, el comensal es notificado para recoger en barra.
   - Si es **A Domicilio**, la comanda queda disponible para que el mensajero la tome.

### Herramientas de Cocina
- **Botón de Impresión de Comanda:** Genera el ticket térmico para colocar en la barra de despacho.
- **Control Rápido de Stock:** Botón en cabecera para abrir/cerrar inventario o pausar platillos agotados en el turno.
- **Filtro de Órdenes:** Búsqueda por folio de orden o nombre de comensal.

---

## 5. Área 3: Caja Chica y Punto de Venta (POS)

### Objetivo
Registrar ventas directas de mostrador, cobrar en diferentes modalidades y llevar un arqueo exacto de las entradas y salidas de efectivo en el turno.

### Funcionalidades
1. **Punto de Venta Rápido (POS):**
   - Agregador de órdenes para comensales que pagan en barra física.
   - Selección ágil de platillos y cálculo automático del cambio en efectivo.
2. **Modalidades de Pago:**
   - `💵 Efectivo` con cálculo de importe recibido y cambio devuelto.
   - `📱 Transferencia Bancaria` con confirmación de folio.
3. **Libro de Caja Chica (Egresos Operativos):**
   - Registro de compras de emergencia para el turno: gas LP, verduras de reposición, desechables o hielo.
   - Formulario con concepto, importe en MXN y fecha/hora.
4. **Balance del Turno en Vivo:**
   - Total de ventas acumuladas en efectivo.
   - Total de ventas vía transferencia.
   - Total de gastos descontados.
   - **Saldo neto en caja física** disponible para corte diario.

---

## 6. Área 4: Clientes Estrella CRM

### Objetivo
Fidelizar a la clientela habitual y recompensar a los comensales frecuentes mediante seguimiento automatizado del número telefónico.

### Criterio de Unificación
- El número de teléfono celular actúa como **identificador maestro inmutable**. Cada comanda realizada acumula automáticamente el historial y gasto total del cliente.

### Niveles de Lealtad (Tiers)
- 🥉 **Nuevo:** Comensales en su 1ª o 2ª compra.
- 🥈 **Frecuente:** De 3 a 7 pedidos acumulados.
- 🥇 **Honor:** De 8 a 15 pedidos acumulados con consumo regular.
- 💎 **Estrella (VIP):** Más de 15 pedidos o gasto preferencial alto. Reciben beneficios exclusivos y promociones directas.

### Herramientas del CRM
- **Contacto en 1 toque:** Enlace directo para abrir chat de WhatsApp o llamada telefónica para seguimiento de calidad.
- **Historial de Consumo:** Detalle de órdenes previas, dirección habitual de entrega y platillos favoritos.

---

## 7. Área 5: Cupones y Descuentos

### Objetivo
Crear promociones dirigidas y temporales para aumentar las ventas en días festivos o premiar clientes recurrentes.

### Configuración del Cupón
1. **Código Promocional:** Texto en mayúsculas sin espacios (ej. `DESAYUNOCONY`, `PROMO15`).
2. **Porcentaje de Descuento:** Valor numérico del 5% al 50%.
3. **Monto Mínimo de Compra:** Cantidad mínima en MXN que debe tener el subtotal para poder aplicarse.
4. **Audiencia Objetivo (Segmentación):**
   - Todos los clientes
   - Exclusivo Clientes Estrella (VIP)
   - Exclusivo Nuevos clientes (para captación)
5. **Interruptor de Estatus:** Activación o suspensión inmediata del cupón con un interruptor visual.

---

## 8. Área 6: Menú y Platillos (Catálogo de Alimentos)

### Objetivo
Administrar el menú oficial del restaurante, precios, fotografías, descripciones, extras y disponibilidad física.

### Operaciones Disponibles
1. **Alta de Platillo:**
   - Nombre oficial, categoría gastronómica, precio regular y descripción suculenta.
   - Carga de fotografía con compresión inteligente automática para rendimiento ultrarrápido.
2. **Grupos de Opciones y Variantes:**
   - Creación de preguntas obligatorias o múltiples (ej. "Tipo de salsa", "Término de la yema").
   - Creación de extras con costo (ej. "Queso gratinado +$15.00", "Arrachera extra +$35.00").
3. **Visibilidad Selectiva (Ocultar Platillo):**
   - Permite apagar un platillo del menú digital del comensal cuando se agota un insumo clave, manteniéndolo visible internamente para cocina y caja sin borrar su configuración.
4. **Restauración del Menú Oficial:**
   - Botón maestro para sincronizar o restablecer el catálogo de 21 desayunos tradicionales preconfigurados de Doña Cony.

---

## 9. Área 7: Vista Repartidor (Logística y Despacho)

### Objetivo
Brindar al mensajero una interfaz ultraligera, optimizada para celular montado en motocicleta o bicicleta, que le permita entregar pedidos con máxima seguridad y rapidez.

### Características de la Vista Móvil
- **Filtro Exclusivo de Ruta:** Muestra únicamente comandas despachadas con estatus `🛵 En Camino`.
- **Botones Táctiles de Acción Inmediata:**
  1. 📍 **Ruta GPS:** Abre Google Maps o Waze con las coordenadas y dirección de entrega exactas.
  2. 📞 **Llamar Cliente:** Dispara la llamada celular directa sin necesidad de teclear el número.
  3. 💬 **WhatsApp al Cliente:** Abre chat prellenado ("Hola, soy tu repartidor de Doña Cony, voy llegando a tu domicilio...").
- **Marcado de Entrega:** Botón de confirmación `Entregado al comensal` que finaliza la comanda, guarda la hora de entrega y actualiza el sistema general.

---

## 10. Área 8: Métricas y Reportes (Dirección y Finanzas)

### Objetivo
Proveer al Dueño y Superusuario una radiografía visual exacta del desempeño comercial y financiero del restaurante.

### Indicadores Clave (KPIs)
- **Venta Total Bruta y Neta:** Facturación del período seleccionado.
- **Ticket Promedio:** Gasto medio por pedido procesado.
- **Volumen de Comandas:** Total de órdenes exitosas frente a canceladas.
- **Margen Operativo:** Relación entre ingresos por ventas y salidas de caja chica registradas.

### Funcionalidades Analíticas
- **Filtros Temporales:** Hoy, Esta Semana, Este Mes o Rango Personalizado de fechas.
- **Top Platillos Más Vendidos:** Ranking de los 5 alimentos más demandados para planificar compras de materia prima.
- **Exportación e Impresión:** Diseño listo para descargar o imprimir resumen ejecutivo para reuniones o archivo contable.

---

## 11. Área 9: Ajustes del Negocio y Seguridad

### Objetivo
Centralizar la parametrización de identidad de marca, horarios de servicio, teléfonos oficiales y control del equipo humano.

### Parámetros Configurables
1. **Identidad de Marca:** Nombre del restaurante, eslogan publicitario, logotipo oficial y pie de ticket personalizado.
2. **Canales de Comunicación:** Teléfono de WhatsApp para recepción de pedidos y teléfono del repartidor en turno.
3. **Reglas Operativas:** Tarifa estándar de envío a domicilio, porcentaje de propina sugerida y porciones iniciales de comal.
4. **Horarios de Apertura y Cierre:**
   - Horario matutino programado (ej. 07:30 a 13:30).
   - Interruptor de operación 24 horas.
   - **Interruptor Forzado Manual:** Permite cerrar temporalmente la tienda ante contingencias climáticas o saturación del comal.
5. **Control de Usuarios y Auditoría Interna:**
   - Supervisión de personal autorizado.
   - **Bitácora Inmutable (Audit Trail):** Registro cronológico de acciones clave (quién abrió tienda, quién eliminó gastos, quién modificó precios).

---

## 12. Guía para el Generador Gráfico / IA de Maquetación

Al procesar este documento en una herramienta de maquetación (ej. Gamma, Canva, InDesign, Midjourney para mockups o generador de PDF con IA), aplica las siguientes directrices estilísticas:

1. **Paleta de Color Institucional:**
   - **Color Principal:** Ámbar cálido / Miel tostada (`#d97706`, `amber-600`) — Evoca calor de hogar y sabor tradicional.
   - **Color Secundario:** Naranja comal (`#ea580c`, `orange-600`) — Acentúa botones de compra y llamadas a la acción.
   - **Color de Acento:** Verde esmeralda (`#059669`, `emerald-600`) — Indicadores de tienda abierta, pedidos entregados y finanzas positivas.
   - **Fondos y Contraste:** Crema suave (`#fffbeb`, `amber-50`) con tipografía marrón café oscuro (`#451a03`, `amber-950`) para máxima legibilidad.
2. **Estilo Tipográfico:**
   - Encabezados: Tipografía Serif elegante (ej. *Playfair Display*, *Merriweather* o *Georgia*) que refleje tradición y sazón casero.
   - Textos de cuerpo y tablas: Tipografía Sans-serif moderna y limpia (ej. *Inter*, *Plus Jakarta Sans* o *Roboto*).
3. **Estructura de Fichas por Área:**
   - Cada sección debe contar con:
     - 📌 Icono representativo del área.
     - 🎯 Propósito operativo en una frase.
     - 👥 Roles con permiso de acceso.
     - 📱 Captura o mockup de la pantalla.
     - 🪜 Paso a paso numerado para tareas cotidianas.
