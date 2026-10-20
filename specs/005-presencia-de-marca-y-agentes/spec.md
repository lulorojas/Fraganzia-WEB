# Spec 005 — Presencia de marca, producto protagonista y sitio legible por agentes de IA

Estado: **EN CURSO — decisiones D1–D4 tomadas por el usuario el 20/10/2026** (Principio I: spec → aprobación → código). Cada fase se muestra en vista previa y espera OK antes de `main`.
Rama de trabajo: `ajustes-logo-home` (sobre el rediseño ya publicado, `e4e3bd4`).
Punto de retorno exacto al estado previo a todo el rediseño: etiqueta `antes-del-rediseno` (`79c16e6`).

## 1. Problema (lo que pidió el usuario)

1. La página se ve "una más del montón": poca identidad y poco impacto.
2. El **header pesa poco**: no impone la marca ni orienta.
3. Las **cards de producto parecen de Mercado Libre**: caja plana, foto chica, dos precios a la misma altura que el nombre, botón genérico. El producto no se luce ni da ganas de comprarlo.
4. Falta un **buen logo** (el actual —frasco con F— no convence del todo).
5. Hay **demasiados clics** hasta el pedido.
6. Lo importante no se destaca y hay **información repetida**.
7. El sitio debe ser **totalmente legible por agentes de IA**.
8. El sitio debe ser **accesible para personas con discapacidad** (visual, auditiva, motriz y cognitiva).

## 2. Diagnóstico medido (antes de proponer)

| Hallazgo | Evidencia |
|---|---|
| El HTML estático de una **ficha** no trae `h1`, descripción, notas olfativas ni familia: solo el encabezado, el pie y un bloque JSON-LD `Product` mínimo. Un agente que no ejecuta JavaScript no puede "leer" el perfume. | `dist/perfume/<id>.html`: 313 caracteres de texto visible, sin `<h1>`, sin meta description. |
| El nombre de la marca en el logo nuevo se extrae como **"FR G NZI"** (las "A" son dibujos). Para texto plano y lectores, la marca queda ilegible. | HTML estático del encabezado. |
| Home: JSON-LD solo `Store`; no hay `Organization`, `WebSite` (buscador), `ItemList`, `BreadcrumbList` ni `FAQ`; ninguna `<article>` por producto. | `dist/index.html`. |
| No existe `llms.txt` ni una versión de texto/JSON del catálogo; `robots.txt` no nombra a los rastreadores de IA. | `public/`, `dist/`. |
| Camino de compra hoy: **Agregar → Ir al carrito → (nombre) → Confirmar → Enviar por WhatsApp = 4 clics + tipeo** desde una card. Desde la portada sin saber qué buscar: +2 a +3. | Recorrido probado en navegador. |
| Las cards muestran los dos precios (Transferencia/Efectivo) con el mismo peso que el nombre y un botón ancho "Agregar al carrito". | `PerfumeCard.jsx`. |

## 3. Objetivos medibles

- **O1 Identidad:** una persona que ve 3 segundos la portada puede describir la marca (negro + violeta + frasco/arco + tipografía propia). Revisión visual aprobada por el usuario.
- **O2 Producto protagonista:** en cada card, la foto ocupa ≥ 70 % del alto, hay al menos un elemento que evoca el aroma (notas/familia) y el precio ya no compite con el nombre.
- **O3 Clics:** de card a pedido enviado, **≤ 3 clics** (hoy 4) y **1 clic** de la portada a un listado filtrado (ya hecho con los atajos).
- **O4 Jerarquía sin repetición:** cada mensaje de confianza (originales, envíos, pago, seguimiento) aparece **una sola vez por pantalla**; cada pantalla tiene **una** acción principal destacada.
- **O5 Agentes:** con JavaScript desactivado, un agente obtiene de cada página: título, marca, descripción, familia, notas, precio (ambos métodos), disponibilidad, URL canónica, y la marca "Fraganzia" como texto real. Verificable con un test automático que baja el HTML estático y lo valida.

## 4. Decisiones de diseño (D1–D4 resueltas con la opción recomendada; D5 abierta)

**Resueltas:** D1 = dos niveles · D2 = vitrina · D3 = tres conceptos de logo para elegir · D4 = pedido en un panel.

**D5 (abierta) — Accesibilidad:** (a) *Cumplir WCAG 2.2 AA en todo el sitio* (obligatorio, no depende de un botón) **más** un panel "Accesibilidad" con preferencias guardadas (tamaño de texto, alto contraste, reducir movimiento, subrayar enlaces, tipografía de lectura fácil). (b) Solo cumplir WCAG 2.2 AA, sin panel. Recomendado: (a); el panel es un complemento, nunca un reemplazo de la conformidad.

### Opciones originales

