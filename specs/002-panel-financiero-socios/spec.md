# Feature Specification: Panel Financiero Interno de Socios

**Feature Branch**: `002-panel-financiero-socios`

**Created**: 2026-08-12

**Status**: Draft

**Input**: User description: "Panel financiero interno de socios: sistema privado (solo Luciano y
Benja, cada uno con su cuenta) para registrar ventas directas de perfumes, ventas de decants,
compras a proveedores, gastos, movimientos personales (aportes/retiros) y transferencias entre
socios, con stock y saldo neto entre socios calculados siempre a partir de la suma de movimientos
(nunca contadores acumulativos), auditoría de cambios sin borrado físico, y pantallas de
dashboard, altas por tipo de movimiento, historial/auditoría y analytics."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registrar una venta directa de un perfume (Priority: P1)

Un socio vende un perfume completo por fuera de la tienda online (en persona, por redes, etc.) y
lo carga en el sistema: qué perfume, cuántas unidades, a qué precio, quién lo vendió y cómo se
cobró. Si todavía no se cobró, la venta queda marcada como pendiente y no afecta el stock ni el
reparto entre socios hasta que se confirma el cobro.

**Why this priority**: Es el tipo de movimiento más frecuente del negocio y el que más impacta el
stock y el dinero de los socios; sin poder registrar ventas correctamente, ningún otro cálculo del
sistema (saldo, stock) tiene sentido.

**Independent Test**: Puede probarse por completo registrando una venta pendiente, verificando que
no afecta stock ni saldo, y luego marcándola como cobrada, verificando que el stock baja y el
reparto 50/50 queda reflejado, sin necesidad de que existan otros tipos de movimiento.

**Acceptance Scenarios**:

1. **Given** un perfume con stock cargado, **When** un socio registra una venta de ese perfume
   marcada como cobrada, **Then** el stock del perfume disminuye en la cantidad vendida y el
   importe de la venta queda repartido 50/50 entre ambos socios.
2. **Given** un socio registra una venta como pendiente de cobro, **When** consulta el stock y el
   saldo entre socios, **Then** ninguno de los dos se modifica todavía.
3. **Given** una venta pendiente existente, **When** un socio la marca como cobrada, **Then** en
   ese momento (y no antes) el stock baja y se genera el reparto 50/50.
4. **Given** un socio está cargando una venta, **When** selecciona el perfume, **Then** el sistema
   le muestra el precio de catálogo como punto de partida, pero le permite modificarlo para
   reflejar el precio real acordado con el cliente.
5. **Given** un socio intenta registrar una venta cobrada por más unidades de las que hay en
   stock, **When** confirma, **Then** el sistema le advierte de la situación antes de guardar.

---

### User Story 2 - Ver de un vistazo la situación financiera del negocio (Priority: P1)

Cualquiera de los dos socios entra al panel y ve, sin tener que hacer cuentas, cuánto dinero tiene
cada uno (separado por efectivo y Mercado Pago), cuánto le debe un socio al otro en total, cuánto
stock hay y cuánto vale, y los movimientos más recientes.

**Why this priority**: Es la razón de ser del sistema — reemplaza cálculos manuales propensos a
error. Sin esta vista, cargar movimientos no aporta valor inmediato a los socios.

**Independent Test**: Puede probarse cargando algunos movimientos de distintos tipos y verificando
que el panel principal muestre totales por socio, un único saldo neto entre ambos, y el stock
valorizado, todos coherentes con los movimientos cargados.

**Acceptance Scenarios**:

1. **Given** existen movimientos de ventas, compras, gastos y movimientos personales, **When** un
   socio abre el panel principal, **Then** ve el total en efectivo, en Mercado Pago y general de
   cada socio.
2. **Given** existe cualquier combinación de movimientos que generan desbalance entre socios,
   **When** el socio consulta el saldo entre socios, **Then** ve un único número neto que indica
   quién le debe a quién (o que están equilibrados), nunca una lista de deudas separadas.
3. **Given** hay perfumes con stock cargado, **When** el socio consulta el panel, **Then** ve la
   cantidad total en stock, el valor total del stock y el detalle por producto.
4. **Given** se cargó un movimiento nuevo de cualquier tipo, **When** el socio vuelve al panel
   principal, **Then** los totales reflejan ese movimiento sin necesidad de acciones manuales
   adicionales.

---

### User Story 3 - Registrar una compra a proveedores (Priority: P1)

Un socio carga una compra de perfumes a un proveedor: qué producto, cuántas unidades, el costo
real pagado, y cómo se dividió el pago entre los dos socios (cada uno puede haber pagado una parte
distinta, en efectivo o Mercado Pago). El stock del producto aumenta y el sistema calcula
automáticamente si un socio quedó a favor o en contra del otro según lo que cada uno puso.

