# Feature Specification: Catálogo, Carrito, Checkout por WhatsApp y Administración

**Feature Branch**: `001-catalogo-carrito-admin`

**Created**: 2026-07-07

**Status**: Draft

**Input**: User description: "Generá el spec.md completo con todas las historias de usuario del sistema: cliente navegando el catálogo, armando el carrito, haciendo checkout por WhatsApp, y el admin gestionando perfumes/pedidos/promociones/config. Prohibido hablar de tecnología en este paso. Solo historias de usuario y criterios de aceptación."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navegar el catálogo de perfumes (Priority: P1)

Un cliente visita la tienda para descubrir perfumes disponibles. Puede ver la lista completa,
filtrar por género, familia olfativa o marca, y buscar por texto para encontrar rápidamente lo
que le interesa. Al abrir un perfume, ve su información completa (notas olfativas, descripción,
volumen, ambos precios disponibles) para decidir si comprarlo.

**Why this priority**: Sin la posibilidad de descubrir y evaluar productos no hay compra posible.
Es la puerta de entrada de todo el negocio y el mínimo indispensable para generar valor.

**Independent Test**: Puede probarse por completo entregando un catálogo de perfumes cargado y
verificando que un visitante anónimo pueda listar, filtrar, buscar y ver el detalle de cualquier
perfume, sin necesidad de que existan carrito ni checkout implementados.

**Acceptance Scenarios**:

1. **Given** existen perfumes disponibles cargados en la tienda, **When** el cliente entra al
   catálogo, **Then** ve la lista de perfumes disponibles con nombre, marca e imagen.
2. **Given** el cliente está en el catálogo, **When** filtra por un género, familia olfativa o
   marca específicos, **Then** la lista muestra únicamente los perfumes que cumplen ese filtro.
3. **Given** el cliente está en el catálogo, **When** busca por texto (por ejemplo parte del
   nombre o la marca), **Then** ve solo los perfumes cuyo nombre o marca coinciden con la
   búsqueda.
4. **Given** el cliente abre el detalle de un perfume, **When** la página carga, **Then** ve sus
   notas olfativas, descripción, volumen y ambos precios (transferencia y efectivo).
5. **Given** un perfume fue marcado como no disponible por el administrador, **When** el cliente
   navega el catálogo, **Then** ese perfume no aparece en la lista pública.

---

### User Story 2 - Armar y modificar el carrito de compra (Priority: P1)

Un cliente que ya encontró perfumes de interés los agrega a un carrito, puede ver el resumen de
lo que lleva, ajustar cantidades, quitar productos y ver el total actualizado en pesos argentinos
en todo momento, antes de decidir cómo pagar.

**Why this priority**: Es el paso que convierte el interés del cliente en una intención de compra
concreta. Sin carrito no hay checkout posible; junto con la Historia 1 conforma el flujo mínimo de
descubrimiento + intención de compra.

**Independent Test**: Puede probarse agregando uno o más perfumes desde el catálogo, verificando
que el carrito refleje cantidades y totales correctos, y que sea posible modificarlo, sin
necesidad de completar un checkout real.

**Acceptance Scenarios**:

1. **Given** el cliente está viendo un perfume, **When** lo agrega al carrito, **Then** el carrito
   incrementa en uno la cantidad de ítems y el perfume aparece en el resumen del carrito.
2. **Given** el cliente agrega el mismo perfume dos veces, **When** revisa el carrito, **Then**
   ve una sola línea para ese perfume con cantidad dos, no dos líneas separadas.
3. **Given** el cliente tiene productos en el carrito, **When** aumenta o disminuye la cantidad de
   un producto, **Then** el subtotal del carrito se recalcula de inmediato.
4. **Given** el cliente tiene productos en el carrito, **When** quita un producto, **Then** ese
   producto desaparece del resumen y el total se actualiza.
5. **Given** el carrito está vacío, **When** el cliente entra a la pantalla de carrito, **Then**
   ve un mensaje indicando que no hay productos agregados y una invitación a ir al catálogo.

---

### User Story 3 - Confirmar el pedido y cerrarlo por WhatsApp (Priority: P1)

Un cliente con productos en el carrito elige cómo va a pagar (transferencia o efectivo), ve el
descuento aplicado si corresponde, confirma su pedido con su nombre y el sistema lo deriva a una
conversación de WhatsApp con el negocio para coordinar el pago y la entrega. El pedido queda
registrado para que el negocio lo pueda consultar después.

