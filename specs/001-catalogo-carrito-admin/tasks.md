# Tasks: Catálogo, Carrito, Checkout por WhatsApp y Administración

**Input**: Design documents from `/specs/001-catalogo-carrito-admin/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md (todos presentes)

**Tests**: No solicitados en el spec ni por el usuario en ningún módulo aprobado — omitidos
(ver `research.md`, Principio VI de la constitución). La validación se hace manualmente vía
`quickstart.md` en la Fase final.

**Organization**: Tareas agrupadas por historia de usuario (spec.md) para permitir
implementación y prueba independiente de cada una.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivo distinto, sin dependencias pendientes)
- **[Story]**: Historia de usuario a la que pertenece (US1..US7)
- Se incluye la ruta de archivo exacta en cada descripción

## Path Conventions

Proyecto único Vite + React ya inicializado (ver commit "setup inicial del proyecto" y
`plan.md` → Project Structure). Todas las rutas son relativas a la raíz del repo, bajo `src/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Ya completado** en el módulo previo "setup inicial del proyecto": estructura de carpetas,
`package.json` con todas las dependencias, Vite, Tailwind con tokens de identidad visual,
`firebase/config.js`, `firestore.rules`, `firestore.indexes.json`, `App.jsx` con
Router+Contexts+QueryClient, y placeholders de página. No hay tareas nuevas de Setup para esta
feature — el trabajo arranca directamente en Foundational.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestructura compartida por todas las historias — constantes, utilidades de
precio/formato, configuración general, componentes base de UI, layout y autenticación de admin.

**⚠️ CRITICAL**: Ninguna historia de usuario puede darse por completa hasta que esta fase termine.

- [X] T001 [P] Crear `src/constants/index.js` con `WHATSAPP_NUMERO`, `GENEROS`,
  `FAMILIAS_OLFATIVAS`, `MARCAS`, `METODOS_PAGO`, `DESCUENTO_EFECTIVO`, `FACTOR_EFECTIVO`,
  `ESTADOS_PEDIDO`, `DOLAR_BLUE_API` (Constitución §13)
- [X] T002 [P] Crear `src/utils/format.js` con `formatARS(valor)` y `formatUSD(valor)`
- [X] T003 [P] Crear `src/utils/precios.js` con `valorDolarMedio(dolar)`, `usdAArs(precioUSD, dolarMedio)`,
  `preciosPorMetodo(precioUSD, dolarMedio)` (Constitución §8.1)
- [X] T004 Crear `src/services/configService.js` con `obtenerConfig()` (lee `config/general`
  vía SDK Firestore v9+)
- [X] T005 Crear `src/hooks/useConfig.js` con query de `config/general` usando TanStack Query
  (depende de T004)
- [X] T006 Crear `src/hooks/useDolarBlue.js`: fetch a `DOLAR_BLUE_API`, cálculo de
  `valorDolarMedio`, fallback a `config/general.dolarBlueManual` si falla, y bandera `esFallback`
  para activar FR-033 cuando tampoco hay fallback cargado (depende de T001, T003, T005)
- [X] T007 [P] Crear `src/components/ui/Button.jsx`
- [X] T008 [P] Crear `src/components/ui/GlassCard.jsx`
- [X] T009 [P] Crear `src/components/ui/Badge.jsx`
- [X] T010 [P] Crear `src/components/ui/Modal.jsx`
- [X] T011 [P] Crear `src/components/ui/Spinner.jsx`
- [X] T012 [P] Crear `src/components/layout/Navbar.jsx` (navegación pública + acceso a carrito)
- [X] T013 [P] Crear `src/components/layout/Footer.jsx`
- [X] T014 Crear `src/components/layout/AdminLayout.jsx`: navegación entre Dashboard/Perfumes/
  Pedidos/Promociones/Config + acción de cerrar sesión (usa `useAuth` ya existente)
- [X] T015 [P] Crear `src/schemas/loginSchema.js` (Zod: email, password requeridos)
- [X] T016 Implementar `src/pages/Login.jsx` real: formulario con React Hook Form + Zod
  (`loginSchema`), `signInWithEmailAndPassword`, redirección a `/admin` si el usuario resulta
  admin (depende de T015)
- [X] T017 Implementar `src/pages/admin/Dashboard.jsx` como landing simple de admin con accesos
  rápidos a Perfumes/Pedidos/Promociones/Config (sin analítica de estadísticas — fuera de
  alcance de este spec) (depende de T014)