**D1 — Header.** (a) *Dos niveles*: franja fina de anuncio (promo vigente / envíos AMBA) + header alto con logo grande, buscador visible y categorías (Para él · Para ella · Unisex · Decants · Ofertas), fondo con textura y filete violeta. (b) Header transparente sobre el héroe que se solidifica al scrollear. (c) Mantener y solo agrandar.

**D2 — Card de producto.** (a) *Vitrina*: la foto grande sobre un escenario oscuro con luz violeta (no recuadro blanco), marca en versalitas, nombre, 2–3 notas como "chips" de aroma, precio compacto en una línea (Transf. · Efectivo) y un botón **+** circular. (b) *Editorial*: foto a sangre con el texto superpuesto. (c) *Giro al pasar*: foto al frente y notas al dorso.

**D3 — Logo.** (a) Preparo **3 conceptos distintos** en una página de vista previa para que elijas. (b) Solo logotipo tipográfico trabajado. (c) Otra dirección que indique el usuario.

**D4 — Clics del pedido.** (a) *Pedido en un panel*: al tocar **+** se abre un panel con el resumen, el nombre (recordado) y "Confirmar y enviar por WhatsApp": **3 clics** y no se pierde el contexto. (b) Mantener la página de carrito y pulirla. (c) Botón "Pedir por WhatsApp" directo desde la ficha (salta el carrito; hay que seguir guardando el pedido antes de abrir WhatsApp, nota crítica 11).

## 5. Requisitos

### 5.1 Marca y logo
- R1. El logo se entrega como **SVG** propio + versión horizontal, vertical y símbolo solo, con zona de respeto y tamaño mínimo documentados en `DESIGN_SYSTEM.md`.
- R2. **El nombre debe existir como texto real** (visible para texto plano y lectores): se usa texto accesible oculto visualmente o glifos reales, no solo dibujos.
- R3. Favicon, ícono de app, imagen para redes y flyers se regeneran desde la misma fuente (`tools/generar-iconos.mjs`).

### 5.2 Header
- R4. Según D1. Peso visual alto, logo ≥ 40 px de alto en escritorio, un único botón de ayuda para elegir (no repetirlo en la página), carrito con importe, buscador sin abrir menú.
- R5. En celular, la barra queda fija y no ocupa más de 64 px.

### 5.3 Card de producto
- R6. Según D2. **Los dos precios siguen visibles** (nota crítica 4 de la constitución), pero el principal es Transferencia y el de Efectivo secundario.
- R7. Las notas/familia se muestran con datos reales del perfume; si un perfume no los tiene, la card no inventa nada (se muestran solo la familia y el género).
- R8. Se mantiene el carga rápida: sin `backdrop-filter` en listas largas y imágenes con tamaños responsivos.

### 5.4 Jerarquía y no redundancia
- R9. Cada pantalla define **una acción principal** (botón lleno, violeta) y las secundarias en contorno o enlace.
- R10. La portada se ordena: encabezado + vitrina → franja de confianza (única) → atajos → destacados → ayuda para elegir → novedades → marca. Cada bloque dice algo distinto.
- R11. Mensajes repetidos se eliminan o se consolidan (inventario en `tasks.md`).

### 5.5 Clics
- R12. Según D4. El nombre del cliente y el método de pago se recuerdan; el método por defecto es Transferencia.
- R13. "Comprar ahora" en la ficha (ya existe) queda como atajo.

### 5.7 Accesibilidad (WCAG 2.2 nivel AA)
- R21. **Auditoría automática sin violaciones** (axe-core, reglas WCAG 2.2 A/AA) en portada, catálogo, ficha, carrito, decants, contacto y nosotros, en celular y escritorio. Estado inicial medido: 0 críticas ni graves; 2 moderadas (orden de títulos y nombre repetido de una región), corregidas.
- R22. **Teclado:** todo se puede hacer sin mouse, con foco siempre visible (≥ 3:1) y orden lógico; los paneles (asistente, pedido, menú) atrapan el foco, se cierran con Escape y devuelven el foco al origen. Sin trampas de teclado.
- R23. **Lectores de pantalla:** un solo `<h1>` y títulos ordenados; puntos de referencia (`header`, `nav`, `main`, `footer`) con nombre único; botones e íconos con nombre accesible; el logo se lee "Fraganzia"; cambios dinámicos (producto agregado, error de formulario, filtros aplicados, resultados) anunciados con `aria-live`.
- R24. **Contraste y color:** texto ≥ 4,5:1 (grande ≥ 3:1) y componentes ≥ 3:1; la información nunca depende solo del color (precio con descuento, estados del pedido, filtros activos llevan texto o ícono).
- R25. **Tamaño y reflujo:** se puede ampliar el texto hasta 200 % y el zoom hasta 400 % sin perder contenido ni scroll horizontal; objetivos táctiles ≥ 44 × 44 px (mínimo WCAG 2.2: 24 × 24).
- R26. **Movimiento:** se respeta `prefers-reduced-motion` y no hay contenido que parpadee ni se mueva solo sin control; los carruseles se pueden recorrer con teclado y botones.
- R27. **Formularios:** etiquetas visibles asociadas, errores en texto junto al campo y resumidos con `role="alert"`, ayuda de autocompletado (`autocomplete`) y sin pedir datos innecesarios.
- R28. **Imágenes:** fotos de producto con `alt` descriptivo (nombre del perfume) en la ficha y en el carrito; decorativas con `alt=""`.
- R29. **Preferencias del sistema:** `prefers-contrast`, modo de colores forzados (`forced-colors`) y tamaño de fuente del navegador se respetan.
- R30. **Panel de accesibilidad** (si D5 = a): preferencias persistentes y no invasivas, accesibles por teclado y sin reemplazar lo anterior.
- R31. **Declaración de accesibilidad** breve (qué cumple, cómo reportar un problema por WhatsApp) en Contacto.
- R32. Pruebas: `npm run test:e2e` suma la auditoría axe (R21) y una prueba de teclado del flujo de compra.