**Why this priority**: Es el momento en que el negocio efectivamente recibe una venta. Junto con
las Historias 1 y 2 conforma el circuito completo de compra del cliente y es, en conjunto, el
producto mínimo viable de la tienda.

**Independent Test**: Puede probarse completamente armando un carrito con productos, seleccionando
un método de pago, confirmando con un nombre de cliente y verificando que el pedido quede
registrado con el total correcto y que se inicie la conversación de WhatsApp con el resumen del
pedido.

**Acceptance Scenarios**:

1. **Given** el cliente tiene productos en el carrito, **When** elige "Efectivo" como método de
   pago, **Then** ve un descuento del 5% aplicado sobre el total y el nuevo total con descuento.
2. **Given** el cliente tiene productos en el carrito, **When** elige "Transferencia" como método
   de pago, **Then** ve el total sin descuento.
3. **Given** el cliente completó su nombre y eligió método de pago, **When** confirma el pedido,
   **Then** el pedido queda registrado con sus productos, cantidades, método de pago y total, y
   se abre una conversación de WhatsApp con el negocio mostrando el detalle del pedido.
4. **Given** el cliente confirmó el pedido, **When** vuelve a la tienda, **Then** el carrito
   aparece vacío, listo para un nuevo pedido.
5. **Given** el cliente intenta confirmar el pedido sin haber ingresado su nombre, **When**
   presiona confirmar, **Then** el sistema le indica que el nombre es obligatorio y no registra el
   pedido.
6. **Given** el cliente intenta confirmar el pedido con el carrito vacío, **When** intenta acceder
   a la confirmación, **Then** el sistema se lo impide y lo redirige a agregar productos primero.

---

### User Story 4 - Administrar el catálogo de perfumes (Priority: P2)

Un administrador autenticado gestiona el catálogo: da de alta nuevos perfumes con toda su
información, edita los existentes, y los oculta del catálogo público cuando dejan de estar
disponibles, sin necesidad de borrarlos definitivamente.

**Why this priority**: El negocio necesita poder mantener su oferta actualizada, pero esto ocurre
con menor frecuencia que la navegación y compra de los clientes; el catálogo puede arrancar con
datos cargados manualmente y esta historia habilita la operación sostenida en el tiempo.

**Independent Test**: Puede probarse iniciando sesión como administrador, dando de alta un
perfume nuevo, editando sus datos y ocultándolo del catálogo, verificando en cada paso que los
cambios se reflejen (o no, según corresponda) en la vista pública del catálogo.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado, **When** carga un nuevo perfume con todos sus datos
   obligatorios, **Then** el perfume queda creado y visible en el catálogo público si está
   marcado como disponible.
2. **Given** un perfume existente, **When** el administrador edita su precio, descripción o notas
   olfativas, **Then** los cambios se reflejan inmediatamente en el catálogo público.
3. **Given** un perfume existente, **When** el administrador lo marca como no disponible, **Then**
   deja de aparecer en el catálogo público pero sigue existiendo en el panel de administración.
4. **Given** un administrador intenta cargar un perfume sin completar un campo obligatorio (por
   ejemplo, nombre o precio), **When** intenta guardar, **Then** el sistema le impide guardar y le
   indica qué falta completar.
5. **Given** un usuario no autenticado como administrador, **When** intenta acceder a la gestión
   de perfumes, **Then** el sistema se lo impide y lo redirige a iniciar sesión.

---

### User Story 5 - Consultar y hacer seguimiento de los pedidos (Priority: P2)

Un administrador autenticado revisa los pedidos que los clientes fueron confirmando, para
coordinar la entrega y el cobro de cada uno con la información que el cliente ya envió.

**Why this priority**: Es el correlato administrativo de la Historia 3: una vez que el negocio
recibe pedidos, necesita poder consultarlos ordenadamente para operar, aunque no es indispensable
para que el cliente complete su compra.

**Independent Test**: Puede probarse generando pedidos desde el flujo de cliente y verificando que
un administrador autenticado pueda verlos listados con su información completa y acceder al
detalle de cada uno.

**Acceptance Scenarios**:

1. **Given** existen pedidos confirmados por clientes, **When** el administrador entra a la
   sección de pedidos, **Then** ve un listado con los pedidos más recientes primero.