**Why this priority**: Sin registrar compras no hay stock que vender ni costo de referencia para
saber cuánto vale el inventario; es el otro extremo del ciclo de negocio junto con las ventas.

**Independent Test**: Puede probarse registrando una compra donde cada socio aporta un monto
distinto y verificando que el stock del producto sube en la cantidad comprada y que el saldo entre
socios refleja la diferencia entre lo que aportó cada uno.

**Acceptance Scenarios**:

1. **Given** un socio registra una compra de un perfume con cantidad y costo total, **When** la
   guarda, **Then** el stock de ese perfume aumenta en la cantidad comprada.
2. **Given** una compra donde ambos socios pusieron dinero en proporciones distintas al costo
   total, **When** se guarda la compra, **Then** el saldo entre socios refleja quién puso de más.
3. **Given** se registró una compra, **When** un socio consulta el valor del stock de ese
   producto, **Then** el sistema usa el costo de esta compra como referencia más reciente.

---

### User Story 4 - Registrar ventas de decants (Priority: P2)

Un socio carga una venta de una fracción (decant) de un perfume: de qué perfume, qué tamaño (en
texto libre, ya que los tamaños pueden variar), cantidad, precio y cómo se cobró. A diferencia de
la venta de un perfume completo, no afecta el stock de frascos y se reparte 50/50 de inmediato,
sin estado pendiente.

**Why this priority**: Es una línea de ingresos habitual del negocio, distinta de la venta de
perfumes completos, pero de menor volumen relativo — puede vivir sin bloquear el resto del
sistema.

**Independent Test**: Puede probarse registrando una venta de decant y verificando que se refleja
de inmediato en el saldo entre socios, sin ningún cambio en el stock de perfumes.

**Acceptance Scenarios**:

1. **Given** un socio registra una venta de decant, **When** la guarda, **Then** el importe queda
   repartido 50/50 de inmediato entre ambos socios, sin pasar por un estado pendiente.
2. **Given** se registró una venta de decant, **When** un socio consulta el stock del perfume
   correspondiente, **Then** el stock no cambió.
3. **Given** un socio está cargando una venta de decant, **When** completa el tamaño, **Then**
   puede escribir cualquier valor (por ejemplo "2ml", "5 ml", "medio frasco"), sin estar limitado a
   una lista fija.

---

### User Story 5 - Registrar gastos compartidos del negocio (Priority: P2)

Un socio carga un gasto del negocio (por ejemplo envíos, insumos, marketing): categoría, importe,
quién lo pagó y con qué método. El gasto siempre se reparte 50/50 entre ambos socios.

**Why this priority**: Los gastos afectan igual que las ventas al saldo entre socios; es necesario
para que el saldo neto sea confiable, pero de menor frecuencia que las ventas.

**Independent Test**: Puede probarse registrando un gasto pagado íntegramente por un socio y
verificando que el saldo entre socios refleja que el otro socio le debe la mitad de ese gasto.

**Acceptance Scenarios**:

1. **Given** un socio registra un gasto pagado por él mismo, **When** lo guarda, **Then** el saldo
   entre socios refleja que el otro socio le debe la mitad del importe.
2. **Given** un socio está cargando un gasto, **When** elige la categoría, **Then** selecciona de
   una lista predefinida de categorías (por ejemplo Envíos, Insumos, Marketing, Alquiler, Otros).

---

### User Story 6 - Registrar movimientos personales y transferencias entre socios (Priority: P2)

Un socio registra sus propios aportes o retiros de dinero del negocio (que no generan deuda con el
otro socio, solo afectan su propio total), y también puede dejar constancia de una transferencia
de dinero ya realizada entre ambos por fuera del sistema, para que el saldo neto quede saldado sin
necesidad de que el sistema mueva plata real.

**Why this priority**: Completa el panorama financiero individual de cada socio y permite saldar
manualmente una deuda registrada, pero no es indispensable para el día a día de ventas/compras.

**Independent Test**: Puede probarse registrando un aporte propio de un socio y verificando que
solo cambia su propio total (no el saldo entre socios), y por separado registrando una
transferencia entre ambos y verificando que el saldo neto entre socios se ajusta en consecuencia.

**Acceptance Scenarios**:

1. **Given** un socio registra un retiro propio, **When** lo guarda, **Then** su propio total baja
   en ese importe y el saldo entre socios no se modifica.
2. **Given** existe un saldo a favor de un socio, **When** el otro socio registra una
   transferencia por ese importe, **Then** el saldo neto entre ambos se reduce en consecuencia.
