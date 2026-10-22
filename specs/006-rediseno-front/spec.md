# Spec 006 — Rediseño del front (marca premium, producto protagonista, legible por IA, accesible)

Estado: **APROBADA POR EL USUARIO Y EN CONSTRUCCIÓN** (22/10/2026). Las maquetas (portada final, header, cards, logo) fueron aprobadas; se construye en la rama `rediseno-front` y cada entrega pasa por vista previa. A producción solo se sube con el OK del usuario.
Rama: `rediseno-front` (desde `main`). Retorno exacto al estado previo a todo el rediseño: etiqueta `antes-del-rediseno` (`79c16e6`).

## 1. Historia (por qué se rehace)
- Oct-2026: se publicaron dos etapas de rediseño (`e4e3bd4`, `19390e4`) y se **revirtieron por completo** a pedido del usuario ("lo vamos a hacer bien"). Se había implementado sin consultar lo suficiente.
- Material reutilizable en la rama local `ajustes-logo-home`: contenido para agentes de IA (`tools/lib/contenido-agentes.mjs`, llms.txt, catalogo.json, JSON-LD, robots), pruebas de accesibilidad con axe-core, filtros del catálogo por link, generadores de íconos/flyers.
- Regla de trabajo de esta feature: **primero entrevista, después maquetas, después código.** El usuario pidió explícitamente ser cuestionado.

## 2. Decisiones tomadas (registro de la entrevista)

| # | Tema | Decisión del usuario | Ronda |
|---|---|---|---|
| D1 | Objetivo principal | **Marca premium** y **ser encontrado (Google e IA)**. Vender más pedidos NO es el objetivo #1. | 1 |
| D2 | Cliente | Quien **regala** y el **entusiasta/coleccionista**. | 1 |
| D3 | Referencias | Perfumería nicho (Maison Francis Kurkdjian, Xerjoff, Amouage) **y** tiendas árabes (Ounass, Lattafa oficial, Arabian Oud). | 1 |
| D4 | Proceso | **Maquetas primero**, sin tocar el sitio real. | 1 |
| D5 | Estilo | **No definido**: se muestran 3 direcciones en maqueta y el usuario elige mirando. | 2 |
| D6 | Primera pantalla | **Dos puertas iguales** (regalar / explorar); es el protagonista del home. | 2, 5 |
| D7 | Fotos | Se dejan como están; **se cambia el fondo**: escenario oscuro con luz violeta. | 2, 3 |
| D8 | "Inspirado en" | Se **mantiene visible** (ficha y asistente). | 2 |
| D9 | Header | Más alto y diferenciado del fondo, con información útil. Todo cabe en **dos niveles**: franja de anuncio + buscador, categorías, carrito con importe, favoritos y asistente. **El buscador es el único elemento con color lleno.** | 3, 4, 5 |
| D10 | Logo | **Sello «lacre» de borde fino** con la F con estela, **nombre FRAGANZIA en negrita normal** (texto real). | 3, 4, 7 |
| D11 | Clics | **Secundarios**: primero marca y visibilidad. El panel de pedido de 3 clics se deja para una etapa posterior. | 3 |
| D12 | Fotos | **TODAS las cards con fondo oscuro** (no mixto). Recorte híbrido (modelo + color + casco convexo); si alguna no queda bien se busca otra foto en tiendas y bases de perfumes, con aprobación del usuario. La "ventana clara" solo es respaldo para fotos nuevas sin procesar. | 4, 5, 7 |
| D13 | Portada | **Portada A «Lujo silencioso»**. Titular **«Encontrá el perfume que te define»**. Dos puertas (protagonista) · Más elegidos · Decants · Novedades · La marca (quiénes somos y cómo comprar). "Regalar" abre el asistente actual. | 4, 5, 7 |
| D14 | Éxito | Que **se vea premium** (criterio del usuario), **aparecer en Google**, que **asistentes de IA nos citen** con datos correctos, y que **los pedidos no bajen**. | 5 |
| D15 | Accesibilidad | Cumplir **WCAG 2.2 AA** y sumar un **panel de preferencias** del usuario. | previa |
| D16 | Tipografía | **Sin serifa** (Outfit + Manrope). Requiere enmienda a la sección 4 de la constitución (hoy dice serifa): **pendiente de aprobación explícita**. | previa |
| D17 | Paleta | Se **mantiene el violeta** de la marca. | previa |
| D18 | Dispositivo | **Mobile-first**: casi todos los clientes llegan desde el celular. | 6 |
| D19 | Constitución | **Enmienda aprobada** a la sección 4 (tipografía sin serifa, logo, fondo `#06040D`); se aplica al cerrar esta feature. | 6 |