2. **Given** el administrador está en el listado de pedidos, **When** abre uno en particular,
   **Then** ve el detalle completo: productos, cantidades, método de pago, descuento aplicado,
   total y nombre del cliente.
3. **Given** un usuario no autenticado como administrador, **When** intenta acceder a los
   pedidos, **Then** el sistema se lo impide y lo redirige a iniciar sesión.

---

### User Story 6 - Administrar promociones destacadas (Priority: P3)

Un administrador autenticado publica y organiza promociones o banners destacados que se muestran
a los clientes en la portada de la tienda, para dar visibilidad a productos o campañas
puntuales.

**Why this priority**: Aporta valor comercial adicional (mayor visibilidad de ciertos productos)
pero la tienda es completamente funcional sin promociones activas; es una mejora incremental
sobre el flujo principal de compra.

**Independent Test**: Puede probarse creando una promoción como administrador y verificando que
aparezca (u oculte, si se desactiva) en la portada pública en el orden configurado.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado, **When** crea una promoción con título, descripción e
   imagen y la marca como activa, **Then** la promoción aparece visible en la portada pública.
2. **Given** existen varias promociones activas, **When** un cliente entra a la portada, **Then**
   las ve ordenadas según el orden definido por el administrador.
3. **Given** una promoción activa, **When** el administrador la marca como inactiva, **Then**
   deja de mostrarse en la portada pública inmediatamente.

---

### User Story 7 - Configurar datos generales del negocio (Priority: P3)

Un administrador autenticado ajusta datos generales que afectan a toda la tienda: el número de
contacto de WhatsApp al que llegan los pedidos, y un valor de referencia del dólar para usar como
respaldo si la cotización automática no está disponible.

**Why this priority**: Es una funcionalidad de mantenimiento de bajo uso frecuente; el negocio
puede operar con valores iniciales cargados y solo necesita ajustarlos ocasionalmente.

**Independent Test**: Puede probarse editando el número de contacto y el valor de referencia como
administrador, y verificando que un pedido nuevo del cliente use el número de contacto vigente,
y que los precios usen el valor de referencia cuando la cotización automática no esté disponible.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado, **When** actualiza el número de contacto de WhatsApp,
   **Then** los pedidos siguientes que los clientes confirmen se dirigen a ese número.
2. **Given** un administrador autenticado, **When** actualiza el valor de referencia del dólar,
   **Then** ese valor se usa para calcular precios en pesos cuando la cotización automática no
   está disponible.
3. **Given** un usuario no autenticado como administrador, **When** intenta acceder a la
   configuración general, **Then** el sistema se lo impide y lo redirige a iniciar sesión.

---

### Edge Cases

- Si un perfume que un cliente tiene en el carrito pasa a no estar disponible antes de que
  confirme el pedido, el sistema bloquea la confirmación, avisa al cliente y quita el producto
  automáticamente del carrito (ver FR-030).
- El carrito de un cliente persiste en el mismo dispositivo/navegador entre visitas, de modo que
  si vuelve otro día lo encuentra tal como lo dejó (ver FR-031).
- No existe un límite explícito de unidades por producto ni por pedido; el cliente puede pedir la
  cantidad que desee de cada perfume (ver FR-032).
- Si la cotización de referencia del dólar no pudo obtenerse y tampoco hay un valor de respaldo
  cargado por el administrador, el sistema muestra el mensaje "Precio no disponible — consultá por
  WhatsApp" con un acceso directo a WhatsApp, en lugar de un precio en pesos inválido o en cero,
  hasta que el administrador cargue un valor de respaldo (ver FR-029, FR-033).
- Si dos administradores editan el mismo perfume o la misma configuración al mismo tiempo,
  prevalece la última edición guardada (last-write-wins); no hay control de concurrencia en esta
  primera versión (ver FR-034).
- Si un cliente intenta abrir el detalle de un perfume que ya no existe o fue dado de baja, el
  sistema muestra una página de "Perfume no encontrado" con una acción para volver al catálogo, en
  lugar de una pantalla rota (ver FR-035).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE mostrar a cualquier visitante, sin necesidad de identificarse, el
  listado de perfumes marcados como disponibles.
- **FR-002**: El sistema DEBE permitir filtrar el listado de perfumes por género, familia olfativa
  y marca, de forma combinable.
