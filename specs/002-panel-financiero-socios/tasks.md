# Tasks: Panel Financiero Interno de Socios

**Input**: Design documents from `/specs/002-panel-financiero-socios/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md (todos
presentes)

**Tests**: No solicitados por el usuario — omitidos (mismo criterio que
`001-catalogo-carrito-admin`, Principio VI de la constitución). Validación manual vía
`quickstart.md` en la fase final.

**Organization**: Tareas agrupadas por historia de usuario (spec.md) para permitir implementación
y prueba independiente de cada una.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivo distinto, sin dependencias pendientes)
- **[Story]**: Historia de usuario a la que pertenece (US1..US8)
- Se incluye la ruta de archivo exacta en cada descripción

## Path Conventions

Extiende el proyecto único Vite + React ya existente. Todas las rutas son relativas a la raíz del
repo, bajo `src/`, salvo `firestore.rules`.

---

## Phase 1: Setup (Shared Infrastructure)

**Ya completado** por `001-catalogo-carrito-admin` (proyecto, dependencias, Tailwind, Firebase
config, Router/Contexts base). No hay tareas nuevas de Setup — el trabajo arranca en Foundational.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Reglas de seguridad, constantes, y la capa genérica de acceso a movimientos
(escritura atómica + auditoría, cálculo de saldo/stock) que reutilizan las 8 historias de usuario.

**⚠️ CRITICAL**: Ninguna historia de usuario puede darse por completa hasta que esta fase termine.

- [X] T001 [P] Extender `firestore.rules` con los 9 `match` blocks nuevos (`socios`,
  `costosProductos`, `ventasSocios`, `ventasDecants`, `compras`, `gastos`,
  `movimientosPersonales`, `transferenciasSocios`, `auditoria`), todos `allow read, write: if
  isAdmin();`, sin modificar los bloques existentes (`contracts/firestore-access.md`). El deploy a
  producción (`firebase deploy --only firestore:rules`) es un paso manual posterior que requiere
  confirmación explícita del usuario — no se ejecuta como parte de esta tarea.
- [X] T002 [P] Extender `src/constants/index.js` con `GASTO_CATEGORIAS` (Envíos, Insumos,
  Marketing, Alquiler, Otros), `METODOS_PAGO_SOCIOS` (`['efectivo', 'mercadopago']`) y `SOCIOS`
  (`[{ id: 'luciano', nombre: 'Luciano' }, { id: 'benja', nombre: 'Benja' }]`)
- [X] T003 [P] Crear `src/services/sociosService.js` con `listarSocios()` (lee la colección
  `socios`)
- [X] T004 Crear `src/hooks/useSocios.js` (TanStack Query sobre `listarSocios`) (depende de T003)
- [X] T005 [P] Crear `src/services/movimientosService.js` con la capa genérica reutilizada por
  todos los tipos de movimiento (`data-model.md` → "Convención común a todos los movimientos"):
  `listarMovimientos(coleccion)` (getDocs + filtra `anulado != true`),
  `crearMovimientoConAuditoria(coleccion, datos, socioId)`,
  `editarMovimientoConAuditoria(coleccion, id, datosNuevos, valorAnterior, socioId)`,
  `anularMovimientoConAuditoria(coleccion, id, valorAnterior, socioId)` — las tres últimas usan
  `writeBatch` para escribir el movimiento y su entrada en `auditoria` de forma atómica
  (`contracts/firestore-access.md` → "Contrato de escritura atómica")
- [X] T006 [P] Crear `src/services/costosProductosService.js` con `obtenerCostos()` (lista
  `costosProductos`) y `actualizarCostoEnBatch(batch, perfumeId, costoUnitario)` (agrega el `set`
  al batch recibido, sin comitear — lo usa `comprasService` en US3)
- [X] T007 Crear `src/services/panelFinancieroCalculos.js` con funciones puras:
  `calcularStockPorProducto(compras, ventasSocios)`, `calcularValorStock(stockPorProducto,
  costos)`, `calcularTotalesPorSocio({ movimientosPersonales, ventasSocios, ventasDecants,
  compras, gastos })`, `calcularSaldoNeto({ ventasSocios, ventasDecants, compras, gastos,
  transferenciasSocios })` (fórmulas exactas en `data-model.md` → "Cálculos derivados") (depende
  de T005)
- [X] T008 [P] Crear `src/services/auditoriaService.js` con `listarAuditoria(filtros = {})`
  (lee la colección `auditoria` completa, ordenada por `modificadoAt` desc, con filtro opcional
  en cliente por `coleccion`/`modificadoPor`/rango de fechas — FR-026)
- [X] T009 Crear `src/hooks/useAuditoria.js` (TanStack Query sobre `listarAuditoria`) (depende de
  T008)

**Checkpoint**: Fundación lista — las historias de usuario pueden implementarse a continuación.

---

## Phase 3: User Story 1 - Registrar una venta directa de un perfume (Priority: P1) 🎯 MVP

**Goal**: Un socio carga una venta de perfume (pendiente o cobrada); solo al quedar cobrada afecta
stock y saldo entre socios.

**Independent Test**: Registrar una venta pendiente (sin efecto en stock/saldo), marcarla cobrada
(stock baja, saldo se reparte 50/50), sin que existan otros tipos de movimiento todavía.

### Implementation for User Story 1

- [X] T010 [P] [US1] Crear `src/schemas/ventaSocioSchema.js` (Zod: `perfumeId` requerido,
  `cantidad` entero > 0, `precioUnitario` > 0, `vendidoPor` requerido, `metodoPago` ∈
  `METODOS_PAGO_SOCIOS`, `estado` ∈ `['pendiente', 'cobrada']`)
- [X] T011 [US1] Crear `src/services/ventasSociosService.js`: `crearVenta(datos, socioId)`,
  `editarVenta(id, datosNuevos, valorAnterior, socioId)`, `anularVenta(id, valorAnterior,
  socioId)` — usa `movimientosService` (T005) sobre la colección `'ventasSocios'`; no hay campo
  de stock que actualizar aparte (el stock se recalcula siempre desde `compras`/`ventasSocios`
  vigentes, T007), así que estas funciones solo persisten el movimiento (depende de T005, T010)
- [X] T012 [US1] Crear `src/hooks/useVentasSocios.js`: query sobre `listarMovimientos
  ('ventasSocios')` + mutations `crearVenta`/`editarVenta`/`anularVenta`, invalidando las queries
  de `ventasSocios` y de `usePanelFinanciero` tras cada mutación (depende de T011)
- [X] T013 [US1] Crear `src/components/admin/VentaSocioForm.jsx`: selector de perfume (precarga
  `precioUSD`/precio de catálogo como valor inicial editable — FR-005), cantidad, socio
  (`useSocios`), método de pago, estado; si `cantidad` a cobrar excede el stock actual (leído de
  `panelFinancieroCalculos.calcularStockPorProducto`), muestra advertencia no bloqueante antes de
  guardar (FR-006)
- [X] T014 [US1] Crear `src/components/admin/VentasSociosTable.jsx`: listado con acciones marcar
  cobrada, editar, anular
- [X] T015 [US1] Implementar `src/pages/admin/AdminVentasSocios.jsx`: ensambla
  `VentaSocioForm` + `VentasSociosTable` (mismo patrón que `AdminPerfumes.jsx`) (depende de T012,
  T013, T014)
- [X] T016 [US1] Agregar ruta `/admin/ventas` dentro del `<ProtectedRoute>` de
  `src/router/AppRouter.jsx` y su entrada en `NAV_ITEMS` de `src/components/layout/AdminLayout.jsx`

**Checkpoint**: User Story 1 completamente funcional y testeable de forma independiente.

---

## Phase 4: User Story 2 - Ver de un vistazo la situación financiera del negocio (Priority: P1) 🎯 MVP

**Goal**: El dashboard muestra totales por socio, saldo neto único, stock valorizado y movimientos
recientes, recalculados en cada carga.

**Independent Test**: Con solo ventas de US1 cargadas, el dashboard ya debe mostrar stock y saldo
correctos derivados de esas ventas; a medida que se agreguen US3-US6, el dashboard los refleja sin
cambios adicionales (lee las 6 colecciones de movimiento de forma genérica desde Foundational).

### Implementation for User Story 2

- [X] T017 [US2] Crear `src/hooks/usePanelFinanciero.js`: lee (vía `listarMovimientos`, T005) las
  6 colecciones de movimiento + `costosProductos` (T006), aplica `panelFinancieroCalculos` (T007)
  y devuelve `{ totalesPorSocio, saldoNeto, stockPorProducto, valorStockTotal,
  movimientosRecientes }`, cacheado con TanStack Query e invalidado por cualquier mutación de
  movimiento de cualquier historia (depende de T005, T006, T007)
- [X] T018 [P] [US2] Crear `src/components/admin/panel/TotalesSocioCard.jsx` (efectivo/MP/total
  por socio)
- [X] T019 [P] [US2] Crear `src/components/admin/panel/SaldoNetoCard.jsx` (único número con
  signo, texto "X le debe a Y" o "Equilibrado" — FR-020)
- [X] T020 [P] [US2] Crear `src/components/admin/panel/StockCard.jsx` (cantidad total, valor
  total, detalle por producto)
- [X] T021 [P] [US2] Crear `src/components/admin/panel/MovimientosRecientesList.jsx`
- [X] T022 [US2] Extender `src/pages/admin/Dashboard.jsx` (NO reemplazar — ya muestra estadísticas
  de pedidos de `001-catalogo-carrito-admin`) agregando las secciones de este módulo usando
  `usePanelFinanciero`; con ninguna colección cargada todavía, todos los totales se muestran en
  cero sin errores (FR-034) (depende de T017-T021)

**Checkpoint**: User Stories 1 y 2 funcionan de forma independiente y en conjunto.

---

## Phase 5: User Story 3 - Registrar una compra a proveedores (Priority: P1) 🎯 MVP

**Goal**: Una compra aumenta el stock del producto, actualiza su costo de referencia, y calcula el
desbalance entre socios según lo que pagó cada uno.

**Independent Test**: Registrar una compra con pagos desiguales entre socios y verificar que el
stock del producto sube y que el saldo entre socios refleja la diferencia.

### Implementation for User Story 3

- [X] T023 [P] [US3] Crear `src/schemas/compraSchema.js` (Zod: `proveedor`, `perfumeId`,
  `cantidad` > 0, `costoUnitario` > 0, `costoTotal`, `pagos` array no vacío de
  `{ socioId, monto, metodo }`)
- [X] T024 [US3] Crear `src/services/comprasService.js`: `crearCompra(datos, socioId)` — valida
  que `Σ pagos[].monto === costoTotal` (FR-013) antes de escribir; escribe la compra + auditoría
  vía `movimientosService` (T005) y, en el mismo `writeBatch`, actualiza
  `costosProductos/{perfumeId}` vía `costosProductosService.actualizarCostoEnBatch` (T006, FR-014);
  también `editarCompra`, `anularCompra` (depende de T005, T006, T023)
- [X] T025 [US3] Crear `src/hooks/useCompras.js` (query + mutations, invalida `compras`,
  `costosProductos` y `usePanelFinanciero`) (depende de T024)
- [X] T026 [US3] Crear `src/components/admin/CompraForm.jsx`: selector de perfume, proveedor,
  cantidad, costo total, filas de `pagos` por socio (monto + método), bloquea guardar si la suma
  no coincide con el costo total
- [X] T027 [US3] Crear `src/components/admin/ComprasTable.jsx` (listado con editar/anular)
- [X] T028 [US3] Implementar `src/pages/admin/AdminCompras.jsx` (depende de T025, T026, T027)
- [X] T029 [US3] Agregar ruta `/admin/compras` + entrada en `NAV_ITEMS` (mismo archivo que T016 —
  no paralelizable con T016)

**Checkpoint**: Las 3 historias P1 (US1+US2+US3) juntas son el **MVP del módulo**: cargar ventas y
compras y ver el estado financiero consolidado del negocio.

---

## Phase 6: User Story 4 - Registrar ventas de decants (Priority: P2)

**Goal**: Venta de una fracción de perfume, reparto 50/50 inmediato, sin afectar stock.

**Independent Test**: Registrar una venta de decant y verificar reparto inmediato en el saldo
entre socios, sin cambios en el stock del perfume.

### Implementation for User Story 4

- [X] T030 [P] [US4] Crear `src/schemas/ventaDecantSchema.js` (Zod: `perfumeId`, `tamano` string
  no vacío en texto libre, `cantidad` > 0, `precioUnitario` > 0, `vendidoPor`, `metodoPago`)
- [X] T031 [US4] Crear `src/services/ventasDecantsService.js`: `crearVentaDecant`,
  `editarVentaDecant`, `anularVentaDecant` sobre `movimientosService` (T005), colección
  `'ventasDecants'` (depende de T005, T030)
- [X] T032 [US4] Crear `src/hooks/useVentasDecants.js` (depende de T031)
- [X] T033 [US4] Crear `src/components/admin/VentaDecantForm.jsx` (campo `tamano` de texto libre)
- [X] T034 [US4] Crear `src/components/admin/VentasDecantsTable.jsx` (editar/anular)
- [X] T035 [US4] Implementar `src/pages/admin/AdminVentasDecants.jsx` (depende de T032, T033,
  T034)
- [X] T036 [US4] Agregar ruta `/admin/decants` + entrada en `NAV_ITEMS`

**Checkpoint**: User Story 4 funcional de forma independiente sobre el dashboard de US2.

---

## Phase 7: User Story 5 - Registrar gastos compartidos del negocio (Priority: P2)

**Goal**: Gasto con categoría fija, siempre repartido 50/50.

**Independent Test**: Registrar un gasto pagado por un socio y verificar que el saldo entre
socios refleja la mitad a favor del otro.

### Implementation for User Story 5

- [X] T037 [P] [US5] Crear `src/schemas/gastoSchema.js` (Zod: `categoria` ∈ `GASTO_CATEGORIAS`,
  `descripcion`, `monto` > 0, `pagadoPor`, `metodoPago`)
- [X] T038 [US5] Crear `src/services/gastosService.js`: `crearGasto`, `editarGasto`, `anularGasto`
  sobre `movimientosService` (T005), colección `'gastos'` (depende de T005, T037)
- [X] T039 [US5] Crear `src/hooks/useGastos.js` (depende de T038)
- [X] T040 [US5] Crear `src/components/admin/GastoForm.jsx` (selector de categoría fija)
- [X] T041 [US5] Crear `src/components/admin/GastosTable.jsx` (editar/anular)
- [X] T042 [US5] Implementar `src/pages/admin/AdminGastos.jsx` (depende de T039, T040, T041)
- [X] T043 [US5] Agregar ruta `/admin/gastos` + entrada en `NAV_ITEMS`

**Checkpoint**: User Story 5 funcional de forma independiente sobre el dashboard de US2.

---

## Phase 8: User Story 6 - Movimientos personales y transferencias entre socios (Priority: P2)

**Goal**: Aportes/retiros propios (sin deuda entre socios) y transferencias (constancia contable
que ajusta el saldo neto).

**Independent Test**: Un retiro propio solo baja el total individual del socio; una transferencia
reduce el saldo neto entre ambos en el monto registrado.

### Implementation for User Story 6

- [X] T044 [P] [US6] Crear `src/schemas/movimientoPersonalSchema.js` (Zod: `socioId`, `tipo` ∈
  `['retiro', 'aporte']`, `monto` > 0, `metodo`)
- [X] T045 [P] [US6] Crear `src/schemas/transferenciaSchema.js` (Zod: `de`, `a` (distintos),
  `monto` > 0, `metodo`)
- [X] T046 [US6] Crear `src/services/movimientosPersonalesService.js`: `crearMovimiento`,
  `editarMovimiento`, `anularMovimiento` sobre `movimientosService` (T005), colección
  `'movimientosPersonales'` (depende de T005, T044)
- [X] T047 [US6] Crear `src/services/transferenciasSociosService.js`: `crearTransferencia`,
  `editarTransferencia`, `anularTransferencia` sobre `movimientosService` (T005), colección
  `'transferenciasSocios'` (depende de T005, T045)
- [X] T048 [P] [US6] Crear `src/hooks/useMovimientosPersonales.js` (depende de T046)
- [X] T049 [P] [US6] Crear `src/hooks/useTransferenciasSocios.js` (depende de T047)
- [X] T050 [US6] Crear `src/components/admin/MovimientoPersonalForm.jsx`
- [X] T051 [US6] Crear `src/components/admin/TransferenciaForm.jsx` (deja explícito en el texto
  de la UI que es solo un registro contable, no mueve dinero real — FR-018)
- [X] T052 [US6] Implementar `src/pages/admin/AdminMovimientos.jsx`: ensambla ambos formularios y
  sus listados (editar/anular) en una sola pantalla (depende de T048, T049, T050, T051)
- [X] T053 [US6] Agregar ruta `/admin/movimientos` + entrada en `NAV_ITEMS`

**Checkpoint**: User Story 6 funcional de forma independiente sobre el dashboard de US2.

---

## Phase 9: User Story 7 - Corregir un movimiento pasado sin perder el historial (Priority: P3)

**Goal**: Pantalla de historial/auditoría con filtros y vista de diff; la capacidad de
editar/anular ya existe en cada tabla de movimiento desde sus propias historias (US1, US3-US6).

**Independent Test**: Editar/anular un movimiento ya cargado (desde cualquier tabla previa) y
verificar en `/admin/auditoria` que aparece con valor anterior, nuevo, quién y cuándo, filtrable.

### Implementation for User Story 7

- [X] T054 [P] [US7] Crear `src/components/admin/AuditoriaTable.jsx`: listado filtrable por tipo
  de movimiento (`coleccion`), socio (`modificadoPor`) y rango de fechas (FR-026)
- [X] T055 [P] [US7] Crear `src/components/admin/AuditoriaDiff.jsx`: muestra `valorAnterior` vs
  `valorNuevo` campo a campo para una entrada seleccionada
- [X] T056 [US7] Implementar `src/pages/admin/AdminAuditoria.jsx`: ensambla `AuditoriaTable` +
  `AuditoriaDiff` usando `useAuditoria` (Foundational T009) (depende de T054, T055)
- [X] T057 [US7] Agregar ruta `/admin/auditoria` + entrada en `NAV_ITEMS`

**Checkpoint**: Las historias P1+P2+P3 relacionadas con movimientos quedan completas y
auditables.

---

## Phase 10: User Story 8 - Analizar el desempeño del negocio (Priority: P3)

**Goal**: Reportes de perfumes más vendidos, tamaños de decant por perfume, evolución de ventas y
actividad por socio.

**Independent Test**: Con ventas de varios perfumes y tamaños de decant en fechas distintas, los
reportes reflejan correctamente los rankings y la evolución temporal.

### Implementation for User Story 8

- [X] T058 [US8] Extender `src/services/panelFinancieroCalculos.js` con `calcularRankingPerfumes
  (ventasSocios)`, `calcularTamanosDecantPorPerfume(ventasDecants, perfumeId)`,
  `calcularEvolucionVentas(ventasSocios, ventasDecants)`, `calcularActividadPorSocio({...todas las
  colecciones...})` (depende de T007)
- [X] T059 [US8] Crear `src/hooks/useAnalytics.js`: agrega lecturas de `ventasSocios`,
  `ventasDecants` (vía `listarMovimientos`, sin filtro adicional de fecha en esta versión) y
  aplica los cálculos de T058 (depende de T058)
- [X] T060 [P] [US8] Crear `src/components/admin/AnalyticsRankingPerfumes.jsx`
- [X] T061 [P] [US8] Crear `src/components/admin/AnalyticsDecantsPorTamano.jsx` (selector de
  perfume + desglose de tamaños)
- [X] T062 [P] [US8] Crear `src/components/admin/AnalyticsEvolucionVentas.jsx`
- [X] T063 [P] [US8] Crear `src/components/admin/AnalyticsActividadSocio.jsx` (presentación
  puramente informativa, sin ranking — FR-033)
- [X] T064 [US8] Implementar `src/pages/admin/AdminAnalytics.jsx` (depende de T059-T063)
- [X] T065 [US8] Agregar ruta `/admin/analytics` + entrada en `NAV_ITEMS`

**Checkpoint**: Las 8 historias de usuario están funcionales de forma independiente.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Validación final y mejoras transversales a todas las historias.

- [ ] T066 Ejecutar la guía completa de `specs/002-panel-financiero-socios/quickstart.md` (las 8
  historias + el caso de regresión del sitio público) y registrar resultados
- [X] T067 [P] Revisar comportamiento responsive (mobile/desktop) de las pantallas nuevas bajo
  `/admin`
- [X] T068 Revisar manejo de errores de Firestore (permisos, red) con mensajes claros en los
  servicios de este módulo (`movimientosService.js` y los wrappers específicos)
- [ ] T069 Confirmar con el usuario y ejecutar el deploy de `firestore.rules` a producción
  (`firebase deploy --only firestore:rules`) — acción de alto impacto, requiere aprobación
  explícita antes de correrla (ver T001)
- [X] T070 Limpieza final: eliminar `console.log` de debug en los archivos nuevos de este módulo

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Ya completado — sin tareas.
- **Foundational (Phase 2)**: Sin dependencias externas — BLOQUEA todas las historias.
- **User Stories (Phase 3-10)**: Todas dependen de Foundational. US1, US2 y US3 son P1 (MVP) y se
  recomiendan en ese orden (US2 lee datos que empiezan a existir recién con US1; US3 completa el
  otro lado del stock). US4-US6 (P2) son independientes entre sí y de US1-3, salvo por reutilizar
  `movimientosService`/`usePanelFinanciero`. US7-US8 (P3) son independientes entre sí.
- **Polish (Phase 11)**: Depende de que todas las historias deseadas estén completas.

### User Story Dependencies

- **US1 (P1)**: Depende de Foundational.
- **US2 (P1)**: Depende de Foundational; se enriquece automáticamente a medida que US1, US3-US6
  agregan datos, sin cambios de código adicionales (lee las 6 colecciones de forma genérica).
- **US3 (P1)**: Depende de Foundational; su stock/costo se reflejan en US2 sin trabajo extra.
- **US4-US6 (P2)**: Dependen de Foundational; se integran al dashboard de US2 automáticamente.
- **US7 (P3)**: Depende de Foundational (`auditoriaService`/`useAuditoria`); la capacidad de
  editar/anular ya vive en cada servicio de movimiento desde su propia historia.
- **US8 (P3)**: Depende de Foundational y de que existan ventas cargadas (US1/US4) para ser útil,
  aunque el código funciona igual con cero datos.

### Within Each User Story

- Schema antes que servicio; servicio antes que hook; hook antes que componentes; componentes
  antes que la página que los ensambla; página antes de agregar su ruta.
- Las tareas de "agregar ruta + `NAV_ITEMS`" de cada historia tocan los mismos dos archivos
  (`AppRouter.jsx`, `AdminLayout.jsx`) que las demás historias — **no son paralelizables entre
  historias distintas**, aunque sí son la última tarea de cada una.

### Parallel Opportunities

- Todas las tareas [P] de Foundational (T001-T003, T005-T006, T008) pueden ejecutarse en paralelo
  entre sí.
- Dentro de cada historia, el/los schema(s) [P] pueden ir en paralelo con otras tareas [P] de
  Foundational si ya terminó esa historia; los componentes de presentación pura de US2 (T018-T021)
  y de US8 (T060-T063) son paralelizables entre sí.
- US4, US5 y US6 pueden desarrollarse en paralelo entre sí una vez completo el MVP (US1-US3), por
  distintos desarrolladores, ya que tocan archivos y páginas distintas (salvo la tarea final de
  ruta/nav de cada una, que debe aplicarse en serie).

---

## Parallel Example: Foundational

```bash
Task: "Extender firestore.rules con los 9 match blocks nuevos"
Task: "Extender src/constants/index.js con GASTO_CATEGORIAS, METODOS_PAGO_SOCIOS, SOCIOS"
Task: "Crear src/services/sociosService.js con listarSocios()"
Task: "Crear src/services/movimientosService.js (CRUD + auditoría genéricos)"
Task: "Crear src/services/costosProductosService.js"
Task: "Crear src/services/auditoriaService.js con listarAuditoria()"
```

## Parallel Example: User Story 2 (tarjetas del dashboard)

```bash
Task: "Crear src/components/admin/panel/TotalesSocioCard.jsx"
Task: "Crear src/components/admin/panel/SaldoNetoCard.jsx"
Task: "Crear src/components/admin/panel/StockCard.jsx"
Task: "Crear src/components/admin/panel/MovimientosRecientesList.jsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 + 3)

