# Rediseño y fixes del Panel Financiero de Socios

## Contexto

El panel financiero de socios (`feat: panel financiero interno de socios`, merge reciente) tiene un bug real de signo en el cálculo de deuda, un formulario de Compras que traba el guardado por una validación demasiado estricta, selects sin buscador para elegir perfume, y ninguna separación de privacidad entre los dos socios sobre su plata personal. Además está repartido en 8 páginas sueltas con un nav plano de 12 links, sin estética ni jerarquía. Esta iteración corrige el cálculo de deuda, simplifica Compras a "monto total" (sin costeo por ítem), agrega buscador de perfume, separa lo privado (fondos/movimientos personales de cada socio) de lo compartido (ventas, compras, gastos — visibles para ambos con su precio), y consolida todo en una sola sección "Administración Financiera" con navegación interna, glassmorfismo, iconos y colores ya existentes en el resto del admin.

No hay datos reales cargados en `compras` todavía (confirmado por el usuario), así que el cambio de esquema no necesita migración.

## 1. Fix del bug de deuda invertida

`src/services/panelFinancieroCalculos.js`, función `calcularSaldoNeto` (líneas 61-98): el mismo signo `+` se usa tanto para "pagar" (gastos/compras — correcto, quien pone plata de más es acreedor) como para "vender" (ventas — incorrecto: quien cobra retiene plata ajena, es deudor de la mitad). Flip del signo solo en los bloques de `ventasSocios` (línea 75) y `ventasDecants` (línea 79): `saldo -= signo(v.vendidoPor) * mitad` en vez de `+=`. Los bloques de `gastos`, `compras` y `transferenciasSocios` quedan igual. Actualizar el comentario de cabecera del archivo si hace falta. `calcularTotalesPorSocio` no se toca — es un cálculo distinto (plata en mano, no deuda) y ya es correcto.

Verificación manual: venta de Luciano por $60 → antes decía "Benja le debe a Luciano $30"; después debe decir "Luciano le debe a Benja $30".

## 2. Compras: multi-perfume + monto total (sin costeo por ítem)

Nuevo shape de `compras/{id}`:
```js
{
  proveedor, fecha,
  items: [{ perfumeId, perfumeNombre, cantidad }],   // sin costo individual
  montoTotal: number,
  pagos: [{ socioId, monto, metodo }],               // debe sumar montoTotal
  anulado, creadoPor, createdAt, updatedAt
}
```

Cambios:
- `src/schemas/compraSchema.js`: `items` = array de `{perfumeId, perfumeNombre, cantidad}` (min 1), `montoTotal` reemplaza a `costoTotal`/`costoUnitario`. El `refine` de suma de pagos pasa a comparar contra `montoTotal` (que ahora lo tipea el usuario directamente, no un producto derivado — reduce el desajuste de centavos que hoy traba el guardado).
- `src/components/admin/CompraForm.jsx`: reescribir. Proveedor + fecha, lista de ítems con `useFieldArray` (perfume con buscador — ver punto 3 — + cantidad, botón "+ Agregar perfume"), un input grande de `montoTotal`, y la sección de pagos igual que hoy pero validada contra `montoTotal`. Si hay un solo pago, auto-completar su monto con `montoTotal` (menos fricción para el caso común de "pagó uno solo").
- `src/services/comprasService.js`: `validarPagos` compara contra `datos.montoTotal`. **Sacar la llamada a `actualizarCostoEnBatch`** en `crearCompra`/`editarCompra` — ya no hay costo unitario confiable por ítem.
- `src/components/admin/ComprasTable.jsx`: renderizar `items.map(i => \`${i.perfumeNombre} ×${i.cantidad}\`).join(' · ')` y `montoTotal` en vez de perfume/cantidad/costoTotal sueltos.
- `src/services/panelFinancieroCalculos.js`: `calcularSaldoNeto` (bloque compras, línea 86-91) usa `c.montoTotal` en vez de `costoTotal`. `calcularStockPorProducto` (línea 100-104) itera `c.items` en vez de `c.perfumeId`/`c.cantidad` directo.

Consecuencia aceptada explícitamente (se pierde el costeo automático por producto): eliminar la funcionalidad de "valor de stock" que dependía de `costosProductos` alimentado por cada compra, porque ya no hay costo unitario confiable —
- Borrar `src/services/costosProductosService.js`, `src/hooks/useCostosProductos.js`, la función `calcularValorStock` en `panelFinancieroCalculos.js`, y la regla `costosProductos` en `firestore.rules`.
- `src/components/admin/panel/StockCard.jsx`: dejar solo cantidades por perfume (sacar "Valor total" y el valor por ítem).
- `src/hooks/usePanelFinanciero.js`: sacar `useCostosProductos`/`costos`/`valorStockTotal`/`valorStockPorProducto` de la query y del `data` devuelto.