3. **Given** se registra una transferencia, **When** se consulta cualquier total individual de
   efectivo/Mercado Pago, **Then** el sistema deja explícito que es solo un registro contable y no
   movió dinero real.

---

### User Story 7 - Corregir un movimiento pasado sin perder el historial (Priority: P3)

Un socio necesita corregir un dato mal cargado en un movimiento anterior (por ejemplo un precio
equivocado) o anular un movimiento cargado por error. El sistema nunca borra información: guarda
tanto el valor anterior como el nuevo, y quién hizo el cambio y cuándo, de forma consultable.

**Why this priority**: Da confianza para operar el sistema sabiendo que un error de carga es
corregible sin perder trazabilidad ni generar desconfianza entre socios, pero solo es necesario
una vez que ya hay movimientos cargados con los otros flujos.

**Independent Test**: Puede probarse editando el importe de un movimiento ya cargado y verificando
que el saldo entre socios se recalcula correctamente reflejando el nuevo valor, y que el historial
muestra el valor anterior y el nuevo.

**Acceptance Scenarios**:

1. **Given** un movimiento cargado con datos erróneos, **When** un socio lo edita, **Then** todos
   los totales que dependían de ese movimiento (saldo, stock, totales por socio) quedan
   correctos según el valor corregido, sin necesidad de ajustes manuales adicionales.
2. **Given** un movimiento que ya no corresponde, **When** un socio lo anula, **Then** deja de
   contar para cualquier cálculo (saldo, stock, totales), pero sigue apareciendo en el historial.
3. **Given** cualquier edición o anulación de un movimiento, **When** un socio consulta el
   historial, **Then** ve qué cambió, el valor anterior, el valor nuevo, quién lo hizo y cuándo.
4. **Given** el historial de movimientos, **When** un socio lo filtra (por tipo de movimiento, por
   socio o por rango de fechas), **Then** ve únicamente los movimientos que cumplen ese filtro.

---

### User Story 8 - Analizar el desempeño del negocio (Priority: P3)

Un socio consulta reportes simples sobre qué se está vendiendo: los perfumes más vendidos, los
decants más pedidos por perfume, los tamaños de decant más elegidos, cómo evolucionan las ventas
en el tiempo, el ingreso total y la actividad de carga de cada socio (a modo informativo, sin
comparar quién "trabaja más").

**Why this priority**: Aporta valor estratégico para decidir qué reponer o promocionar, pero el
negocio funciona sin esta vista; depende de que ya existan meses de movimientos cargados para ser
útil.

**Independent Test**: Puede probarse cargando varias ventas de distintos perfumes y tamaños de
decant en distintas fechas, y verificando que los reportes reflejan correctamente los más vendidos
y la evolución en el tiempo.

**Acceptance Scenarios**:

1. **Given** existen ventas de varios perfumes, **When** un socio abre analytics, **Then** ve un
   ranking de los perfumes más vendidos por cantidad.
2. **Given** existen ventas de decants de un mismo perfume en distintos tamaños, **When** un socio
   consulta ese perfume, **Then** ve qué tamaños se pidieron más.
3. **Given** existen ventas repartidas en varios meses, **When** un socio consulta la evolución de
   ventas, **Then** ve cómo varió el volumen o el ingreso a lo largo del tiempo.
4. **Given** ambos socios cargaron movimientos, **When** se consulta la actividad por socio,
   **Then** se muestra de forma informativa, sin presentarla como un ranking o comparación.

---

### Edge Cases

- Si se anula una venta ya cobrada que había descontado stock, el stock de ese producto vuelve a
  sumar la cantidad de esa venta (ver FR-030).
- Si se anula una compra que había aumentado stock, el stock de ese producto se resta en
  consecuencia; si eso deja el stock en un valor negativo, el sistema lo muestra igual (no hay
  forma de que el mundo real sea negativo, pero el sistema no debe romperse ni bloquear la
  anulación) (ver FR-031).
- Si se edita el precio o la cantidad de una venta ya cobrada, el saldo entre socios y el stock se
  recalculan con el valor corregido, no con la suma del valor viejo más el nuevo (ver FR-032).
- Si una compra queda con pagos que no suman el costo total declarado, el sistema avisa antes de
  guardar (ver FR-033).
- Si no hay ningún movimiento cargado todavía, el panel principal muestra todo en cero, sin
  errores (ver FR-034).