- [X] T018 Conectar `Navbar`/`Footer` a las rutas públicas y `AdminLayout` a las rutas `/admin/*`
  en `src/router/AppRouter.jsx` (depende de T012, T013, T014)

**Checkpoint**: Fundación lista — las historias de usuario pueden implementarse a continuación.

---

## Phase 3: User Story 1 - Navegar el catálogo de perfumes (Priority: P1) 🎯 MVP

**Goal**: Un visitante puede listar, filtrar, buscar y ver el detalle de cualquier perfume
disponible, con ambos precios siempre visibles.

**Independent Test**: Con perfumes de prueba cargados en Firestore, entrar a `/catalogo` sin
sesión, filtrar/buscar, y abrir un detalle — sin que exista carrito ni checkout implementados.

### Implementation for User Story 1

- [X] T019 [P] [US1] Crear `src/services/perfumesService.js` con `listarPerfumesPublicos(filtros)`
  y `obtenerPerfumePorId(id)` (solo lectura; filtra `activo == true` y `disponible == true`)
- [X] T020 [P] [US1] Crear `src/hooks/usePerfumes.js` (TanStack Query sobre
  `listarPerfumesPublicos`, filtros como query key) (depende de T019)
- [X] T021 [P] [US1] Crear `src/hooks/usePerfume.js` (TanStack Query sobre
  `obtenerPerfumePorId`) (depende de T019)
- [X] T022 [US1] Crear `src/components/perfumes/NotasOlfativas.jsx` (salida/corazón/fondo)
- [X] T023 [US1] Crear `src/components/perfumes/PerfumeCard.jsx` (props: `perfume`, `dolarMedio`;
  muestra ambos precios vía `preciosPorMetodo`; botón "Agregar al carrito" ya presente en el
  markup, su conexión real al carrito se completa en US2)
- [X] T024 [US1] Crear `src/components/perfumes/Filtros.jsx` (género/marca/familia olfativa/
  búsqueda por texto, componente controlado)
- [X] T025 [US1] Crear `src/components/perfumes/PerfumeGrid.jsx` (renderiza `PerfumeCard` por
  cada perfume) (depende de T023)
- [X] T026 [US1] Implementar `src/pages/Catalogo.jsx` real: `Filtros` + `PerfumeGrid` +
  `usePerfumes` + `useDolarBlue` (depende de T020, T024, T025, T006)
- [X] T027 [US1] Implementar `src/pages/PerfumeDetalle.jsx` real: notas, descripción, volumen,
  ambos precios, y estado "Perfume no encontrado" con CTA al catálogo cuando el id no existe o
  fue dado de baja (FR-035) (depende de T021, T022, T006)
- [X] T028 [US1] Implementar sección de destacados en `src/pages/Home.jsx` usando `usePerfumes`
  filtrado por `destacado == true` (depende de T020, T023)

**Checkpoint**: User Story 1 completamente funcional y testeable de forma independiente.

---

## Phase 4: User Story 2 - Armar y modificar el carrito de compra (Priority: P1) 🎯 MVP

**Goal**: Un cliente puede agregar perfumes al carrito, ver el resumen, ajustar cantidades y
quitar productos, con el total siempre actualizado y persistido entre visitas.

**Independent Test**: Agregar uno o más perfumes desde el catálogo (US1), verificar cantidades y
totales correctos, y modificar el carrito — sin necesidad de checkout real.

### Implementation for User Story 2

- [X] T029 [P] [US2] Crear `src/utils/cartStorage.js`: `leerCarrito()` / `guardarCarrito(estado)`
  sobre `localStorage`
- [X] T030 [US2] Conectar `src/context/CartContext.jsx` a `cartStorage`: cargar estado inicial al
  montar y persistir en cada cambio de `items`/`metodoPago` (FR-031) (depende de T029)
- [X] T031 [US2] Crear `src/components/cart/CartItem.jsx` (ajustar cantidad, quitar producto)
- [X] T032 [US2] Implementar `src/pages/Carrito.jsx` (versión listado): renderiza `CartItem` por
  ítem, subtotal actualizado en vivo (FR-009), estado de carrito vacío con invitación al catálogo
  (depende de T030, T031)
- [X] T033 [US2] Conectar el botón "Agregar al carrito" de `PerfumeCard` (T023) y
  `PerfumeDetalle` (T027) al `CartContext.dispatch({ type: 'ADD_ITEM', ... })`, consolidando
  cantidades del mismo perfume en una sola línea (FR-007) (depende de T030, T023, T027)

