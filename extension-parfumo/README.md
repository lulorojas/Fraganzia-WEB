# Parfumo+ — filtros

Extensión de navegador (Chrome/Edge/Brave, Manifest V3) que agrega un panel de filtros
a los listados de [parfumo.com](https://www.parfumo.com).

## Qué hace

- **No cambia el orden**: por defecto se mantiene el orden de Parfumo y solo se ocultan los perfumes que no cumplen los filtros.
- **Filtra todo el resultado, no una página**: al abrir un listado trae las demás páginas (con `?current_page=N`), las junta en una sola lista y oculta el paginador cuando está completo. Tope por defecto: 30 páginas (3000 perfumes en vista de lista; hasta 1000 páginas si lo subís en el panel); se cambia en el panel, y "Cargar todas" trae el resto. Los filtros quedan guardados al cambiar de página.
- **Filtros que se combinan entre sí** (todos a la vez):
  - Aroma: valoración mín/máx y votos mín/máx.
  - **Duración, estela, botella y precio/valor**: valoración mín/máx y votos mínimos de cada una.
  - Año desde/hasta y nombre o casa (debe incluir / excluir).
- Se puede ordenar por valoración, votos, año, duración, estela, botella o precio/valor, y volver al orden original de Parfumo.
- **Avanzado, opcional**: puntaje estadístico (media bayesiana con cota de confianza) como orden o como mínimo. Solo muestra la insignia Σ si lo elegís.
- Los ajustes se guardan.

### Cómo se combinan duración y estela

Cada tarjeta de Parfumo muestra **una sola** valoración: la de la métrica por la que está ordenado el listado
(`o=d_desc` duración, `o=s_desc` estela, `o=b_desc` botella, `o=p_desc` precio/valor). Cuando usás un filtro
de otra métrica, la extensión pide ese mismo listado ordenado por ella (una vez por métrica y por página,
con una pausa entre pedidos) y une los datos por perfume. Los perfumes sin votos en esa métrica no pasan
ese filtro; el panel indica cuántos son.

## Instalar (modo desarrollador)

1. `chrome://extensions` → activar **Modo desarrollador**.
2. **Cargar descomprimida** → elegir esta carpeta `extension-parfumo/`.
3. Abrir un listado de Parfumo (por ejemplo `/Perfumes`).

## Limitaciones

- Las tarjetas se detectan por los enlaces `/Perfumes/<Casa>/<Nombre>` y la valoración/votos/año
  se leen del texto de cada tarjeta, que en Parfumo es `Nombre (año) valoración votos`. Se probó
  el parser con 120 tarjetas reales (grilla y lista). Si Parfumo cambia el HTML, ajustar
  `findCards()` y `parseCardText()` (`lib/stats.js`).
- Con resultados de más páginas que el tope (por ejemplo, toda una casa con 40 páginas), solo se filtran
  las páginas cargadas; subí el tope o usá "Cargar todas". En la grilla (20 por página) hay 5 veces más
  páginas que en la vista de lista (`v=list`, 100 por página): conviene usar la lista.
- Duración, estela, botella y precio/valor suman un pedido por métrica y página; un resultado grande con
  varios filtros de esas métricas tarda unos segundos. Hay un botón "Detener carga".
- Las tarjetas de Parfumo no muestran notas ni acordes, solo nombre, año, género, valoración y votos.
  "Debe incluir / excluir" sirve para el nombre del perfume, no para las notas.

## Pruebas

`npm run test:bot` incluye `tools/test/parfumo-stats.test.mjs` (parseo, puntaje, filtros combinados, orden, paginación).
