# Quickstart: Validación de Catálogo, Carrito, Checkout por WhatsApp y Administración

**Feature**: 001-catalogo-carrito-admin | **Date**: 2026-07-07

Guía para validar manualmente, extremo a extremo, cada historia de usuario del spec una vez
implementadas las tareas de esta feature. No sustituye una suite automatizada (fuera de alcance,
ver `research.md`); es la forma de comprobar que "funciona" antes de dar por cerrada la feature.

## Prerrequisitos

1. Proyecto de Firebase real creado, con Authentication (email/password) y Firestore habilitados.
2. `.env.local` completo con las 6 variables `VITE_FIREBASE_*` (ver Constitución §11).
3. `firestore.rules` y `firestore.indexes.json` desplegados al proyecto de Firebase
   (`firebase deploy --only firestore:rules,firestore:indexes`, ejecutado manualmente o vía CLI —
   no vía GitHub Actions, que es solo al final).
4. Al menos un usuario de Firebase Authentication creado, con su `uid` dado de alta manualmente
   como documento en `admins/{uid}`.
5. Documento `config/general` creado con `whatsappNumero` y opcionalmente `dolarBlueManual`.
6. Al menos 3-5 perfumes de prueba cargados en `perfumes` (directamente en la consola de Firebase
   o vía el panel admin una vez implementado), cubriendo distintos géneros/marcas/familias, con
   `activo: true` y `disponible: true`.

## Levantar el entorno

```bash
npm install
npm run dev
```

Abrir la URL local que indique Vite (por defecto `http://localhost:5173`).

## Validación por historia de usuario

### Historia 1 — Navegar el catálogo (P1)

1. Entrar a `/catalogo` sin iniciar sesión.
2. Verificar que se listan los perfumes con `activo: true` y `disponible: true` cargados en el
   prerrequisito, y que ninguno marcado como no disponible aparece.
3. Aplicar un filtro de género, luego de marca, luego de familia olfativa: la lista se reduce
   correctamente en cada caso.
4. Escribir un término de búsqueda que coincida con el nombre o marca de un perfume: solo ese
   perfume (o los que matchean) aparece.
5. Abrir el detalle de un perfume (`/perfume/:id`): confirmar que se ven notas, descripción,
   volumen y **ambos precios** (transferencia y efectivo).
6. Abrir el detalle de un id inexistente: confirmar que aparece la página "Perfume no encontrado"
   con acción para volver al catálogo (FR-035), no un error sin manejar.

### Historia 2 — Armar y modificar el carrito (P1)

1. Desde el catálogo o el detalle, agregar un perfume al carrito.
2. Agregar el mismo perfume una segunda vez: confirmar que el carrito muestra una sola línea con
   cantidad 2, no dos líneas.
3. Ir a `/carrito`: aumentar/disminuir cantidad y verificar que el subtotal se recalcula al
   instante.
4. Quitar un producto del carrito: confirma que desaparece y el total baja.
5. Vaciar el carrito completo: verificar el mensaje de carrito vacío con invitación al catálogo.
6. Recargar la página (F5) con productos en el carrito: confirmar que el carrito persiste
   (FR-031, `localStorage`).

### Historia 3 — Checkout por WhatsApp (P1)

1. Con productos en el carrito, elegir "Efectivo": confirmar que se muestra un descuento del 5%
   y el total con descuento (FR-011).
2. Cambiar a "Transferencia": confirmar que el total vuelve al valor sin descuento.
3. Intentar confirmar sin completar el nombre del cliente: confirmar que el sistema bloquea y
   pide el nombre (FR-012).
4. Completar el nombre y confirmar el pedido: verificar que (a) se abre una ventana/pestaña de
   WhatsApp con el resumen del pedido, y (b) el pedido queda guardado en la colección `pedidos`
   de Firestore con los datos correctos (revisar en la consola de Firebase).
5. Volver a la tienda: confirmar que el carrito quedó vacío (FR-016).
6. Con el carrito vacío, intentar acceder directamente a confirmar un pedido: confirmar que el
   sistema lo impide (FR-013).
7. **Caso de disponibilidad**: agregar un perfume al carrito, luego (en otra pestaña o desde la
   consola de Firebase) marcarlo como no disponible, y volver al carrito: confirmar que se avisa
   al cliente y el producto se quita automáticamente (FR-030).
8. **Caso sin cotización**: si es posible simular que no hay cotización automática ni
   `dolarBlueManual` cargado, confirmar que los precios se muestran en USD con la leyenda
   "Cotización no disponible" (FR-033), sin precios en $0 o `NaN`.

### Historia 4 — Administrar el catálogo de perfumes (P2)

1. Ir a `/login` e iniciar sesión con el usuario admin del prerrequisito.
2. Ir a `/admin/perfumes`: cargar un perfume nuevo con todos los campos obligatorios completos.
3. Verificar que el perfume nuevo aparece de inmediato en `/catalogo` (si quedó disponible).
4. Editar el precio o la descripción de un perfume existente: confirmar que el cambio se refleja
   en el catálogo público sin demora perceptible.
5. Marcar un perfume como no disponible: confirmar que desaparece del catálogo público pero sigue
   visible en `/admin/perfumes`.
6. Intentar guardar un perfume nuevo sin un campo obligatorio (ej. sin precio): confirmar que el
   sistema bloquea el guardado e indica qué falta.
7. Cerrar sesión (o abrir en una ventana privada) e intentar entrar directamente a
   `/admin/perfumes`: confirmar que redirige a `/login`.

### Historia 5 — Consultar y hacer seguimiento de pedidos (P2)

1. Habiendo generado al menos un pedido en la Historia 3, entrar a `/admin/pedidos` como admin.
2. Confirmar que el pedido más reciente aparece primero en el listado.
3. Abrir el detalle de un pedido: confirmar que muestra productos, cantidades, método de pago,
   descuento, total y nombre del cliente, coincidiendo con lo registrado en Firestore.
4. Sin sesión de admin, intentar acceder a `/admin/pedidos`: confirmar redirección a `/login`.

### Historia 6 — Administrar promociones (P3)

1. Como admin, crear una promoción con título, descripción, imagen (URL externa) y marcarla activa.
2. Verificar que aparece en la portada pública (`/`).
3. Crear una segunda promoción con distinto `orden`: confirmar que el orden de aparición en la
   portada respeta el valor configurado.
4. Marcar una promoción como inactiva: confirmar que desaparece de la portada pública de
   inmediato.

### Historia 7 — Configurar datos generales (P3)

1. Como admin, entrar a `/admin/config` y cambiar el número de WhatsApp.
2. Generar un pedido nuevo desde el flujo de cliente (Historia 3): confirmar que el link de
   WhatsApp usa el número actualizado.
3. Cambiar el valor de `dolarBlueManual`: forzar (si es posible) el escenario sin cotización
   automática y confirmar que los precios en ARS usan el nuevo valor de respaldo.
4. Sin sesión de admin, intentar acceder a `/admin/config`: confirmar redirección a `/login`.

## Criterio de cierre de la feature

La feature se considera validada cuando las 7 historias anteriores pasan sus pasos sin
excepciones, y los 7 Success Criteria del spec (`SC-001` a `SC-007`) se verifican de forma
razonable durante estas pruebas manuales (tiempos aproximados, no medición instrumentada).
