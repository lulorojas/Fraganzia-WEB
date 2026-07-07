# Contract: Acceso a colecciones Firestore

**Feature**: 001-catalogo-carrito-admin

Esta app no expone una API HTTP propia (Principio IV). El contrato entre el frontend y el
"backend" (Firestore) son las reglas de seguridad ya ratificadas en `firestore.rules`
(Constitución §7). Este documento resume, por colección, quién puede leer/escribir y con qué
forma de datos, para que la capa `services/` de esta feature la respete sin reinterpretarla.

| Colección | Lectura | Escritura | Notas de contrato |
|---|---|---|---|
| `perfumes` | Pública | Solo admin | El cliente solo lee `activo == true` y `disponible == true` (filtrado en query, no en regla). |
| `promociones` | Pública | Solo admin | El cliente solo lee `activa == true`, ordenado por `orden`. |
| `config` (`general`) | Pública | Solo admin | El cliente lee `whatsappNumero` y `dolarBlueManual`; nunca escribe desde el flujo de compra. |
| `pedidos` | Solo admin | Creación pública restringida | `create` exige `estado == 'confirmado'` y `metodoPago` válido (regla ya aplicada). El cliente **nunca** lee ni lista pedidos ajenos. |
| `estadisticas` | Solo admin | Pública restringida a campos permitidos | El cliente solo puede escribir `{perfumeId, vistas, agregadosCarrito, updatedAt}`; nunca lee esta colección. |
| `admins` | Solo admin | Ninguna (alta manual) | El cliente nunca lee ni escribe esta colección directamente; se usa solo indirectamente vía `isAdmin()`. |

## Contrato de creación de `pedidos` (checkout público)

**Quién**: cualquier visitante (sin autenticación).
**Qué envía** (ver `data-model.md` → Pedido):
```
{
  items: [{ perfumeId, nombre, marca, precioUSD, precioARS, cantidad }],
  metodoPago: 'Transferencia' | 'Efectivo',
  dolarBlueUsado: number,
  subtotalARS: number,
  descuentoARS: number,
  totalARS: number,
  clienteNombre: string,
  estado: 'confirmado',
  createdAt: serverTimestamp()
}
```
**Garantía del servidor (regla Firestore)**: rechaza el `create` si `estado` no es exactamente
`'confirmado'` o si `metodoPago` no es uno de los dos valores permitidos. La validación de forma
completa (campos obligatorios, tipos) se hace en el cliente con Zod (`schemas/pedidoSchema.js`)
antes de enviar, como primera línea de defensa.

## Contrato de incremento de `estadisticas` (público, restringido por campos)

**Quién**: cualquier visitante.
**Qué puede escribir**: únicamente el documento `estadisticas/{perfumeId}` y únicamente los campos
`perfumeId`, `vistas`, `agregadosCarrito`, `updatedAt`. Cualquier otro campo en el payload hace que
Firestore rechace la escritura completa (regla `hasOnly`).

## Contrato externo consumido: cotización del dólar

**Quién lo expone**: servicio externo `dolarapi.com` (no controlado por este proyecto).
**Endpoint consumido**: `GET https://dolarapi.com/v1/dolares/blue` (Constitución §13,
`DOLAR_BLUE_API`).
**Forma esperada de la respuesta** (mínima usada por esta feature):
```
{ "compra": number, "venta": number }
```
**Comportamiento ante falla o forma inesperada**: el cliente no debe romper; cae al fallback de
`config/general.dolarBlueManual`, y si tampoco existe, aplica FR-033 (leyenda "Cotización no
disponible"). Ver `research.md` para el detalle de esta decisión.

## Contrato de salida: mensaje de WhatsApp

**Quién lo consume**: la app WhatsApp del negocio, a través de un link `https://wa.me/<numero>`
con el pedido ya persistido en Firestore antes de abrir el link (orden establecido en
Constitución §15, nota 11: persistir primero, abrir después).
**Contenido mínimo garantizado** (FR-015): productos con cantidades, método de pago elegido y
total final. El formato exacto de texto es un detalle de implementación de `utils/whatsapp.js`
(constitución §8.2), no un contrato externo versionado.
