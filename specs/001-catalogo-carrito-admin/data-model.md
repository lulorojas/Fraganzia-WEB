# Data Model: Catálogo, Carrito, Checkout por WhatsApp y Administración

**Feature**: 001-catalogo-carrito-admin | **Date**: 2026-07-07

Fuente de verdad del esquema de colecciones: `.specify/memory/constitution.md` §6. Este documento
extrae las entidades relevantes para esta feature, sus reglas de validación (derivadas de los
Functional Requirements del spec) y las relaciones entre ellas. No redefine tipos; referencia la
constitución para el detalle campo por campo.

## Entidades

### Perfume (colección `perfumes`)

Representa un producto en venta. Ver Constitución §6 para el tipo completo.

**Reglas de validación (spec → constitución)**:
- `nombre`, `marca`, `genero`, `familiaOlfativa`, `precioUSD`, `volumenML` son obligatorios al
  crear (FR-020: el sistema impide guardar si falta un dato obligatorio).
- `genero` ∈ `GENEROS` (Masculino, Femenino, Kids) — Constitución §13.
- `familiaOlfativa` ∈ `FAMILIAS_OLFATIVAS`, `marca` ∈ `MARCAS` — Constitución §13.
- `activo: false` oculta el perfume del catálogo público pero lo conserva en el panel admin
  (FR-005, FR-022).
- `disponible: false` también excluye al perfume del catálogo público (FR-005) y dispara el
  comportamiento de FR-030 si está en un carrito activo.

**Relaciones**: referenciado por `Pedido.items[].perfumeId` (snapshot, no vivo), por
`Promoción.perfumeIds` (opcional) y por `Estadística` (1:1 vía `estadisticas/{perfumeId}`).

### Carrito (estado de cliente, no colección Firestore)

Colección temporal de ítems elegidos por un cliente antes de confirmar un pedido. No es una
entidad persistida en Firestore (ver `research.md` — decisión de persistencia en `localStorage`).

**Forma del estado**:
```
{
  items: [{ perfumeId, nombre, marca, precioUSD, cantidad }],
  metodoPago: 'Transferencia' | 'Efectivo'
}
```

**Reglas de validación**:
- Un mismo `perfumeId` nunca aparece en dos líneas distintas; se consolida sumando `cantidad`
  (FR-007).
- `cantidad` es un entero ≥ 1, sin cota superior (FR-032).
- Si un `perfumeId` del carrito pasa a `disponible: false` o `activo: false`, se quita
  automáticamente del carrito antes de permitir confirmar (FR-030).

### Pedido (colección `pedidos`)

Registro inmutable de una compra confirmada. Ver Constitución §6 para el tipo completo.

**Reglas de validación (spec → constitución)**:
- Se crea únicamente con `estado: 'confirmado'` (no hay otros estados en esta versión — ya
  decidido en la constitución, no es una omisión de esta feature).
- `metodoPago` ∈ `['Transferencia', 'Efectivo']` (FR-010).
- `descuentoARS` es `subtotalARS * 0.05` si `metodoPago === 'Efectivo'`, si no `0` (FR-011).
- `clienteNombre` es obligatorio y no vacío (FR-012).
- No se crea si el carrito de origen está vacío (FR-013).
- Los precios (`precioUSD`, `precioARS` por ítem) son **snapshots** al momento de confirmar, no
  referencias vivas al perfume — así el historial de pedidos no cambia si el precio del perfume
  cambia después.

**Relaciones**: cada línea de `items[]` referencia un `perfumeId`, pero por snapshot, no por
lectura en vivo.

### Promoción (colección `promociones`)

Contenido destacado publicado en la portada. Ver Constitución §6.

**Reglas de validación**:
- Solo se muestran públicamente las promociones con `activa: true`, ordenadas por `orden` asc
  (FR-026).
- Es puramente informativa: no modifica el precio de los perfumes que referencia (Assumption del
  spec).

### Configuración general (documento único `config/general`)

Ver Constitución §6.

**Reglas de validación**:
- Documento único (`id: "general"`); no hay múltiples configuraciones (Assumption del spec).
- `whatsappNumero` alimenta el destino de FR-015 (mensaje de WhatsApp al confirmar pedido).
- `dolarBlueManual` es el fallback usado cuando la cotización automática no está disponible
  (FR-028); si tampoco existe, aplica FR-033 (leyenda "Cotización no disponible").

### Estadística (colección `estadisticas`, id = `perfumeId`)

Ver Constitución §6. Alimenta el Dashboard del admin (Historia 5 relacionada, aunque el Dashboard
en sí no tiene historia propia dedicada en este spec — se cubre indirectamente vía Historia 5).

### Administrador (colección `admins`, id = uid de Firebase Auth)

Ver Constitución §6 y §7 (`isAdmin()`). Alta manual fuera de este flujo (Assumption del spec).

## Concurrencia (FR-034)

Ninguna entidad de esta feature implementa control de concurrencia optimista (sin campo de
versión, sin transacciones de comparación). Las escrituras de `perfumes` y `config/general` desde
el panel admin son last-write-wins: la última escritura exitosa en Firestore prevalece. Documentado
como decisión consciente para v1, no como omisión.

## Diagrama de relaciones

```text
Perfume ──< referenciado por snapshot >── Pedido.items[]
Perfume ──< referenciado opcionalmente >── Promoción.perfumeIds[]
Perfume ──< 1:1 >── Estadística (id = perfumeId)
Administrador ──< dueño de >── Perfume / Promoción / Configuración (vía reglas isAdmin())
Carrito (cliente, localStorage) ──< se confirma como >── Pedido (Firestore)
```