1. Completar Phase 2: Foundational (bloqueante).
2. Completar Phase 3: User Story 1 (venta de perfumes).
3. Completar Phase 4: User Story 2 (dashboard).
4. Completar Phase 5: User Story 3 (compras).
5. **STOP y VALIDAR**: correr `quickstart.md` Historias 1-3 de punta a punta — con esto los
   socios ya pueden operar el día a día básico (vender, comprar, ver su situación).

### Incremental Delivery

1. Foundational → capa genérica de movimientos + auditoría + cálculo lista.
2. US1 → probar independientemente → ventas de perfumes funcionando.
3. US2 → probar independientemente → dashboard consolidado (MVP con US1+US3).
4. US3 → probar independientemente → **MVP completo del módulo**.
5. US4 → ventas de decants (mejora incremental, no bloqueante).
6. US5 → gastos compartidos.
7. US6 → movimientos personales y transferencias.
8. US7 → historial/auditoría navegable.
9. US8 → analytics.
10. Polish → validación completa de `quickstart.md`, deploy de reglas confirmado con el usuario, y
    cierre de la feature.

---

## Notes

- [P] = archivos distintos, sin dependencias pendientes entre sí.
- El MVP de esta feature son las historias P1 (US1+US2+US3): sin ellas el módulo no aporta valor
  real de negocio.
- US4-US8 aportan valor incremental pero el módulo es utilizable sin ellas.
- Sin tareas de test automatizado, por decisión ya documentada en `plan.md`/`research.md`.
- El deploy de `firestore.rules` a producción (T069) es la única acción de este plan que requiere
  confirmación explícita del usuario antes de ejecutarse — todo lo demás es código local.
- Commitear después de cada tarea o grupo lógico, siguiendo el mismo patrón usado en
  `001-catalogo-carrito-admin`.