## 3. Evidencia técnica recogida (no es opinión)
- **Recorte automático de fondo** (`@imgly/background-removal-node`, modelo medio, ~11 s por foto, una sola vez): en una muestra de 8 fotos reales, **5 quedan limpias** (Yara Moi, Nitro Green, Fatima Velvet, Eclaire, Freeze in Flames) y **3 fallan** (Donna Intense, Khamrah de vidrio, Atlas con caja celeste): el modelo no reconoce partes claras sobre fondo blanco.
- Un **control de calidad** (cobertura del producto = píxeles del recorte que coinciden con lo que se aparta del blanco en la foto original) separó perfecto la muestra: buenas ≥ 0,99; malas ≤ 0,79. Muestra chica: hay que validarlo con más fotos antes de confiar.
- Estimación de procesar el catálogo (~407 fotos): ~1 h 15 min de cómputo, tarea de una sola vez y luego solo para fotos nuevas.
- Hoy el HTML estático de una ficha **no trae título, descripción ni notas** (solo un bloque técnico): un agente sin JavaScript no puede leerla.
- Auditoría de accesibilidad inicial (axe-core): 0 críticas/graves; 2 moderadas de estructura (ya resueltas en la rama anterior).

## 4. Requisitos

### 4.1 Marca y logo
- R1. Logo: sello (disco relleno con F con estela, borde festoneado tipo lacre) + nombre en Outfit en negrita. Versiones horizontal, vertical y símbolo solo; SVG; documentadas en `DESIGN_SYSTEM.md`.
- R2. El nombre debe existir como **texto real** (legible por lectores de pantalla y agentes), aunque se estilice.
- R3. Íconos (favicon, app, imagen para redes) y flyers se regeneran desde la misma fuente.

### 4.2 Header (dos niveles)
- R4. Franja fina de anuncio (promo vigente o envíos AMBA) + header alto con logo grande, **buscador destacado**, categorías (Para él · Para ella · Unisex · Decants), carrito con importe, favoritos y el asistente "Encontrá tu perfume" en un tratamiento secundario.
- R5. Se distingue del fondo (color, filete o sombra). En celular no supera 64 px y mantiene buscador accesible.

### 4.3 Card de producto ("vitrina")
- R6. Foto grande sobre **escenario oscuro con luz violeta** cuando el recorte pasa el control de calidad; si no, sobre fondo **claro redondeado tipo ventana**. Ambos casos deben verse intencionales.
- R7. Muestra marca, nombre, familia/género y notas reales (si no hay, no se inventan), y los **dos precios siempre visibles** (nota crítica 4 de la constitución), con Transferencia como principal.
- R8. Rendimiento: sin `backdrop-filter` en listas largas; imágenes responsivas; las recortadas en WebP con transparencia.

### 4.4 Portada
- R9. Orden y jerarquía: **dos puertas** (protagonista) → más elegidos y novedades → decants → marca (quiénes somos y cómo comprar).
- R10. **Sin redundancia:** cada mensaje de confianza (originales, envíos, pago, seguimiento) aparece una sola vez por pantalla; una sola acción principal por pantalla.
- R11. "Regalar" y "Explorar" tienen el mismo peso visual; "Regalar" abre el asistente; "Explorar" lleva a aroma/notas/marca en el catálogo.

### 4.5 Legibilidad por agentes de IA
- R12. HTML estático completo de cada ficha (h1, descripción, notas, ambos precios, disponibilidad); JSON-LD (Organization, WebSite+SearchAction, ItemList, Product con dos Offer, BreadcrumbList); `/llms.txt`, `/llms-full.txt`, `/catalogo.json`; `robots.txt` que da la bienvenida a rastreadores de IA y mantiene fuera lo privado; semántica HTML correcta y canónicas.
- R13. Prueba automática que baja el HTML **sin ejecutar JavaScript** y valida lo anterior.

