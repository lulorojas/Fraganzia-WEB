# Data Model: Panel Financiero Interno de Socios

**Feature**: 002-panel-financiero-socios | **Date**: 2026-08-12

A diferencia de `001-catalogo-carrito-admin`, ninguna de estas colecciones está definida todavía
en `.specify/memory/constitution.md` §6 — este documento es la fuente de verdad del esquema hasta
que, si corresponde, se incorpore a la constitución en una enmienda futura. Tipos en notación
TypeScript; `Timestamp` es `firebase/firestore`. Todas las colecciones nuevas son privadas
(`isAdmin()` únicamente, ver `contracts/firestore-access.md`).

## Convención común a todos los "movimientos"

Las seis colecciones de movimiento (`ventasSocios`, `ventasDecants`, `compras`, `gastos`,
`movimientosPersonales`, `transferenciasSocios`) comparten estos campos:

- `anulado: boolean` — `false` por defecto. `true` = excluido de todo cálculo (saldo, stock,
  totales), pero el documento nunca se borra físicamente (FR-023, FR-024).
- `fecha: Timestamp` — fecha de la operación (editable, puede no ser "hoy" si se carga tarde).
- `creadoPor: string` — `socioId` de quien cargó el movimiento originalmente.
- `createdAt: Timestamp` / `updatedAt: Timestamp` — metadatos técnicos (`serverTimestamp()`).

Ninguna de las seis expone un método `eliminar*` en su servicio — solo `crear*`, `editar*`,
`anular*` (nunca `deleteDoc`).

## Entidades

### Socio (colección `socios`, id = `luciano` | `benja`)

```typescript
{
  nombre: string;          // Nombre para mostrar
  authUid: string;         // uid de Firebase Auth correspondiente a este socio
}
```
**Reglas de validación**: exactamente 2 documentos, dados de alta manualmente (igual que
`admins`, ver Assumptions del spec). No es mecanismo de seguridad — ver `research.md` Decisión 3.

**Relaciones**: cualquier campo `*Por`/`vendidoPor`/`pagadoPor`/`socioId`/`de`/`a` en las
colecciones de movimiento referencia un `socioId` de esta colección.

### Costo de producto (colección `costosProductos`, id = `perfumeId`)

```typescript
{
  costoUltimaCompra: number;  // Costo real de la compra más reciente de este perfume
  updatedAt: Timestamp;
}
```
**Reglas de validación**: se sobrescribe automáticamente cada vez que se registra una `Compra`
para ese `perfumeId` (FR-014). Privado — nunca expuesto al catálogo público `perfumes`
(`research.md` Decisión 4).

**Relaciones**: 1:1 con `perfumes/{perfumeId}` (colección ya existente, no modificada).

### Venta de perfume (colección `ventasSocios`)

```typescript
{
  perfumeId: string;
  perfumeNombre: string;        // Snapshot del nombre al momento de la venta
  cantidad: number;             // Entero ≥ 1
  precioUnitario: number;       // Editable respecto al precio de catálogo (FR-005)
  vendidoPor: string;           // socioId
  metodoPago: 'efectivo' | 'mercadopago';
  estado: 'pendiente' | 'cobrada';
  anulado: boolean;
  fecha: Timestamp;
  creadoPor: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```
**Reglas de validación**:
- Mientras `estado === 'pendiente'`, NO afecta stock ni saldo entre socios (FR-003).
- Al pasar a `'cobrada'` (alta directa o edición de estado), descuenta `cantidad` del stock de
  `perfumeId` y genera reparto 50/50 de `precioUnitario * cantidad` (FR-004).
- Si `cantidad` a cobrar excede el stock actual del producto, el formulario advierte antes de
  guardar — no bloquea de forma dura (FR-006; el negocio real puede exceder el stock cargado).
- Al anular una venta que estaba `'cobrada'`, el stock del producto recupera la `cantidad`
  (FR-030).

### Venta de decant (colección `ventasDecants`)

```typescript
{
  perfumeId: string;
  perfumeNombre: string;
  tamano: string;                // Texto libre (ej. "2ml", "5 ml") — FR-007
  cantidad: number;
  precioUnitario: number;
  vendidoPor: string;
  metodoPago: 'efectivo' | 'mercadopago';
  anulado: boolean;
  fecha: Timestamp;
  creadoPor: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```
**Reglas de validación**: sin campo `estado` — siempre reparte 50/50 de inmediato al crearse
(FR-008). Nunca afecta el stock de `perfumes` (FR-009).

### Compra (colección `compras`)

```typescript
{
  proveedor: string;
  perfumeId: string;
  perfumeNombre: string;
  cantidad: number;
  costoUnitario: number;
  costoTotal: number;             // Debe coincidir con costoUnitario * cantidad
  pagos: Array<{
    socioId: string;
    monto: number;
    metodo: 'efectivo' | 'mercadopago';
  }>;
  anulado: boolean;
  fecha: Timestamp;
  creadoPor: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```
**Reglas de validación**:
- `pagos` DEBE sumar exactamente `costoTotal`; si no, el formulario advierte antes de guardar
  (FR-013).
