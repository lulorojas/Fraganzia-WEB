# Implementation Plan: Catálogo, Carrito, Checkout por WhatsApp y Administración

**Branch**: `001-catalogo-carrito-admin` | **Date**: 2026-07-07 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-catalogo-carrito-admin/spec.md`

## Summary

Implementar el circuito completo de la tienda Fraganzia sobre el setup ya existente
(React + Vite + Firebase, aprobado y commiteado): navegación pública del catálogo de perfumes con
filtros y búsqueda, armado de carrito persistente por dispositivo, checkout que calcula precios en
ARS con cotización de dólar (o leyenda de fallback) y deriva a WhatsApp guardando el pedido en
Firestore, y un panel de administración (protegido por Firebase Auth) para gestionar perfumes,
consultar pedidos, y administrar promociones y configuración general. Todo el enfoque técnico ya
fue decidido y ratificado en `.specify/memory/constitution.md`; este plan traduce esas decisiones a
la estructura concreta de esta feature, sin abrir alternativas nuevas de stack.

## Technical Context

**Language/Version**: JavaScript (ES2022+), JSX vía React 18+ — sin TypeScript (Constitución §3).

**Primary Dependencies**: React Router DOM v6, Firebase SDK v9+ modular (Auth + Firestore),
TanStack Query v5, Framer Motion, Lucide React, React Hook Form + Zod + `@hookform/resolvers`,
TailwindCSS v3 (Constitución §3). Ya instaladas en el setup inicial (`package.json`).

**Storage**: Firebase Firestore — colecciones `perfumes`, `pedidos`, `promociones`, `admins`,
`config`, `estadisticas` (Constitución §6). Persistencia de carrito en el almacenamiento local del
navegador del cliente (`localStorage`), ya que FR-031 exige que sobreviva entre visitas en el mismo
dispositivo y la Constitución prohíbe cualquier backend propio o servicio de sesión adicional.

**Testing**: No se definieron herramientas de testing automatizado en la constitución ni fueron
solicitadas por el usuario en ningún módulo aprobado hasta ahora. Se valida cada historia de
usuario manualmente vía `quickstart.md` (Principio VI: no inventar infraestructura no acordada).

**Target Platform**: Navegador web (SPA), responsive para desktop y mobile. Deploy final a Firebase
Hosting (Constitución §3, §12 — CI/CD solo al final).

**Project Type**: Web application de un solo frontend (sin backend propio — Principio IV). Se usa
la estructura "Option 1" adaptada: un único proyecto Vite/React ya creado en `src/`.

**Performance Goals**: Sin metas numéricas de performance específicas más allá de las de
Success Criteria del spec (ej. SC-001: encontrar un perfume en <30s; SC-002: completar compra en
<3min). No hay requisito de alto tráfico concurrente declarado.

**Constraints**: Sin Cloud Functions, sin Storage, sin backend propio, sin REST API directa a
Firebase (Principios II–IV). Precios siempre visibles en ambos métodos de pago (FR-004, FR-029).
Cotización de dólar con fallback obligatorio (FR-033).

**Scale/Scope**: Catálogo de perfumes de un solo negocio (no multi-tenant), un conjunto de
administradores de confianza (sin autoservicio de alta), tráfico esperado de una tienda de nicho
(no se declaran miles de usuarios concurrentes).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio / Regla | Cumplimiento en este plan |
|---|---|
| I. SDD (spec → aprobación → código) | ✅ Este plan se genera a partir del spec ya aprobado; el código no arranca hasta `/speckit-tasks` + aprobación de tareas. |
| II. Firebase: solo Auth + Firestore + Hosting | ✅ No se introduce Storage, Functions ni Extensions. Fotos siguen siendo URLs externas (ya reflejado en el modelo de datos). |
| III. SDK modular Firebase v9+ en cliente | ✅ Todo acceso a Firestore/Auth se hace vía `firebase/firestore` y `firebase/auth`, ya inicializados en `src/firebase/config.js`. |
| IV. Sin backend propio | ✅ Toda la lógica (precios, WhatsApp, validaciones) vive en el cliente React. Persistencia de carrito es local al navegador, no un servicio propio. |
| V. GitHub Actions solo al final | ✅ Este plan no toca `.github/workflows/`; queda para después de validar todo en local. |
| VI. No inventar, preguntar | ✅ No se agregan librerías, servicios ni alcance fuera de lo aprobado en la constitución y el spec. Testing automatizado explícitamente fuera de alcance por no haber sido acordado. |
| Stack aprobado (§3) | ✅ Todas las dependencias usadas ya están en `package.json` del setup aprobado; ninguna nueva. |
| Identidad visual (§4) | ✅ Los componentes de esta feature reutilizan los tokens CSS y clases (`glass`, `glow`, `gradient-violet`) ya definidos en `src/index.css` y `tailwind.config.js`. |

**Resultado del gate**: PASA sin excepciones. No hay violaciones que justificar en Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-catalogo-carrito-admin/
├── plan.md              # Este archivo (/speckit-plan)
├── research.md          # Fase 0 (/speckit-plan)
├── data-model.md         # Fase 1 (/speckit-plan)
├── quickstart.md         # Fase 1 (/speckit-plan)
├── contracts/            # Fase 1 (/speckit-plan) — contratos de UI/datos, no HTTP
└── tasks.md              # Fase 2 (/speckit-tasks — no se crea en este comando)
```

