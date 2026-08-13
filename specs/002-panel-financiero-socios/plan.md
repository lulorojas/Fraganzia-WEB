# Implementation Plan: Panel Financiero Interno de Socios

**Branch**: `002-panel-financiero-socios` | **Date**: 2026-08-12 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-panel-financiero-socios/spec.md`

## Summary

Agregar al panel de administración ya existente un módulo privado (solo Luciano y Benja) para
llevar la contabilidad interna del negocio: ventas directas de perfumes, ventas de decants,
compras a proveedores, gastos, movimientos personales y transferencias entre socios, con stock y
saldo neto entre socios siempre recalculados desde el historial de movimientos vigentes (nunca
contadores acumulativos, para no arrastrar drift al editar un movimiento pasado), y auditoría
completa sin borrado físico. Se reutiliza el 100% del setup ya aprobado (React 18 + Vite 5 +
Firebase v9 modular, Firebase Auth + colección `admins/{uid}` como mecanismo de acceso, catálogo
`perfumes` existente) y se extiende sin reestructurar nada de lo ya construido.

## Technical Context

**Language/Version**: JavaScript (ES2022+), JSX vía React 18.3 — sin TypeScript, consistente con
`001-catalogo-carrito-admin` y la Constitución §3.

**Primary Dependencies**: Firebase SDK v9+ modular (Auth + Firestore, ya `firebase@^10.13.0` en
`package.json`), TanStack Query v5 (cache/invalidación), React Hook Form + Zod (formularios de
alta/edición), TailwindCSS v3 (estilos). Ninguna dependencia nueva — todas ya instaladas.

**Storage**: Firebase Firestore. 9 colecciones nuevas: `socios`, `costosProductos`,
`ventasSocios`, `ventasDecants`, `compras`, `gastos`, `movimientosPersonales`,
`transferenciasSocios`, `auditoria` (ver `data-model.md`). Reutiliza sin modificar el schema de
`perfumes` (Constitución §6). Sin backend propio: toda lectura/escritura es SDK modular directo
desde el cliente (Principio IV).

**Testing**: Sin testing automatizado (no acordado con el usuario, igual que en
`001-catalogo-carrito-admin`). Validación manual vía `quickstart.md`.

**Target Platform**: Navegador web (SPA), sección `/admin/*` ya protegida. Deploy a Firebase
Hosting junto con el resto del sitio.

**Project Type**: Extensión de la web application de un solo frontend ya existente (Principio IV
— sin backend propio).

**Performance Goals**: Los cálculos de saldo/stock leen colecciones completas en el momento de
mostrarlas (sin documento de resumen acumulativo, por requisito explícito del spec de evitar
drift). Aceptable para el volumen de un negocio de dos socios; sin meta numérica de throughput.

**Constraints**: Firebase plan Spark únicamente — prohibido Cloud Functions, Storage, Admin SDK en
cliente o cualquier servicio que requiera plan Blaze (restricción explícita del usuario, coherente
con Constitución §2.II). Nunca hay `deleteDoc` sobre movimientos: anular = `anulado: true` +
entrada en `auditoria`, escritos atómicamente. Acceso restringido a exactamente dos cuentas
(Luciano y Benja) vía el mecanismo `isAdmin()` ya en producción.

**Scale/Scope**: Uso privado de 2 personas, volumen de movimientos de un negocio chico (decenas a
cientos por mes). 9 colecciones nuevas, 8 pantallas nuevas/extendidas bajo `/admin`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio / Regla | Cumplimiento en este plan |
|---|---|
| I. SDD (spec → aprobación → código) | ✅ Este plan deriva del spec ya validado contra el checklist de calidad; el código no arranca hasta `/speckit-tasks` + revisión de tareas. |
| II. Firebase: solo Auth + Firestore + Hosting | ✅ No se introduce Storage, Functions ni Extensions. Todo el cálculo (saldo, stock) corre en el cliente vía lecturas Firestore normales. |
| III. SDK modular Firebase v9+ en cliente | ✅ Todas las colecciones nuevas se acceden vía `firebase/firestore` (`collection/doc/addDoc/updateDoc/writeBatch/getDocs`), mismo patrón que `perfumesService.js`. |
| IV. Sin backend propio | ✅ No hay servidor ni función serverless; el reparto 50/50, el stock y el saldo se calculan en el cliente React. |
| V. GitHub Actions solo al final | ✅ No se toca `.github/workflows/`. |
| VI. No inventar, preguntar | ✅ Las decisiones no cubiertas por la spec técnica original (naming en español, tamaño de decant libre, categorías de gasto fijas, reconciliación de auth) se acordaron explícitamente con el usuario antes de este plan. |
| Stack aprobado (§3) | ✅ Cero dependencias nuevas. |
| Identidad visual (§4) | ✅ Pantallas nuevas reutilizan `glass`, `glow`, `text-text`/`text-text-secondary`, colores `violet`/`lila`/`bg` ya definidos; no se agregan tokens. |
| Idioma: dominio español / capa técnica inglés (Nota #8) | ✅ Colecciones y campos de dominio en español (`ventasSocios`, `precioUnitario`...); `hooks`/`services`/`components` en inglés como convención técnica ya usada. |
| `isAdmin()` vía `admins/{uid}` (Nota #6) | ✅ Se reutiliza tal cual; `socios` es solo una tabla de mapeo UID→nombre, no reemplaza el gate de seguridad. |

**Resultado del gate**: PASA sin excepciones. No hay violaciones que justificar en Complexity
Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/002-panel-financiero-socios/
├── plan.md              # Este archivo (/speckit-plan)
├── research.md          # Fase 0 (/speckit-plan)
├── data-model.md        # Fase 1 (/speckit-plan)
├── quickstart.md        # Fase 1 (/speckit-plan)
├── contracts/           # Fase 1 (/speckit-plan) — contratos de servicios/UI, no HTTP
└── tasks.md             # Fase 2 (/speckit-tasks — no se crea en este comando)
```

### Source Code (repository root)

Extiende el proyecto único ya existente (`src/`), sin crear carpetas de alto nivel nuevas —
mismo patrón que `001-catalogo-carrito-admin`.

```text
src/
├── constants/index.js              # + GASTO_CATEGORIAS, METODOS_PAGO_SOCIOS, SOCIOS
├── services/                       # NUEVO en esta feature (mismo estilo que perfumesService.js)
│   ├── sociosService.js
│   ├── costosProductosService.js
│   ├── ventasSociosService.js
│   ├── ventasDecantsService.js
│   ├── comprasService.js
│   ├── gastosService.js
│   ├── movimientosPersonalesService.js
│   ├── transferenciasSociosService.js
│   ├── auditoriaService.js
│   └── panelFinancieroCalculos.js  # funciones puras: saldo neto, totales, stock, valor de stock
├── hooks/                          # NUEVO — TanStack Query, mismo patrón que usePerfumes.js
│   ├── useSocios.js
│   ├── useVentasSocios.js
│   ├── useVentasDecants.js
│   ├── useCompras.js
│   ├── useGastos.js
│   ├── useMovimientosPersonales.js
│   ├── useTransferenciasSocios.js
│   ├── useAuditoria.js
│   └── usePanelFinanciero.js       # agrega dashboard: saldo, totales, stock
├── schemas/                        # NUEVO — Zod, mismo estilo que perfumeSchema.js
│   ├── ventaSocioSchema.js
│   ├── ventaDecantSchema.js
│   ├── compraSchema.js
│   ├── gastoSchema.js
│   ├── movimientoPersonalSchema.js
│   └── transferenciaSchema.js
├── components/admin/                # NUEVO — tablas y formularios de este módulo
│   ├── VentaSocioForm.jsx / VentasSociosTable.jsx
│   ├── VentaDecantForm.jsx / VentasDecantsTable.jsx
│   ├── CompraForm.jsx / ComprasTable.jsx
│   ├── GastoForm.jsx / GastosTable.jsx
│   ├── MovimientoPersonalForm.jsx / TransferenciaForm.jsx
│   ├── AuditoriaTable.jsx / AuditoriaDiff.jsx
│   └── panel/ (tarjetas del dashboard: SaldoNetoCard, StockCard, TotalesSocioCard...)
├── pages/admin/
│   ├── Dashboard.jsx                # EXTENDER (no reemplazar): + secciones de este módulo
│   ├── AdminVentasSocios.jsx        # NUEVO
│   ├── AdminVentasDecants.jsx       # NUEVO
│   ├── AdminCompras.jsx             # NUEVO
│   ├── AdminGastos.jsx              # NUEVO
│   ├── AdminMovimientos.jsx         # NUEVO (personales + transferencias)
│   ├── AdminAuditoria.jsx           # NUEVO
│   └── AdminAnalytics.jsx           # NUEVO
├── components/layout/AdminLayout.jsx # EXTENDER NAV_ITEMS con las rutas nuevas
├── router/AppRouter.jsx              # EXTENDER rutas /admin/* dentro del ProtectedRoute existente
└── firebase/config.js                # sin cambios (ya expone auth y db)

firestore.rules              # EXTENDER: + 9 match blocks nuevos con isAdmin(), sin tocar existentes
firestore.indexes.json       # EXTENDER solo si algún filtro del historial/analytics lo requiere
```

**Structure Decision**: Se mantiene el proyecto único Vite + React ya existente. Esta feature
agrega capas nuevas dentro de `services/`, `hooks/`, `schemas/`, `components/admin/` y
`pages/admin/` siguiendo exactamente los mismos patrones que `001-catalogo-carrito-admin`, y
extiende (no reemplaza) `Dashboard.jsx`, `AdminLayout.jsx`, `AppRouter.jsx` y `firestore.rules`.

## Complexity Tracking

*Sin violaciones de la constitución. Sección no aplicable — tabla omitida intencionalmente.*