### 4.6 Accesibilidad
- R14. Cumplimiento WCAG 2.2 AA (teclado, foco visible, lectores de pantalla, contraste, reflujo/zoom, movimiento, formularios, alt de imágenes), con auditoría axe-core en pruebas.
- R15. **Panel de preferencias** (tamaño de texto, alto contraste, reducir movimiento, subrayar enlaces, tipografía de lectura fácil) guardado en el navegador y accesible por teclado. No reemplaza R14.
- R16. Declaración de accesibilidad breve en Contacto.

### 4.5 Medición de éxito (D14)
- Criterio del usuario sobre la maqueta y la versión final.
- Google Search Console: posiciones y clics antes/después.
- Prueba periódica con asistentes de IA: ¿recomiendan Fraganzia con precios y datos correctos?
- Pedidos mensuales no inferiores al promedio previo (se toma la línea base de la colección `pedidos`).

## 5. Fuera de alcance (por ahora)
- Panel de pedido de 3 clics (D11): etapa posterior.
- "Más vendidos": las estadísticas no son públicas.
- Datos de negocio (envíos, horarios, opiniones de clientes): los aporta el usuario; no se inventan.

## 6. Preguntas todavía abiertas (las ya resueltas están en la tabla de decisiones)
1. ¿Desde qué dispositivo y canal llegan los clientes (celular, Instagram, Google)? Define cuánto pesa el celular en el diseño.
2. ¿Qué hace exactamente la puerta "Regalar"? (el asistente actual, o un flujo nuevo por destinatario y presupuesto).
3. Estilo visual final: nicho sobrio, oriental o mezcla (se resuelve con 3 maquetas).
4. Logo: variantes del borde del lacre y del nombre junto al sello (a pulir).
5. Dónde guardar las fotos recortadas (¿en el repositorio o generadas en el build?) y cómo correr el recorte (Node vs Python).
6. Enmienda de la constitución, sección 4 (tipografía sin serifa; logo; fondo real `#06040D`): aprobación explícita.
7. Textos reales: titular de portada, promesa de marca, datos de envío y horarios.

## 7. Riesgos
- Tarjetas oscuras con fallback claro pueden verse **desparejas** en una grilla: se resuelve en maqueta con datos reales antes de construir.
- El recorte automático sin revisión puede dejar bordes feos en casos no vistos: control de calidad + revisión manual de los destacados.
- Peso de imágenes y tiempo de build/deploy al duplicar fotos (original + recortada).
- Cambiar tipografía y card afecta catálogo, destacados, favoritos y ofertas: un solo componente reutilizable.
- Reversibilidad: cada fase en su commit y su vista previa; el retorno exacto previo a todo sigue siendo `antes-del-rediseno`.

## 8. Fases (cada una termina en vista previa y espera OK antes de `main`)
Estado al 22/10/2026: fase 0 y 1 (maquetas) **aprobadas**; fases 2 a 5 **en construcción** (logo, header, card, portada, pipeline de recorte de las 406 fotos, contenido para agentes de IA, pruebas); falta accesibilidad completa con panel de preferencias y la medición posterior.
0. **Entrevista y spec** (esta).
1. **Maquetas HTML estáticas** de: portada (3 estilos), header, card (oscura y ventana clara), logo P2 refinado. Sin tocar el sitio real.
2. **Cimientos:** tokens de diseño, tipografía, componentes base.
3. **Pipeline de recorte** y control de calidad (con revisión de destacados).
4. **Header, card y portada** reales.
5. **Legibilidad por IA y accesibilidad completa** (reutilizando lo hecho en `ajustes-logo-home`).
6. **Publicación** con medición (Search Console, prueba con IA, pedidos).

## 9. Criterio de aprobación de maquetas
El usuario ve cada maqueta en una URL de vista previa y responde: la apruebo / la corrijo / la descarto. Solo lo aprobado se implementa.