**Checkpoint**: User Stories 1 y 2 funcionan de forma independiente y en conjunto.

---

## Phase 5: User Story 3 - Confirmar el pedido y cerrarlo por WhatsApp (Priority: P1) 🎯 MVP

**Goal**: Un cliente con productos en el carrito elige método de pago, confirma con su nombre, el
pedido queda registrado en Firestore y se abre WhatsApp con el resumen — completando el circuito
mínimo de venta.

**Independent Test**: Armar un carrito (US1+US2), elegir método de pago, confirmar con nombre, y
verificar que el pedido se registra con el total correcto y se abre la conversación de WhatsApp.

### Implementation for User Story 3

- [X] T034 [P] [US3] Crear `src/schemas/pedidoSchema.js` (Zod: `items` no vacío, `metodoPago` ∈
  `METODOS_PAGO`, `clienteNombre` requerido no vacío)
- [X] T035 [P] [US3] Crear `src/utils/whatsapp.js` con `generarLinkWhatsApp({ clienteNombre,
  items, metodoPago, total })` (Constitución §8.2)
- [X] T036 [US3] Crear `src/services/pedidosService.js` con `crearPedido(pedido)` (valida con
  `pedidoSchema` antes de escribir; `estado: 'confirmado'` fijo) (depende de T034)
- [X] T037 [US3] Crear `src/hooks/usePedidos.js` con mutation `useCrearPedido` (TanStack Query)
  (depende de T036)
- [X] T038 [US3] Crear `src/components/cart/SelectorPago.jsx` (Transferencia/Efectivo,
  componente controlado)
- [X] T039 [US3] Crear `src/components/cart/ResumenCheckout.jsx`: subtotal, descuento del 5% si
  `Efectivo` (FR-011), total, y leyenda "Cotización no disponible" cuando `useDolarBlue` indique
  `esFallback` sin valor (FR-033) (depende de T006)
- [X] T040 [US3] Completar `src/pages/Carrito.jsx` con el flujo de checkout: input de nombre
  obligatorio (FR-012), bloqueo de confirmación con carrito vacío (FR-013), verificación de
  disponibilidad de cada perfume contra `usePerfume`/`usePerfumes` antes de confirmar — avisando y
  quitando del carrito los que ya no estén disponibles (FR-030) —, guardar pedido (T037), abrir
  WhatsApp (T035), y vaciar el carrito al confirmar (FR-016) (depende de T032, T035, T037, T038,
  T039, T020)

**Checkpoint**: User Stories 1, 2 y 3 completan el circuito de compra — **MVP funcional de la
tienda**.

---

## Phase 6: User Story 4 - Administrar el catálogo de perfumes (Priority: P2)

**Goal**: Un administrador autenticado da de alta, edita y oculta perfumes del catálogo público.

**Independent Test**: Iniciar sesión como admin (T016), cargar un perfume nuevo, editarlo y
marcarlo no disponible, verificando el reflejo (o no) en el catálogo público (US1).

### Implementation for User Story 4

- [ ] T041 [P] [US4] Crear `src/schemas/perfumeSchema.js` (Zod: campos obligatorios FR-020,
  `genero` ∈ `GENEROS`, `marca` ∈ `MARCAS`, `familiaOlfativa` ∈ `FAMILIAS_OLFATIVAS`)
- [ ] T042 [US4] Extender `src/services/perfumesService.js` con `crearPerfume(datos)`,
  `editarPerfume(id, datos)`, `actualizarDisponibilidad(id, disponible)` (depende de T019, T041)
- [ ] T043 [US4] Crear `src/components/admin/PerfumeForm.jsx` (React Hook Form + `zodResolver`
  sobre `perfumeSchema`, para alta y edición) (depende de T041)
- [ ] T044 [US4] Crear `src/components/admin/PerfumesTable.jsx` (listado admin con acciones
  editar / marcar no disponible)
- [ ] T045 [US4] Implementar `src/pages/admin/AdminPerfumes.jsx` real: `PerfumesTable` +
  `PerfumeForm` + `perfumesService` (depende de T042, T043, T044)

**Checkpoint**: User Story 4 funcional de forma independiente sobre el catálogo de US1.

---

## Phase 7: User Story 5 - Consultar y hacer seguimiento de los pedidos (Priority: P2)

**Goal**: Un administrador autenticado consulta el listado de pedidos confirmados y su detalle
completo.

