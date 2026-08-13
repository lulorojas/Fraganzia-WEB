# Quickstart: Validación del Panel Financiero Interno de Socios

**Feature**: 002-panel-financiero-socios | **Date**: 2026-08-12

Guía para validar manualmente, extremo a extremo, cada historia de usuario del spec una vez
implementadas las tareas de esta feature. Sin testing automatizado (ver `research.md` de
`001-catalogo-carrito-admin`, misma decisión aplica acá).

## Prerrequisitos

1. Proyecto de Firebase ya usado por `001-catalogo-carrito-admin`, con al menos un usuario admin
   existente (`admins/{uid}`) — alcanza con la cuenta de Luciano para validar todo, la de Benja es
   un paso manual posterior fuera de este plan.
2. `firestore.rules` extendido con los 9 `match` blocks nuevos (`contracts/firestore-access.md`)
   y **desplegado** a Firebase (`firebase deploy --only firestore:rules`) — sin esto, cualquier
   lectura/escritura de las colecciones nuevas falla por permisos.
3. Documento `socios/luciano` creado manualmente (`{ nombre: "Luciano", authUid: "<uid real>" }`)
   para poder atribuir movimientos.
4. Al menos 2-3 perfumes de prueba ya existentes en `perfumes` (reutilizar los de
   `001-catalogo-carrito-admin`).

## Levantar el entorno

```bash
npm install
npm run dev
```

Iniciar sesión en `/login` con la cuenta admin del prerrequisito antes de cada prueba.

## Validación por historia de usuario

### Historia 1 — Registrar una venta directa de perfume (P1)

1. Ir a `/admin/ventas` (o la ruta elegida), cargar una venta de un perfume con `estado:
   'pendiente'`. Verificar en `/admin` (dashboard) que el stock del producto y el saldo entre
   socios **no cambiaron**.
2. Editar esa misma venta y marcarla `'cobrada'`. Verificar que el stock del producto bajó en la
   cantidad vendida y que el saldo entre socios refleja el 50/50 del importe.
3. Cargar una venta nueva directamente como `'cobrada'`: mismo efecto inmediato.
4. Al elegir el perfume en el formulario, confirmar que se precarga el precio de catálogo y que es
   editable.
5. Intentar vender más unidades de las que hay en stock: confirmar que aparece una advertencia
   antes de guardar (no bloqueo duro).

### Historia 2 — Ver la situación financiera del negocio (P1)

1. Con los movimientos de las historias anteriores cargados, entrar a `/admin` (dashboard).
2. Confirmar que se ve el total en efectivo, Mercado Pago y general de cada socio.
3. Confirmar que el saldo entre socios se muestra como **un único número neto**, no como lista.
4. Confirmar que el stock total, su valor y el detalle por producto son coherentes con lo cargado.
5. Cargar un movimiento nuevo de cualquier tipo y volver al dashboard: confirmar que los totales
   se actualizaron sin acción manual adicional (recarga de la pantalla alcanza).

### Historia 3 — Registrar una compra a proveedores (P1)

1. Cargar una compra de un perfume con cantidad y costo total, con `pagos` divididos entre ambos
   socios en proporciones distintas (ej. Luciano paga 70%, Benja 30%).
2. Verificar que el stock del producto sube en la cantidad comprada.
3. Verificar en el dashboard que el saldo entre socios refleja que Benja le debe a Luciano la
   diferencia entre lo que puso cada uno.
4. Verificar que el valor de stock de ese producto ahora usa el costo unitario de esta compra.
5. Intentar guardar una compra cuyos `pagos` no suman el costo total: confirmar que el sistema
   avisa antes de guardar.

### Historia 4 — Registrar ventas de decants (P2)

1. Cargar una venta de decant de un perfume con un tamaño escrito libremente (ej. "3ml").
2. Verificar que el importe se repartió 50/50 de inmediato (sin pasar por ningún estado
   pendiente).
3. Verificar que el stock de ese perfume no cambió.

### Historia 5 — Registrar gastos compartidos (P2)

1. Cargar un gasto pagado íntegramente por un socio, eligiendo una categoría de la lista fija.
2. Verificar en el dashboard que el saldo entre socios refleja que el otro socio le debe la mitad.

### Historia 6 — Movimientos personales y transferencias (P2)

1. Cargar un retiro personal de un socio: verificar que baja su propio total y que el saldo entre
   socios no se mueve.
2. Con un saldo neto existente a favor de un socio, cargar una transferencia por ese importe entre
   ambos: verificar que el saldo neto queda en cero (o se reduce según el monto).
3. Confirmar que la pantalla dice explícitamente que la transferencia es solo un registro, sin
   mover dinero real.

### Historia 7 — Corregir un movimiento pasado (P3)

1. Editar el precio de una venta ya cargada y cobrada: verificar que el saldo entre socios y el
   stock quedan correctos con el valor nuevo (no arrastran el valor viejo).
2. Anular un movimiento cualquiera: verificar que deja de contar en los totales del dashboard pero
   sigue apareciendo en `/admin/auditoria`.
3. Abrir el detalle de auditoría de un movimiento editado: verificar que se ve el valor anterior,
   el valor nuevo, quién y cuándo.
4. Filtrar el historial por tipo de movimiento, por socio y por rango de fechas: verificar que la
   lista se reduce correctamente en cada caso.

### Historia 8 — Analytics (P3)

1. Con ventas de varios perfumes cargadas, abrir `/admin/analytics`: verificar el ranking de
   perfumes más vendidos por cantidad.
2. Con varias ventas de decant del mismo perfume en tamaños distintos, verificar el desglose de
   tamaños más vendidos para ese perfume.
3. Verificar que se muestra la evolución de ventas en el tiempo y el ingreso total acumulado.
4. Verificar que la actividad por socio se muestra de forma informativa, sin dar a entender una
   comparación o ranking entre ambos.

## Caso de regresión: no debe afectar el sitio público

1. Con el módulo ya cargado con datos, visitar el sitio público (`/`, `/catalogo`,
   `/perfume/:id`) sin sesión iniciada: confirmar que todo funciona igual que antes de esta
   feature, y que ningún dato de `costosProductos` ni de los movimientos internos es visible
   (revisar Network/consola del navegador, no debería haber ninguna lectura exitosa de esas
   colecciones sin sesión admin).

## Criterio de cierre de la feature

La feature se considera validada cuando las 8 historias anteriores pasan sus pasos sin
excepciones, el caso de regresión del sitio público no muestra ninguna filtración de datos
privados, y los 6 Success Criteria del spec (`SC-001` a `SC-006`) se verifican de forma razonable
durante estas pruebas manuales.