### 5.6 Legibilidad por agentes de IA
- R14. **HTML estático completo** (pre-render) de cada ficha: `h1`, descripción, familia, género, volumen, notas (salida/corazón/fondo), precios en ambos métodos, disponibilidad y enlace a perfumes similares. Hoy faltan.
- R15. **Datos estructurados** (JSON-LD) coherentes con el contenido visible: `Organization`, `WebSite` con `SearchAction`, `ItemList` en el catálogo, `Product` con dos `Offer` (transferencia y efectivo) y `BreadcrumbList` en cada ficha.
- R16. **`/llms.txt`** con la descripción del sitio, cómo comprar y enlaces; **`/llms-full.txt`** con el catálogo en texto plano y **`/catalogo.json`** con los mismos datos estructurados, generados en cada build (**hecho en la fase 1**). Aclara que los precios en pesos dependen del dólar del día.
- R17. **`robots.txt`** permite explícitamente a los rastreadores de IA habituales (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, etc.) y mantiene fuera lo privado (`/admin`, `/carrito`, `/pedido/`).
- R18. Semántica: un `<h1>` por página, `<main>`, `<nav>`, un `<article>` por producto, `alt` descriptivo, enlaces con texto propio (no "ver más"), `lang="es-AR"`, canónicas y `sitemap.xml` con `lastmod`.
- R19. Los filtros por link (`?genero=`, `?marca=`) tienen canónica a `/catalogo` para no duplicar contenido.
- R20. Test `npm run test:e2e` suma una prueba que baja el HTML **sin ejecutar JavaScript** y verifica R2, R14, R15, R16.

## 6. Fuera de alcance
- Cuentas de usuario, pagos online, Cloud Functions u otros servicios de Firebase (Principio II y IV).
- Ranking "más vendidos": las estadísticas no son públicas; requeriría decidir cómo publicarlas.
- Cambiar los datos de negocio (precios, envíos, horarios): siguen siendo del usuario.

## 7. Enmiendas a la constitución que requiere esta spec (requieren aprobación explícita)
- **Sección 4 (Identidad visual):** la tipografía pasa de Playfair/Inter/Cormorant (serifa) a **solo sin serifa** (Outfit + Manrope), pedido expreso del usuario; se incorpora el logo nuevo; se actualiza el gradiente/fondo al valor real en uso (`#06040D`).
- **Notas críticas (nota 4):** se aclara que el precio Efectivo puede mostrarse en segundo plano visual, siempre visible.
- El resto de los principios (I–VI) no se toca.

## 8. Plan por fases (cada fase termina en vista previa y espera OK antes de `main`)
1. **Agentes y accesibilidad base (R14–R20, R21):** sin cambios visuales. *Hecho en rama:* contenido estático completo de cada ficha, JSON-LD, `llms.txt`, `llms-full.txt`, `catalogo.json`, `robots.txt` para rastreadores de IA, logo con texto real.
2. **Logo (D3):** página de conceptos → elección → implementación (R1–R3).
3. **Header (D1) y card (D2):** componentes y páginas que los usan.
4. **Panel de pedido (D4) y jerarquía/redundancia (R9–R12).**
5. **Accesibilidad completa (R22–R32):** teclado, anuncios, contraste, zoom, formularios, preferencias (según D5) y declaración.
6. Documentación (`DESIGN_SYSTEM.md`, constitución) y tests.

## 9. Riesgos
- Cambiar la card afecta catálogo, destacados, favoritos y ofertas: se hace un solo componente reutilizable.
- El pre-render crece (más texto por ficha): se mide el tamaño del build antes y después.
- Una card más "de lujo" no debe empeorar la velocidad en celular (se mide con las capturas y el e2e).
- Reversibilidad: cada fase en su propio commit; el retorno exacto previo a todo sigue siendo `antes-del-rediseno`.
