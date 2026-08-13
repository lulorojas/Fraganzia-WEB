# Research: Panel Financiero Interno de Socios

No quedaron `NEEDS CLARIFICATION` en el Technical Context — todas las decisiones técnicas se
acordaron explícitamente con el usuario antes de este plan (ver conversación de aprobación). Este
documento deja constancia del porqué de cada decisión, para consulta futura.

## Decisión 1: Escritura atómica de movimiento + auditoría con `writeBatch`, no `runTransaction`

**Decisión**: Cada alta/edición/anulación de un movimiento y su entrada correspondiente en
`auditoria` se escriben en un único `writeBatch` (hasta 2 escrituras: el documento del movimiento
+ el documento de auditoría).

**Rationale**: `writeBatch` no hace lecturas, solo agrupa escrituras atómicas — alcanza para
garantizar que el movimiento y su rastro de auditoría nunca queden desincronizados. No hace falta
`runTransaction` (que sí permite lecturas) porque ninguna escritura de este flujo depende de leer
otro documento primero (el "valor anterior" para el diff de auditoría ya se tiene en memoria desde
el formulario de edición, no hace falta releerlo de Firestore dentro de la misma operación).

**Alternatives considered**:
- `runTransaction` para todo: descartado porque agrega complejidad y límites de lecturas sin
  necesidad real acá; se reserva para el día que un flujo necesite leer-antes-de-escribir de forma
  consistente.
- Dos escrituras sueltas (`addDoc` + `addDoc` sin batch): descartado porque una falla de red entre
  ambas dejaría un movimiento sin su rastro de auditoría, violando el requisito de trazabilidad
  completa (FR-025).

## Decisión 2: Saldo/stock se recalculan leyendo colecciones completas, sin documento de resumen

**Decisión**: No existe ningún documento Firestore que acumule un total (ni `saldoNeto`, ni
`stockActual` por producto). Todo se calcula en el cliente, en el momento de mostrarlo, leyendo
con `getDocs` las colecciones relevantes y sumando en memoria (JS puro), filtrando
`anulado != true`.

**Rationale**: Es la única forma de cumplir FR-032 (nunca hay drift al editar un movimiento
pasado) sin la complejidad de recalcular-y-reescribir un resumen dentro de una transacción cada
vez que crece el historial — que además tiene límites de lecturas por transacción en Firestore que
se volverían un problema a medida que crecen las colecciones. La spec técnica original dejaba esta
decisión explícitamente abierta ("a decidir según performance real, no bloqueante").

**Alternatives considered**:
- Documento de resumen recalculado dentro de una transacción en cada write: descartado por el
  límite de lecturas de las transacciones de Firestore y porque no aporta nada sobre leer directo,
  dado el volumen esperado (negocio de 2 personas).
- Documento de resumen que se incrementa/decrementa: es exactamente lo que la spec prohíbe
  explícitamente (fuente del drift que se quiere evitar).
- Cache con invalidación (documento de resumen + invalidar en cada write): se deja como posible
  optimización futura si el volumen de movimientos hace lento el cálculo en cliente; no se
  implementa ahora (YAGNI, Principio VI — no inventar antes de que haga falta).

## Decisión 3: `socios` es tabla de mapeo, `admins/{uid}` sigue siendo el gate de seguridad

**Decisión**: El acceso a todas las pantallas y colecciones de este módulo se sigue controlando
con la función `isAdmin()` ya definida en `firestore.rules` (existencia de `admins/{uid}`) y el
`ProtectedRoute` ya existente en el cliente. La colección nueva `socios/{socioId}` (`luciano`,
`benja`) solo guarda `{ nombre, authUid }` para saber, dado un UID autenticado, a qué socio
atribuir un movimiento — no participa de ninguna regla de seguridad.

**Rationale**: Evita duplicar el mecanismo de auth ya en producción y probado. Como solo va a
haber dos documentos en `admins` (Luciano y Benja), `isAdmin()` ya equivale en la práctica a "es
uno de los dos socios", sin necesidad de una regla paralela basada en `socios.authUid`.

**Alternatives considered**:
- Reglas de seguridad basadas en `socios/{uid}.authUid` (como proponía la spec técnica original):
  descartado tras confirmar que ya existe `admins/{uid}` en producción; introducir un segundo
  mecanismo de gate sería redundante y un riesgo de que ambos se desincronicen.

## Decisión 4: Costo de producto en colección separada, no como campo en `perfumes`

**Decisión**: `costosProductos/{perfumeId}: { costoUltimaCompra, updatedAt }` vive aparte de
`perfumes`.

**Rationale**: `perfumes` tiene `allow read: if true` (lectura pública, la usa la tienda). Agregar
el costo real de compra ahí lo expondría públicamente. Una colección separada con
`allow read, write: if isAdmin()` mantiene el catálogo público intacto sin tocar su schema ni sus
reglas existentes.

**Alternatives considered**:
- Subcolección `perfumes/{id}/privado/costos`: funcionalmente equivalente; se prefiere colección
  top-level `costosProductos` por consistencia con el resto de las colecciones nuevas de este
  módulo (todas top-level) y porque simplifica las reglas (un solo `match` en vez de reglas
  anidadas por subcolección).

## Decisión 5: Nomenclatura en español para el dominio nuevo

**Decisión**: Colecciones y campos de dominio en español (`ventasSocios`, `precioUnitario`,
`vendidoPor`, `anulado`...), confirmado explícitamente por el usuario.

**Rationale**: Consistencia con `perfumes`/`pedidos`/`promociones`/`admins`/`config` ya en
producción y con la Nota crítica #8 de la constitución del proyecto (dominio en español, capa
técnica en inglés). La spec técnica original traída por el usuario usaba inglés (`sales`,
`purchases`...) porque no tenía visibilidad de esta convención ya establecida en el repo.
