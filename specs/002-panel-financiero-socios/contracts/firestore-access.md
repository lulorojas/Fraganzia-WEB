# Contract: Acceso a colecciones Firestore

**Feature**: 002-panel-financiero-socios

Sin API HTTP propia (Principio IV). El contrato entre el frontend y Firestore son las reglas de
seguridad que se agregan a `firestore.rules`, todas reutilizando la función `isAdmin()` ya
ratificada (Constitución §7) — sin tocar los bloques existentes de `perfumes`, `promociones`,
`config`, `pedidos`, `estadisticas`, `admins`.

| Colección | Lectura | Escritura | Notas de contrato |
|---|---|---|---|
| `socios` | Solo admin | Solo admin | Solo 2 documentos (`luciano`, `benja`), alta/edición manual desde consola o una pantalla simple de setup — no hay alta de socios nuevos desde la UI en esta versión. |
| `costosProductos` | Solo admin | Solo admin | Nunca de lectura pública — evita exponer el costo real de compra en la tienda. |
| `ventasSocios` | Solo admin | Solo admin | Sin `deleteDoc`; anulación = `update` con `anulado: true`. |
| `ventasDecants` | Solo admin | Solo admin | Ídem. |
| `compras` | Solo admin | Solo admin | Ídem. |
| `gastos` | Solo admin | Solo admin | Ídem. |
| `movimientosPersonales` | Solo admin | Solo admin | Ídem. |
| `transferenciasSocios` | Solo admin | Solo admin | Ídem. |
| `auditoria` | Solo admin | Solo admin | Se escribe únicamente desde los servicios de este módulo, nunca editada ni anulada una vez creada. |

Bloque de reglas a agregar (todas con la misma forma, `isAdmin()` ya definida en el archivo):

```javascript
match /socios/{socioId} {
  allow read, write: if isAdmin();
}
match /costosProductos/{perfumeId} {
  allow read, write: if isAdmin();
}
match /ventasSocios/{id} {
  allow read, write: if isAdmin();
}
match /ventasDecants/{id} {
  allow read, write: if isAdmin();
}
match /compras/{id} {
  allow read, write: if isAdmin();
}
match /gastos/{id} {
  allow read, write: if isAdmin();
}
match /movimientosPersonales/{id} {
  allow read, write: if isAdmin();
}
match /transferenciasSocios/{id} {
  allow read, write: if isAdmin();
}
match /auditoria/{id} {
  allow read, write: if isAdmin();
}
```

## Contrato de escritura atómica movimiento + auditoría

**Quién**: cualquier socio autenticado (`isAdmin()` true).

**Qué garantiza el cliente** (no la regla de Firestore — ver `research.md` Decisión 1): toda
llamada a `crear*`/`editar*`/`anular*` de cualquier servicio de movimiento (`ventasSociosService`,
`comprasService`, etc.) arma un `writeBatch` con exactamente dos operaciones — el `set`/`update`
del movimiento y el `addDoc`-equivalente (`doc()` + `batch.set()`) de su entrada en `auditoria` — y
llama `batch.commit()` una sola vez. Si el commit falla, ninguna de las dos escrituras se aplica.

**Forma de la entrada de auditoría generada** (ver `data-model.md` → Registro de auditoría):
```
{
  coleccion: '<nombre de la colección del movimiento>',
  documentoId: '<id del documento del movimiento>',
  accion: 'create' | 'update' | 'void',
  valorAnterior: <objeto previo o null>,
  valorNuevo: <objeto nuevo o null>,
  modificadoPor: '<socioId>',
  modificadoAt: serverTimestamp(),
}
```

## Contrato de cálculo del dashboard (cliente, sin persistencia)

**Quién lo consume**: `usePanelFinanciero.js` y las pantallas de dashboard/analytics.

**Qué garantiza**: las funciones de `services/panelFinancieroCalculos.js` son puras — mismo input
(arrays de movimientos ya filtrados `anulado != true`) siempre produce el mismo output. No leen ni
escriben Firestore directamente; reciben los datos ya obtenidos por los hooks correspondientes.
Ver `data-model.md` → "Cálculos derivados" para las fórmulas exactas de cada total.

**Invalidación**: toda mutación (`crear*`/`editar*`/`anular*` de cualquier movimiento) DEBE
invalidar, como mínimo, las queries de TanStack Query de su propia colección y de
`usePanelFinanciero` (que agrega todas), mismo patrón que `qc.invalidateQueries` en
`AdminPerfumes.jsx`.