Esto también resuelve el bloqueo reportado ("no me deja confirmar la compra por el error de coincidencia de perfumes") — la validación de "suma de pagos vs costo" que disparaba ese mensaje desaparece con este modelo.

## 3. Buscador de perfume reutilizable

Nuevo componente `src/components/ui/PerfumeSearchSelect.jsx`: input de texto + lista desplegable filtrada en vivo por nombre (substring, case-insensitive), estilizado como el resto de inputs (`glass`/`border-border`), cierra al elegir o clickear afuera. Props: `perfumes`, `value`, `onChange(id, perfume)`, `placeholder`. Sin dependencias nuevas (no hay combobox lib en el proyecto; se implementa con `useState` + filtro, patrón simple).

Reemplaza el `<select>` de todo el catálogo en:
- `src/components/admin/VentaSocioForm.jsx` (línea 84-87)
- `src/components/admin/VentaDecantForm.jsx` (mismo patrón)
- `src/components/admin/CompraForm.jsx` (dentro de cada ítem del punto 2)

## 4. Privacidad: fondos personales propios, ventas/compras compartidas

Alcance confirmado por el usuario: cada socio tiene su **fondo personal acumulado** (lo que tiene en mano: ventas propias cobradas + aportes − compras pagadas − retiros) que el otro socio **no debe ver ni gestionar**. El detalle operativo (qué se vendió/compró y a qué precio) sigue siendo compartido — ambos lo ven y cargan. El saldo neto/deuda entre ambos (punto 1) también sigue compartido, porque es inherente a la relación entre los dos.

**Reglas de Firestore** (`firestore.rules`) — hoy `movimientosPersonales` es `allow read, write: if isAdmin()` sin filtro. Agregar un helper que mapea uid → socioId vía los docs `socios/luciano` y `socios/benja` (ya tienen `authUid`):
```
function socioIdDe(uid) {
  return get(/databases/$(database)/documents/socios/luciano).data.authUid == uid
    ? 'luciano'
    : (get(/databases/$(database)/documents/socios/benja).data.authUid == uid ? 'benja' : null);
}

match /movimientosPersonales/{id} {
  allow read: if isAdmin() && resource.data.socioId == socioIdDe(request.auth.uid);
  allow create: if isAdmin() && request.resource.data.socioId == socioIdDe(request.auth.uid);
  allow update, delete: if isAdmin() && resource.data.socioId == socioIdDe(request.auth.uid);
}
```
`ventasSocios`, `ventasDecants`, `compras`, `gastos`, `transferenciasSocios`, `auditoria`, `socios` quedan igual que hoy (`isAdmin()`, compartidos).

**Frontend** — con la regla restringida, el `getDocs` sin filtro de hoy (`listarMovimientos('movimientosPersonales')` en `movimientosService.js:15-20`) va a fallar por permission-denied en una query de colección completa. Cambios:
- `src/services/movimientosPersonalesService.js`: agregar `listarMovimientosPropios(socioId)` con `query(collection(db,'movimientosPersonales'), where('socioId','==',socioId))`, filtrando `anulado !== true` client-side igual que `listarMovimientos`.
- `src/hooks/useMovimientosPersonales.js`: `useMovimientosPersonales(socioId)` pasa a requerir `socioId`, `queryKey: ['movimientosPersonales', socioId]`, usa la nueva función.
- Extraer el `useSocioActualId()` duplicado (hoy inline en `AdminCompras.jsx:11-15` y `AdminMovimientos.jsx:16-20`) a un hook compartido `src/hooks/useSocioActual.js`, y usarlo en ambos + en el nuevo shell del punto 5.
- `src/pages/admin/AdminMovimientos.jsx` (pasa a vivir bajo Finanzas, ver punto 5): título "Mis movimientos personales"; ya no puede mostrar ni gestionar los del otro socio porque la query ni los trae.
- `src/components/admin/panel/TotalesSocioCard.jsx`: mostrar solo el total del socio logueado (una tarjeta "Mi saldo", no la grilla de ambos). `usePanelFinanciero.js` sigue calculando `totalesPorSocio` para ambos (necesita datos compartidos de ventas/compras/gastos), pero el componente solo renderiza `totalesPorSocio[socioActualId]`.
- `src/components/admin/panel/SaldoNetoCard.jsx` no cambia — es la deuda compartida, se ve completa por ambos.

## 5. Consolidar en una pestaña "Administración Financiera"

Nueva navegación anidada bajo `/admin/finanzas`, reemplazando los 7 links financieros sueltos del nav plano de `AdminLayout.jsx` por uno solo ("Finanzas"):

```
/admin/finanzas              → Resumen (SaldoNetoCard, mi TotalesSocioCard, StockCard, MovimientosRecientesList — lo que hoy está mezclado en Dashboard.jsx con las stats de pedidos)
/admin/finanzas/ventas       → AdminVentasSocios
/admin/finanzas/decants      → AdminVentasDecants
/admin/finanzas/compras      → AdminCompras (rediseñado, punto 2)
/admin/finanzas/gastos       → AdminGastos
/admin/finanzas/movimientos  → AdminMovimientos ("Mis movimientos", punto 4)
/admin/finanzas/historial    → AdminAuditoria + AdminAnalytics (dos sub-secciones en la misma página)
```