- Si un socio intenta acceder sin ser uno de los dos socios autorizados, el sistema se lo impide
  por completo, sin mostrarle ninguna información aunque sea de solo lectura (ver FR-001).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE restringir el acceso a todas sus funciones exclusivamente a los dos
  socios autorizados, cada uno con su propia cuenta; ningún otro usuario, autenticado o no, puede
  ver ni modificar información.
- **FR-002**: El sistema DEBE permitir registrar una venta directa de un perfume indicando
  producto, cantidad, precio, quién la realizó, método de cobro y si ya fue cobrada o está
  pendiente.
- **FR-003**: El sistema NO DEBE afectar el stock ni el saldo entre socios mientras una venta de
  perfume esté pendiente de cobro.
- **FR-004**: El sistema DEBE, al marcar una venta de perfume como cobrada, descontar el stock
  vendido y repartir el importe 50/50 entre ambos socios según el método de cobro usado.
- **FR-005**: El sistema DEBE mostrar el precio de catálogo del perfume como valor inicial al
  cargar una venta, permitiendo modificarlo para reflejar el precio real de la operación.
- **FR-006**: El sistema DEBE advertir cuando se intenta registrar una venta cobrada por una
  cantidad mayor a la disponible en stock, antes de guardar.
- **FR-007**: El sistema DEBE permitir registrar una venta de decant indicando perfume, tamaño en
  texto libre, cantidad, precio, quién la realizó y método de cobro.
- **FR-008**: El sistema DEBE repartir el importe de toda venta de decant 50/50 entre ambos socios
  de forma inmediata al registrarla, sin estado pendiente.
- **FR-009**: El sistema NO DEBE modificar el stock de perfumes al registrar una venta de decant.
- **FR-010**: El sistema DEBE permitir registrar una compra a proveedores indicando proveedor,
  producto, cantidad, costo total y cómo se dividió el pago entre los socios (monto y método por
  cada uno).
- **FR-011**: El sistema DEBE aumentar el stock del producto comprado en la cantidad registrada al
  guardar una compra.
- **FR-012**: El sistema DEBE calcular el desbalance entre socios generado por una compra según la
  diferencia entre lo que efectivamente pagó cada socio y la mitad del costo total.
- **FR-013**: El sistema DEBE advertir si los montos de pago declarados por los socios en una
  compra no suman el costo total, antes de guardar.
- **FR-014**: El sistema DEBE actualizar el costo de referencia de un producto con el costo de su
  compra más reciente, para valorizar el stock.
- **FR-015**: El sistema DEBE permitir registrar un gasto del negocio indicando categoría, importe,
  quién lo pagó y método de pago, eligiendo la categoría de una lista predefinida.
- **FR-016**: El sistema DEBE repartir todo gasto 50/50 entre ambos socios.
- **FR-017**: El sistema DEBE permitir a un socio registrar un aporte o retiro personal de dinero,
  indicando monto y método, sin que esto genere deuda con el otro socio.
- **FR-018**: El sistema DEBE permitir registrar una transferencia de dinero entre socios como
  constancia contable, dejando explícito que no mueve dinero real, y ajustar el saldo neto entre
  ambos en consecuencia.
- **FR-019**: El sistema DEBE mostrar en un panel principal, sin requerir cálculos manuales: el
  total en efectivo, en Mercado Pago y general de cada socio; un único saldo neto entre ambos
  socios; la cantidad y el valor total de stock, con detalle por producto; y los movimientos más
  recientes.
- **FR-020**: El sistema DEBE mostrar el saldo entre socios siempre como un único número neto
  (indicando quién le debe a quién, o que están equilibrados), nunca como una lista de deudas
  separadas por movimiento.
- **FR-021**: El sistema DEBE permitir editar cualquier movimiento (venta, venta de decant, compra,
  gasto, movimiento personal, transferencia) ya cargado.
- **FR-022**: El sistema DEBE, al editar un movimiento, recalcular todos los totales que dependen
  de él (saldo entre socios, totales por socio, stock, valor de stock) reflejando únicamente el
  valor corregido, sin que el valor anterior quede sumado ni reste dos veces.
- **FR-023**: El sistema DEBE permitir anular cualquier movimiento en lugar de eliminarlo
  físicamente.
- **FR-024**: El sistema DEBE excluir los movimientos anulados de todos los cálculos (saldo, stock,
  totales) mientras los mantiene visibles en el historial.
- **FR-025**: El sistema DEBE registrar, para toda edición o anulación de un movimiento, el valor
  anterior, el valor nuevo, quién hizo el cambio y cuándo, de forma consultable en un historial.
- **FR-026**: El sistema DEBE permitir filtrar el historial de movimientos por tipo de movimiento,
  por socio y por rango de fechas.