- **FR-003**: El sistema DEBE permitir buscar perfumes por texto libre sobre nombre y marca.
- **FR-004**: El sistema DEBE mostrar, para cada perfume, su nombre, marca, género, familia
  olfativa, notas olfativas, descripción, volumen, imágenes y ambos precios (transferencia y
  efectivo) expresados en pesos argentinos.
- **FR-005**: El sistema DEBE excluir del listado y detalle público a los perfumes marcados como
  no disponibles o dados de baja.
- **FR-006**: El sistema DEBE permitir a un visitante agregar cualquier perfume disponible a un
  carrito de compra, indicando la cantidad deseada.
- **FR-007**: El sistema DEBE consolidar en una sola línea del carrito las unidades de un mismo
  perfume agregadas en distintos momentos.
- **FR-008**: El sistema DEBE permitir modificar la cantidad o quitar cualquier producto del
  carrito antes de confirmar el pedido.
- **FR-009**: El sistema DEBE mostrar en todo momento, mientras el carrito tiene productos, el
  subtotal actualizado en pesos argentinos.
- **FR-010**: El sistema DEBE permitir al cliente elegir, antes de confirmar el pedido, entre pago
  por transferencia o pago en efectivo.
- **FR-011**: El sistema DEBE aplicar un descuento del 5% sobre el total cuando el cliente elige
  pago en efectivo, y no aplicar descuento cuando elige transferencia.
- **FR-012**: El sistema DEBE exigir al cliente el ingreso de su nombre antes de permitir
  confirmar un pedido.
- **FR-013**: El sistema DEBE impedir confirmar un pedido si el carrito está vacío.
- **FR-014**: El sistema DEBE registrar cada pedido confirmado con sus productos, cantidades,
  método de pago, descuento aplicado, total y nombre del cliente, de forma que quede disponible
  para su consulta posterior.
- **FR-015**: El sistema DEBE, al confirmar un pedido, iniciar una conversación de WhatsApp con el
  negocio que incluya el detalle del pedido confirmado (productos, cantidades, método de pago y
  total).
- **FR-016**: El sistema DEBE vaciar el carrito del cliente una vez que su pedido fue confirmado
  exitosamente.
- **FR-017**: El sistema DEBE exigir que un usuario esté autenticado y reconocido como
  administrador para acceder a cualquier función de gestión (perfumes, pedidos, promociones,
  configuración).
- **FR-018**: El sistema DEBE redirigir a la pantalla de inicio de sesión a cualquier usuario no
  reconocido como administrador que intente acceder a una función de gestión.
- **FR-019**: El sistema DEBE permitir a un administrador dar de alta un perfume nuevo con todos
  sus datos (nombre, marca, género, familia olfativa, descripción, notas olfativas, precio,
  volumen, imágenes).
- **FR-020**: El sistema DEBE impedir guardar un perfume si falta algún dato obligatorio, e
  indicar al administrador qué falta completar.
- **FR-021**: El sistema DEBE permitir a un administrador editar cualquier dato de un perfume
  existente, reflejando los cambios de inmediato en el catálogo público.
- **FR-022**: El sistema DEBE permitir a un administrador marcar un perfume como no disponible sin
  eliminarlo, conservándolo visible únicamente en el panel de administración.
- **FR-023**: El sistema DEBE permitir a un administrador consultar el listado de pedidos
  confirmados, ordenados del más reciente al más antiguo.
- **FR-024**: El sistema DEBE permitir a un administrador ver el detalle completo de cualquier
  pedido confirmado.
- **FR-025**: El sistema DEBE permitir a un administrador crear una promoción con título,
  descripción, imagen y estado (activa o inactiva).
- **FR-026**: El sistema DEBE mostrar en la portada pública únicamente las promociones marcadas
  como activas, en el orden definido por el administrador.
- **FR-027**: El sistema DEBE permitir a un administrador definir y actualizar el número de
  contacto de WhatsApp que recibe los pedidos de los clientes.
- **FR-028**: El sistema DEBE permitir a un administrador definir y actualizar un valor de
  referencia del dólar utilizable cuando la cotización automática no esté disponible.
- **FR-029**: El sistema DEBE calcular y mostrar ambos precios (transferencia y efectivo) en pesos
  argentinos cuando exista una cotización de referencia del dólar vigente (automática o de
  respaldo). Si no hay ninguna cotización disponible, el sistema DEBE mostrar el mensaje "Precio no
  disponible — consultá por WhatsApp" con un acceso directo a WhatsApp, en lugar de un precio en
  pesos inválido o en cero.