### Source Code (repository root)

El proyecto ya existe (setup inicial commiteado). Esta feature **completa** los archivos que en el
setup quedaron como placeholders o capas vacías, dentro de la misma estructura ya aprobada en
Constitución §5. No se crean carpetas nuevas de alto nivel.

```text
src/
├── firebase/config.js          # (ya existe) auth, db
├── context/
│   ├── AuthContext.jsx         # (ya existe) se usa tal cual
│   └── CartContext.jsx         # (ya existe) se conecta a localStorage en esta feature
├── hooks/                      # NUEVO en esta feature
│   ├── usePerfumes.js
│   ├── usePerfume.js
│   ├── useDolarBlue.js
│   ├── usePedidos.js
│   ├── usePromociones.js
│   ├── useConfig.js
│   └── useEstadisticas.js
├── services/                   # NUEVO en esta feature
│   ├── perfumesService.js
│   ├── pedidosService.js
│   ├── promocionesService.js
│   ├── configService.js
│   └── estadisticasService.js
├── utils/                       # NUEVO en esta feature
│   ├── precios.js
│   ├── whatsapp.js
│   ├── format.js
│   └── cartStorage.js           # persistencia de carrito en localStorage (FR-031)
├── constants/index.js           # NUEVO en esta feature (Constitución §13)
├── schemas/                     # NUEVO en esta feature
│   ├── perfumeSchema.js
│   └── pedidoSchema.js
├── components/
│   ├── ui/                      # NUEVO: Button, GlassCard, Badge, Modal, Spinner
│   ├── layout/ProtectedRoute.jsx # (ya existe)
│   ├── layout/Navbar.jsx, Footer.jsx  # NUEVO
│   ├── perfumes/                # NUEVO: PerfumeCard, PerfumeGrid, Filtros, NotasOlfativas
│   ├── cart/                    # NUEVO: CartDrawer, CartItem, ResumenCheckout, SelectorPago
│   └── admin/                   # NUEVO: tablas y formularios ABM
└── pages/                       # Reemplaza los placeholders por implementación real
    ├── Home.jsx, Catalogo.jsx, PerfumeDetalle.jsx, Carrito.jsx, Login.jsx
    └── admin/Dashboard.jsx, AdminPerfumes.jsx, AdminPedidos.jsx,
        AdminPromociones.jsx, AdminConfig.jsx
```

**Structure Decision**: Se mantiene el proyecto único Vite + React ya existente (equivalente a la
"Option 1: Single project" del template, sin backend/frontend separados por el Principio IV). Esta
feature no reestructura carpetas: llena las capas `hooks/`, `services/`, `utils/`, `constants/`,
`schemas/` y `components/` que el setup inicial dejó preparadas pero vacías, y reemplaza los
placeholders de `pages/` por las implementaciones reales descritas en el spec.

## Complexity Tracking

*Sin violaciones de la constitución. Sección no aplicable — tabla omitida intencionalmente.*