- **FR-027**: El sistema DEBE mostrar un ranking de los perfumes más vendidos por cantidad.
- **FR-028**: El sistema DEBE mostrar, para un perfume dado, qué tamaños de decant se vendieron más.
- **FR-029**: El sistema DEBE mostrar la evolución de las ventas (volumen o ingreso) a lo largo del
  tiempo y el ingreso total acumulado.
- **FR-030**: El sistema DEBE, al anular una venta de perfume que ya había descontado stock,
  devolver esa cantidad al stock del producto.
- **FR-031**: El sistema DEBE, al anular una compra que ya había aumentado stock, descontar esa
  cantidad del stock del producto, incluso si el resultado queda en un valor negativo, sin que la
  anulación falle por eso.
- **FR-032**: El sistema DEBE recalcular el saldo entre socios y el stock a partir del historial
  completo de movimientos vigentes (no anulados) cada vez que se muestran, de forma que una edición
  a un movimiento pasado nunca deje un desvío acumulado respecto al valor correcto.
- **FR-033**: El sistema DEBE mostrar la actividad de carga de movimientos por socio de forma
  puramente informativa, sin presentarla como una comparación o ranking entre ellos.
- **FR-034**: El sistema DEBE mostrar el panel principal con todos los totales en cero cuando no
  existe ningún movimiento cargado, sin mostrar errores.

### Key Entities

- **Socio**: Cada uno de los dos usuarios autorizados a operar el sistema. Tiene nombre y una
  cuenta propia.
- **Venta de perfume**: Venta directa de un perfume completo, con producto, cantidad, precio,
  socio que la realizó, método de cobro y estado (pendiente o cobrada).
- **Venta de decant**: Venta de una fracción de un perfume, con producto, tamaño (texto libre),
  cantidad, precio, socio que la realizó y método de cobro. Siempre inmediata, nunca pendiente.
- **Compra**: Adquisición de stock a un proveedor, con producto, cantidad, costo total y el
  detalle de cuánto pagó cada socio y con qué método.
- **Gasto**: Egreso del negocio con categoría, importe, socio que lo pagó y método de pago.
- **Movimiento personal**: Aporte o retiro de dinero propio de un socio, que no afecta la deuda
  con el otro.
- **Transferencia entre socios**: Constancia contable de un pago ya realizado entre socios por
  fuera del sistema.
- **Movimiento**: Término general para cualquiera de los seis tipos anteriores; todos comparten el
  comportamiento de poder editarse o anularse sin borrado físico.
- **Registro de historial**: Constancia de cada creación, edición o anulación de un movimiento,
  con el valor anterior, el valor nuevo, quién y cuándo.
- **Producto**: Perfume del catálogo existente de la tienda, ahora también con stock y costo de
  referencia asociados dentro de este sistema.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un socio puede registrar cualquier tipo de movimiento (venta, compra, gasto,
  movimiento personal o transferencia) en menos de 1 minuto.
- **SC-002**: El panel principal muestra el saldo neto entre socios y el stock valorizado
  actualizados, sin necesidad de recargar manualmente ni de esperar más de unos segundos después
  de cargar un movimiento.
- **SC-003**: El 100% de los movimientos anulados o editados quedan visibles en el historial con su
  valor anterior y nuevo, sin excepción.
- **SC-004**: Después de editar o anular cualquier movimiento pasado, el saldo entre socios y el
  stock recalculados coinciden exactamente con la suma manual de los movimientos vigentes — 0% de
  desvío acumulado.
- **SC-005**: Un socio puede encontrar el detalle de cualquier movimiento pasado usando los filtros
  del historial en menos de 1 minuto.
- **SC-006**: El 100% de los intentos de acceso al sistema por parte de alguien que no sea uno de
  los dos socios autorizados son bloqueados.

## Assumptions

- Los dos socios (Luciano y Benja) son los únicos usuarios de este sistema; no hay roles
  intermedios ni usuarios de solo lectura.
- El catálogo de perfumes ya existente en la tienda es la fuente de nombres/productos disponibles
  para vender o comprar; este sistema no gestiona el alta de nuevos perfumes (eso ya lo cubre la
  administración de catálogo existente).
- El costo de referencia de un producto para valorizar stock es siempre el de su compra más
  reciente (no se calcula un costo promedio ponderado).
- Las transferencias entre socios son solo un registro contable; el dinero ya se movió por fuera
  del sistema (efectivo en mano, transferencia bancaria, etc.).
- Los métodos de cobro/pago manejados por el sistema son efectivo y Mercado Pago.
- No hay límite de tiempo para editar o anular un movimiento pasado.
- El idioma de toda la experiencia es español, consistente con el resto del panel administrativo
  existente.