- **FR-030**: El sistema DEBE, si un perfume presente en el carrito de un cliente pasa a estar no
  disponible antes de confirmar el pedido, impedir la confirmación, avisar al cliente y quitar
  automáticamente ese producto del carrito.
- **FR-031**: El sistema DEBE conservar el contenido del carrito de un cliente en su mismo
  dispositivo/navegador entre visitas, hasta que confirme el pedido o lo vacíe manualmente.
- **FR-032**: El sistema NO DEBE imponer un límite de unidades por producto ni por pedido; el
  cliente puede solicitar la cantidad que desee de cada perfume.
- **FR-033**: El sistema DEBE evitar mostrar un precio inválido o en cero. Cuando no haya
  cotización de referencia del dólar disponible (ni automática ni de respaldo), el precio se
  reemplaza por el mensaje "Precio no disponible — consultá por WhatsApp" con un acceso directo a
  WhatsApp (ver FR-029).
- **FR-034**: El sistema DEBE resolver ediciones simultáneas de un mismo perfume o de la
  configuración general aplicando la última edición guardada (last-write-wins), sin requerir
  control de concurrencia adicional en esta primera versión.
- **FR-035**: El sistema DEBE mostrar una página de "Perfume no encontrado" con una acción para
  volver al catálogo cuando un cliente intente abrir el detalle de un perfume inexistente o dado de
  baja, en lugar de un error sin manejar.

### Key Entities

- **Perfume**: Producto en venta. Representa nombre, marca, género, familia olfativa,
  descripción, notas olfativas, precio base, volumen, imágenes, y si está destacado y disponible
  para la venta.
- **Carrito**: Colección temporal de perfumes elegidos por un cliente antes de confirmar un
  pedido, con la cantidad de cada uno y el método de pago elegido.
- **Pedido**: Registro de una compra confirmada por un cliente. Incluye los productos con sus
  cantidades y precios al momento de confirmar, el método de pago, el descuento aplicado, el
  total, y el nombre del cliente.
- **Promoción**: Contenido destacado que el negocio publica en la portada para dar visibilidad a
  productos o campañas, con título, descripción, imagen, estado (activa/inactiva) y orden de
  aparición.
- **Configuración general**: Datos únicos de todo el negocio, como el número de contacto de
  WhatsApp y el valor de referencia del dólar de respaldo.
- **Administrador**: Persona autorizada a gestionar perfumes, pedidos, promociones y
  configuración general, distinta de un cliente anónimo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un cliente nuevo puede encontrar un perfume específico dentro del catálogo (por
  filtro o búsqueda) en menos de 30 segundos.
- **SC-002**: Un cliente puede completar todo el recorrido desde agregar productos al carrito
  hasta confirmar el pedido en menos de 3 minutos.
- **SC-003**: El 100% de los pedidos confirmados por clientes quedan registrados y disponibles
  para consulta administrativa, sin pérdida de información.
- **SC-004**: El 100% de los precios mostrados al cliente reflejan ambos métodos de pago
  (transferencia y efectivo) de forma simultánea y consistente entre sí.
- **SC-005**: Un administrador puede publicar un perfume nuevo, desde que decide cargarlo hasta
  que queda visible en el catálogo público, en menos de 5 minutos.
- **SC-006**: El 100% de los intentos de acceso a funciones de gestión por parte de usuarios no
  administradores son bloqueados y redirigidos a inicio de sesión.
- **SC-007**: Un administrador puede ubicar el detalle de cualquier pedido confirmado reciente en
  menos de 1 minuto desde que entra al listado de pedidos.

## Assumptions

- El catálogo, el carrito y el checkout son de acceso público; no se requiere que un cliente se
  registre ni inicie sesión para comprar.
- Cada pedido queda identificado únicamente con el nombre que el cliente ingresa al confirmar; no
  se solicitan otros datos de contacto adicionales dentro del sistema, ya que la coordinación
  posterior ocurre por WhatsApp.
- Los administradores son cuentas de confianza dadas de alta fuera del flujo normal de la tienda
  (no existe un alta de administradores autoservicio dentro de este alcance).
- Las promociones son contenido informativo/visual y no modifican por sí mismas el precio de los
  productos asociados.
- Existe siempre un único conjunto de configuración general para todo el negocio (no hay
  configuraciones por sucursal, región o vendedor).
- El idioma de toda la experiencia, tanto para clientes como administradores, es español.