**Independent Test**: Generar pedidos desde el flujo de cliente (US3) y verificar que un admin
los ve listados (más recientes primero) y puede abrir el detalle de cada uno.

### Implementation for User Story 5

- [ ] T046 [US5] Extender `src/services/pedidosService.js` con `listarPedidos()` (orden
  `createdAt` desc) y `obtenerPedidoPorId(id)` (depende de T036)
- [ ] T047 [US5] Extender `src/hooks/usePedidos.js` con `usePedidosList` y `usePedidoDetalle`
  (depende de T046)
- [ ] T048 [US5] Crear `src/components/admin/PedidosTable.jsx` (listado ordenado)
- [ ] T049 [US5] Crear `src/components/admin/PedidoDetalle.jsx` (productos, cantidades, método
  de pago, descuento, total, nombre del cliente)
- [ ] T050 [US5] Implementar `src/pages/admin/AdminPedidos.jsx` real: `PedidosTable` +
  `PedidoDetalle` (depende de T047, T048, T049)

**Checkpoint**: User Story 5 funcional de forma independiente sobre los pedidos generados en US3.

---

## Phase 8: User Story 6 - Administrar promociones destacadas (Priority: P3)

**Goal**: Un administrador autenticado publica y ordena promociones visibles en la portada.

**Independent Test**: Crear una promoción como admin y verificar que aparece (u oculta, si se
desactiva) en la portada pública en el orden configurado.

### Implementation for User Story 6

- [ ] T051 [P] [US6] Crear `src/services/promocionesService.js` con CRUD completo
  (`listarActivas()`, `listarTodas()`, `crearPromocion`, `editarPromocion`, `eliminarPromocion`)
- [ ] T052 [US6] Crear `src/hooks/usePromociones.js` (query de activas para portada, query de
  todas para admin) (depende de T051)
- [ ] T053 [US6] Crear `src/components/admin/PromocionForm.jsx` (título, descripción, imagen URL,
  activa, orden)
- [ ] T054 [US6] Crear `src/components/admin/PromocionesTable.jsx`
- [ ] T055 [US6] Implementar `src/pages/admin/AdminPromociones.jsx` real: `PromocionesTable` +
  `PromocionForm` (depende de T052, T053, T054)
- [ ] T056 [US6] Agregar sección de promociones activas (ordenadas por `orden`) a
  `src/pages/Home.jsx` (depende de T028, T052)

**Checkpoint**: User Story 6 funcional de forma independiente sobre la portada de US1.

---

## Phase 9: User Story 7 - Configurar datos generales del negocio (Priority: P3)

**Goal**: Un administrador autenticado actualiza el número de WhatsApp y el valor de referencia
del dólar de respaldo.

**Independent Test**: Editar ambos valores como admin y verificar que un pedido nuevo usa el
número actualizado, y que los precios usan el valor de respaldo cuando falta la cotización
automática.

### Implementation for User Story 7

- [ ] T057 [US7] Extender `src/services/configService.js` con `actualizarConfig(datos)` (depende
  de T004)
- [ ] T058 [US7] Extender `src/hooks/useConfig.js` con mutation `useActualizarConfig` (depende de
  T005, T057)
- [ ] T059 [US7] Crear `src/components/admin/ConfigForm.jsx` (`whatsappNumero`,
  `dolarBlueManual`)
- [ ] T060 [US7] Implementar `src/pages/admin/AdminConfig.jsx` real: `ConfigForm` +
  `useConfig`/`useActualizarConfig` (depende de T058, T059)

**Checkpoint**: Las 7 historias de usuario están funcionales de forma independiente.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Validación final y mejoras transversales a todas las historias.

- [ ] T061 [P] Ejecutar la guía completa de `specs/001-catalogo-carrito-admin/quickstart.md`
  (las 7 historias) y registrar resultados
- [ ] T062 [P] Revisar comportamiento responsive (mobile/desktop) en `Catalogo`, `PerfumeDetalle`
  y `Carrito`
- [ ] T063 Revisar manejo de errores de Firestore (permisos, red) con mensajes claros al usuario
  en `perfumesService.js`, `pedidosService.js` y `configService.js`
- [ ] T064 Limpieza final: eliminar `console.log` de debug y cualquier resto de contenido
  placeholder en `src/pages/`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Ya completado — sin tareas.