- Al guardar, aumenta el stock de `perfumeId` en `cantidad` (FR-011) y sobrescribe
  `costosProductos/{perfumeId}.costoUltimaCompra` con `costoUnitario` (FR-014).
- El desbalance entre socios generado es: por cada socio, `montoPagado - costoTotal/2`
  (positivo = puso de más, se lo debe el otro) (FR-012).
- Al anular, se resta `cantidad` del stock del producto (puede dejarlo en negativo; el sistema no
  bloquea la anulación por eso — FR-031).

### Gasto (colección `gastos`)

```typescript
{
  categoria: string;              // Una de GASTO_CATEGORIAS (constants), lista fija editable
  descripcion: string;
  monto: number;
  pagadoPor: string;               // socioId
  metodoPago: 'efectivo' | 'mercadopago';
  anulado: boolean;
  fecha: Timestamp;
  creadoPor: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```
**Reglas de validación**: siempre reparto 50/50 sobre `monto` (FR-016). `categoria` se valida
contra `GASTO_CATEGORIAS` en `src/constants/index.js` (lista fija, editable en código, no en
runtime — FR-015).

### Movimiento personal (colección `movimientosPersonales`)

```typescript
{
  socioId: string;
  tipo: 'retiro' | 'aporte';
  monto: number;
  metodo: 'efectivo' | 'mercadopago';
  anulado: boolean;
  fecha: Timestamp;
  creadoPor: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```
**Reglas de validación**: nunca genera desbalance entre socios — solo afecta el total individual
(efectivo/MP) del `socioId` correspondiente: `aporte` suma, `retiro` resta (FR-017).

### Transferencia entre socios (colección `transferenciasSocios`)

```typescript
{
  de: string;                     // socioId que transfiere
  a: string;                      // socioId que recibe
  monto: number;
  metodo: 'efectivo' | 'mercadopago';
  anulado: boolean;
  fecha: Timestamp;
  creadoPor: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```
**Reglas de validación**: es solo constancia contable — no mueve dinero real (FR-018). Reduce el
saldo neto entre socios en `monto` a favor de `de` (equivalente a que `de` ya le pagó a `a`).

### Registro de auditoría (colección `auditoria`)

```typescript
{
  coleccion: string;               // nombre de la colección afectada, ej. 'ventasSocios'
  documentoId: string;
  accion: 'create' | 'update' | 'void';
  valorAnterior: object | null;    // null si accion === 'create'
  valorNuevo: object | null;       // null si accion === 'void'
  modificadoPor: string;           // socioId
  modificadoAt: Timestamp;
}
```
**Reglas de validación**: se escribe en el mismo `writeBatch` que la creación/edición/anulación
del movimiento que documenta — nunca como paso separado (FR-025, `research.md` Decisión 1). Nunca
se edita ni se anula un registro de auditoría existente.

## Cálculos derivados (sin persistencia — `services/panelFinancieroCalculos.js`)

Estas funciones son puras: reciben los arrays ya leídos de Firestore (filtrados `anulado != true`)
y devuelven el resultado. No hay estado ni caché propios más allá del cacheo de TanStack Query
sobre las lecturas (ver `research.md` Decisión 2).

- **Totales por socio** (efectivo / Mercado Pago / general): suma de `movimientosPersonales`
  (aporte +, retiro −) de ese socio, más su participación 50/50 en `ventasSocios` (solo
  `estado === 'cobrada'`), `ventasDecants`, `gastos` (como contrapartida) y `compras` (`pagos[]`
  de ese socio), agrupado por `metodo`/`metodoPago`.
- **Saldo neto entre socios**: suma algebraica de todos los desbalances 50/50 (ventas, decants,
  gastos, compras) más/menos `transferenciasSocios`, colapsada en un único número con signo
  (positivo = Benja le debe a Luciano, negativo = al revés) — nunca una lista (FR-020).
- **Stock por producto**: `Σ compras.cantidad − Σ ventasSocios.cantidad (estado === 'cobrada')`,
  agrupado por `perfumeId`, sobre movimientos no anulados.
- **Valor de stock**: `stock por producto × costosProductos[perfumeId].costoUltimaCompra`.

## Diagrama de relaciones

```text
Socio ──< vendidoPor/pagadoPor/socioId/de/a >── {ventasSocios, ventasDecants, compras, gastos,
                                                   movimientosPersonales, transferenciasSocios}
Perfume (existente) ──< perfumeId >── ventasSocios, ventasDecants, compras
Perfume (existente) ──< 1:1 >── costosProductos (id = perfumeId)
{ventasSocios, ventasDecants, compras, gastos, movimientosPersonales, transferenciasSocios}
  ──< documentoId >── auditoria (1:N — cada create/update/void agrega una entrada)
```

## Concurrencia

Igual que en `001-catalogo-carrito-admin`: sin control de concurrencia optimista. Dos socios
editando el mismo movimiento al mismo tiempo → last-write-wins, aceptado como decisión consciente
dado que solo hay dos usuarios de confianza operando el sistema.
