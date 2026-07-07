# Research: Catálogo, Carrito, Checkout por WhatsApp y Administración

**Feature**: 001-catalogo-carrito-admin | **Date**: 2026-07-07

## Contexto

A diferencia de una feature típica que arranca con incógnitas de stack, esta feature construye
sobre una constitución de proyecto (`.specify/memory/constitution.md` v1.0.0) que ya fijó de forma
exhaustiva y aprobada: lenguaje, dependencias, modelo de datos, reglas de seguridad, lógica de
precios y estructura de carpetas. No quedan decisiones de tecnología abiertas para esta feature.
Este documento registra esas decisiones ya tomadas (para trazabilidad del plan) y resuelve las
únicas dos preguntas de diseño que el spec dejó a nivel de comportamiento, no de tecnología.

## Decisiones ya fijadas por la constitución (sin alternativas a evaluar)

- **Decision**: Frontend único en React 18 + Vite, sin backend propio, hablando directo a Firebase
  Auth/Firestore/Hosting con el SDK modular v9+.
  **Rationale**: Principios II–IV de la constitución; ya implementado en el setup inicial
  (commit "setup inicial del proyecto").
  **Alternatives considered**: Ninguna — el stack es inmutable por gobernanza del proyecto.

- **Decision**: Estado global de carrito y sesión con Context API + `useReducer`, sin Redux/Zustand.
  **Rationale**: Constitución §3 prohíbe explícitamente gestores de estado externos.
  **Alternatives considered**: Ninguna — descartadas por regla del proyecto, no por esta feature.

- **Decision**: Cache y fetching de datos de Firestore con TanStack Query v5.
  **Rationale**: Ya aprobado en el stack; evita reimplementar cache manual para catálogo,
  promociones, pedidos y configuración.
  **Alternatives considered**: N/A (parte del stack fijado).

## Decisiones de diseño resueltas para esta feature

### Persistencia del carrito (FR-031)

- **Decision**: El carrito se persiste en `localStorage` del navegador del cliente, sincronizado
  con el estado del `CartContext` (lectura al montar la app, escritura en cada cambio de estado).
- **Rationale**: FR-031 exige que el carrito sobreviva entre visitas en el mismo dispositivo. La
  Constitución prohíbe backend propio y Cloud Functions (Principios II, IV), así que no hay
  colección de "carritos en curso" en Firestore ni sesión de servidor. `localStorage` es el único
  mecanismo disponible puramente del lado del cliente para ese requisito.
- **Alternatives considered**: Persistir el carrito en una colección Firestore por sesión anónima
  — rechazado porque agregaría reglas de seguridad y lecturas/escrituras innecesarias para un dato
  que no tiene valor de negocio hasta que se confirma como pedido; además complicaría el modelo de
  datos aprobado en Constitución §6 sin necesidad.

### Cotización del dólar sin API ni fallback cargado (FR-033)

- **Decision**: Cuando `dolarapi.com` no responde y `config/general.dolarBlueManual` tampoco tiene
  un valor cargado, la UI muestra los precios en USD (el valor fuente de verdad ya almacenado en
  cada perfume) junto a la leyenda "Cotización no disponible", en vez de intentar mostrar un ARS
  calculado con un dato inexistente.
- **Rationale**: Resuelto explícitamente por el usuario como decisión de producto (edge case del
  spec). Evita mostrar un precio en pesos igual a 0 o `NaN`, que sería peor experiencia que mostrar
  el dato fuente en dólares con una leyenda clara.
- **Alternatives considered**: Bloquear completamente el catálogo hasta que haya cotización —
  rechazado por ser demasiado disruptivo para un caso de falla temporal de una API externa de
  terceros que el negocio no controla.

### Filtrado del catálogo: cliente vs. índices compuestos (decisión tomada durante /speckit-implement)

- **Decision**: `perfumesService.listarPerfumesPublicos` consulta a Firestore únicamente con
  `where('activo', '==', true)` (índice de campo simple automático) y aplica en el cliente el
  resto de los filtros: `disponible`, `genero`, `marca`, `familiaOlfativa`, `destacado`, `busqueda`
  y el orden por `createdAt`.
- **Rationale**: surgió al implementar T019 (US1). Ningún índice de `firestore.indexes.json`
  cubre `disponible`, y FR-002 exige que género/marca/familia sean filtrables de forma
  **combinable simultánea**, cosa que los 4 índices compuestos aprobados (cada uno combina
  `activo` con un solo segundo campo) no permiten sin agregar índices por cada combinación
  posible. Filtrar en el cliente cumple FR-002 sin necesitar índices nuevos no aprobados
  (Principio VI), y es aceptable para el volumen de un catálogo de nicho (Scale/Scope en
  `plan.md`).
- **Alternatives considered**: Agregar los índices compuestos faltantes (todas las combinaciones
  de género×marca×familia×disponible) — rechazado porque `firestore.indexes.json` fue ratificado
  en la Constitución v1.0.0 y ampliarlo requiere una enmienda formal, no un cambio unilateral
  durante la implementación de una feature.
- **Consecuencia aceptada**: los 4 índices compuestos de `perfumes` en `firestore.indexes.json`
  quedan sin uso por esta estrategia. Se mantienen sin cambios (costo de tenerlos inactivos es
  nulo en Firestore) por si en el futuro se decide mover estos filtros de vuelta a Firestore a
  medida que el catálogo crezca.

## Resumen

No quedan marcadores `NEEDS CLARIFICATION` de tecnología ni de diseño. La Fase 1 (Design & Contracts)
puede proceder directamente sobre las decisiones ya documentadas en la constitución y en este
archivo.