- `src/router/AppRouter.jsx`: nueva ruta padre `/admin/finanzas` con `<AdminFinanzasLayout />` (contiene el tab-nav interno + `<Outlet/>`), rutas hijas `index`, `ventas`, `decants`, `compras`, `gastos`, `movimientos`, `historial`. Sacar las rutas planas equivalentes (`ventas`, `compras`, `decants`, `gastos`, `movimientos`, `auditoria`, `analytics`) de `/admin/*` directo. `Dashboard.jsx` (`/admin` index) se queda solo con las stats de pedidos + accesos rápidos (uno de ellos ahora apunta a `/admin/finanzas`); se le saca la sección "Panel financiero de socios" (líneas 86-104), que se muda al nuevo Resumen.
- Nuevo `src/pages/admin/AdminFinanzasLayout.jsx`: tab-nav horizontal estilo `glass` con un ícono `lucide-react` por sección (mismo patrón que `StatCard` de `Dashboard.jsx:22-35`: `rounded-xl bg-lila/10 p-3` + `text-lila`), resaltando la sección activa con `gradient-violet` o `glow`. Cada página hija (`AdminVentasSocios.jsx`, etc.) pierde su `<h1>` propio si queda redundante con el tab activo, pero mantiene su contenido tal cual.
- `src/components/layout/AdminLayout.jsx` (`NAV_ITEMS`, líneas 5-18): reemplazar las 7 entradas financieras por una sola `{ to: '/admin/finanzas', label: 'Finanzas' }`.
- Nuevo `src/pages/admin/AdminFinanzasResumen.jsx`: la sección "Panel financiero de socios" que hoy vive en `Dashboard.jsx`, con `SaldoNetoCard`, `TotalesSocioCard` (ya filtrada a "mi saldo"), `StockCard` (solo cantidades), `MovimientosRecientesList`. Reutiliza `usePanelFinanciero()` tal cual.

## 6. Estilo: glassmorfismo + iconos + colores existentes

Reusar sin inventar nada nuevo: clase `.glass`/`.glow`/`.gradient-violet` (`src/index.css:33-38`), paleta `violet`/`lila`/`success`/`error` (`tailwind.config.js`), `GlassCard` (`src/components/ui/GlassCard.jsx`) y `Button` (`src/components/ui/Button.jsx`) para toda tarjeta/acción nueva, tipografía `font-display` para títulos y `font-luxury` para montos (como ya hace `ComprasTable.jsx:38`). Agregar un ícono `lucide-react` por sección/tarjeta siguiendo el patrón `StatCard` (hoy ningún componente de `panel/` tiene ícono): ej. `Scale` para Saldo entre socios, `Wallet` para Mi saldo, `Package`/`Boxes` para Stock, `ShoppingCart` para Compras, `TrendingUp` para Ventas, `Receipt` para Gastos, `ArrowLeftRight` para Movimientos, `History` para Historial. Cada sección con `<h2 className="font-display ...">` claro y descriptivo (ya es el patrón de `Dashboard.jsx`).

## Verificación

1. `npm run dev`, loguearse como cada uno de los dos socios (dos cuentas si están disponibles) y confirmar:
   - Cargar una venta de $60 a nombre propio → el panel de Saldo dice que **yo** le debo $30 al otro socio (no al revés).
   - Cargar una compra con 2+ perfumes distintos y un monto total único, con un solo pago → guarda sin el error de "no coincide".
   - Buscar un perfume por texto en Venta, Decant y Compra en vez de scrollear un select largo.
   - Cargar un movimiento personal (aporte/retiro) propio, loguearse con el otro socio y confirmar que NO aparece en su lista de "Mis movimientos" ni en ningún total mostrado.
   - Confirmar que ventas/compras cargadas por un socio sí las ve el otro (con precio).
2. Navegar `/admin/finanzas` y sus 6 sub-secciones, confirmar que cada URL sigue funcionando como deep-link directo (recargar la página en `/admin/finanzas/compras`, por ejemplo).
3. Desplegar reglas de Firestore (`firebase deploy --only firestore:rules`) antes o junto con el frontend, porque el cambio de query de `movimientosPersonales` depende de la regla nueva — si se pushea el frontend sin la regla, el query con `where` igual funciona (es más restrictivo que la regla vieja), pero si se pushea la regla sin el frontend, el `getDocs` viejo sin filtro empieza a fallar. Orden seguro: reglas primero, frontend después.

## Nota

Este plan fue diseñado en una sesión de Claude Code corriendo en una máquina distinta a la de trabajo habitual (no se implementó nada de código todavía). Queda para ejecutarse desde ahí, siguiendo el orden de las secciones 1-6.