- **Foundational (Phase 2)**: Sin dependencias externas — BLOQUEA todas las historias.
- **User Stories (Phase 3-9)**: Todas dependen de Foundational. US1, US2 y US3 son P1 (MVP) y se
  recomiendan en ese orden por dependencias internas (US2 usa componentes de US1; US3 usa el
  carrito de US2). US4 y US5 (P2) son independientes entre sí y de US1-3 salvo por reutilizar
  `perfumesService`/`pedidosService`. US6 y US7 (P3) son independientes entre sí.
- **Polish (Phase 10)**: Depende de que todas las historias deseadas estén completas.

### User Story Dependencies

- **US1 (P1)**: Solo depende de Foundational.
- **US2 (P1)**: Depende de Foundational y de los componentes `PerfumeCard`/`PerfumeDetalle` de
  US1 (T033), aunque el carrito en sí (T029-T032) es independiente.
- **US3 (P1)**: Depende de Foundational y del carrito de US2 (usa `Carrito.jsx` de T032).
- **US4 (P2)**: Depende de Foundational y reutiliza `perfumesService.js` de US1 (T019).
- **US5 (P2)**: Depende de Foundational y reutiliza `pedidosService.js` de US3 (T036).
- **US6 (P3)**: Depende de Foundational; agrega una sección a `Home.jsx` creada en US1 (T028).
- **US7 (P3)**: Depende de Foundational; reutiliza `configService.js`/`useConfig.js` (T004, T005).

### Within Each User Story

- Servicios antes que hooks; hooks antes que componentes que los consumen; componentes antes que
  la página que los ensambla.
- Cada historia debe quedar completa antes de considerar cerrada su fase.

### Parallel Opportunities

- Todas las tareas [P] de Foundational (T001-T003, T007-T011, T012-T013, T015) pueden ejecutarse
  en paralelo entre sí.
- Dentro de US1: T019, T020, T021 en paralelo (archivos distintos); igual T022-T024 antes de
  ensamblar T025-T028.
- US4, US5, US6 y US7 pueden desarrollarse en paralelo entre sí una vez completado US1-US3, si hay
  capacidad de equipo, ya que tocan archivos y páginas distintas.

---

## Parallel Example: Foundational

```bash
Task: "Crear src/constants/index.js con constantes del sistema"
Task: "Crear src/utils/format.js con formatARS/formatUSD"
Task: "Crear src/utils/precios.js con valorDolarMedio/usdAArs/preciosPorMetodo"
Task: "Crear src/components/ui/Button.jsx"
Task: "Crear src/components/ui/GlassCard.jsx"
Task: "Crear src/components/ui/Badge.jsx"
Task: "Crear src/components/ui/Modal.jsx"
Task: "Crear src/components/ui/Spinner.jsx"
```

## Parallel Example: User Story 1

```bash
Task: "Crear src/services/perfumesService.js con listarPerfumesPublicos/obtenerPerfumePorId"
Task: "Crear src/hooks/usePerfumes.js"
Task: "Crear src/hooks/usePerfume.js"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 + 3)

1. Completar Phase 2: Foundational (bloqueante).
2. Completar Phase 3: User Story 1 (navegar catálogo).
3. Completar Phase 4: User Story 2 (armar carrito).
4. Completar Phase 5: User Story 3 (checkout por WhatsApp).
5. **STOP y VALIDAR**: correr `quickstart.md` Historias 1-3 de punta a punta — este es el
   producto mínimo viable de la tienda (venta real posible).

### Incremental Delivery

1. Foundational → Fundación lista.
2. US1 → probar independientemente → catálogo navegable.
3. US2 → probar independientemente → carrito funcional.
4. US3 → probar independientemente → **MVP completo, primera venta posible**.
5. US4 → administración de catálogo sin depender de las demás historias P2/P3.
6. US5 → seguimiento de pedidos.
7. US6 → promociones (mejora incremental, no bloqueante).
8. US7 → configuración general (mantenimiento, no bloqueante).
9. Polish → validación completa de `quickstart.md` y cierre de la feature.

---

## Notes

- [P] = archivos distintos, sin dependencias pendientes entre sí.
- El MVP de esta feature son las historias P1 (US1+US2+US3): sin ellas no hay venta posible.
- US4-US7 aportan valor incremental de administración pero la tienda es utilizable sin ellas
  (con datos cargados manualmente en Firestore).
- Sin tareas de test automatizado por decisión ya documentada en `plan.md`/`research.md`.
- Commitear después de cada tarea o grupo lógico, siguiendo el mismo patrón de commits usados
  hasta ahora (un commit por módulo aprobado).
