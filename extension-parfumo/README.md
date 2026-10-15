# Parfumo+ — filtros

Extensión de navegador (Chrome/Edge/Brave, Manifest V3) que agrega un panel de filtros
a los listados de [parfumo.com](https://www.parfumo.com).

## Qué hace

- **No cambia el orden**: por defecto se mantiene el orden de Parfumo y solo se ocultan los que no cumplen los filtros.
- **Valoración y votos** son filtros con mínimo y máximo (por ejemplo, votos mín. 100 y valoración mín. 7.5).
- **Año** desde/hasta y **nombre o casa** (debe incluir / excluir, una o varias palabras separadas por coma).
- Se puede elegir ordenar por valoración, votos o año, y volver al orden original de Parfumo.
- **Avanzado, opcional**: puntaje estadístico (media bayesiana con cota de confianza) como orden o como mínimo. Solo muestra la insignia Σ si lo elegís.
- Los ajustes se guardan y se reaplican al cargar más resultados.

## Instalar (modo desarrollador)

1. `chrome://extensions` → activar **Modo desarrollador**.
2. **Cargar descomprimida** → elegir esta carpeta `extension-parfumo/`.
3. Abrir un listado de Parfumo (por ejemplo `/Perfumes`).

## Limitaciones

- Las tarjetas se detectan por los enlaces `/Perfumes/<Casa>/<Nombre>` y la valoración/votos/año
  se leen del texto de cada tarjeta, que en Parfumo es `Nombre (año) valoración votos`. Se probó
  el parser con 120 tarjetas reales (grilla y lista). Si Parfumo cambia el HTML, ajustar
  `findCards()` y `parseCardText()` (`lib/stats.js`).
- Solo ordena y filtra lo que ya está cargado en la página, no la búsqueda completa del servidor.
  La grilla trae 20 perfumes por página y la **vista de lista (`v=list`) trae 100**: conviene usar esa.
- Las tarjetas de Parfumo no muestran notas ni acordes, solo nombre, año, género, valoración y votos.
  "Debe incluir / excluir" sirve para el nombre del perfume, no para las notas.

## Pruebas

`npm run test:bot` incluye `tools/test/parfumo-stats.test.mjs` (parseo, puntaje, filtros, orden).
