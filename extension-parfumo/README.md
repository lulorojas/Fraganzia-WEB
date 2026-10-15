# Parfumo+ — filtros estadísticos

Extensión de navegador (Chrome/Edge/Brave, Manifest V3) que agrega un panel de filtros
a los listados de [parfumo.com](https://www.parfumo.com) y cambia el criterio de orden.

## Qué cambia

- **Orden por defecto: puntaje estadístico**, no valoración ni cantidad de votos.
  Es la media bayesiana de la valoración (se encoge hacia la media del listado cuando hay
  pocos votos) menos `z · σ / √(votos + m)`. Un 9.5 con 3 votos queda debajo de un 8.4 con
  cientos, sin umbrales fijos. El deslizador "prudencia" (`z`) ajusta cuán conservador es.
- **Valoración y votos pasan a ser filtros opcionales**, al final del panel (mín/máx), vacíos por defecto.
  También se pueden elegir como orden si hace falta.
- **Filtros extra**: debe incluir / excluir texto (notas, casa, acordes, lo que muestre la tarjeta),
  año desde/hasta y puntaje estadístico mínimo. Cada tarjeta muestra su puntaje (Σ).
- Los ajustes se guardan y se reaplican al cargar más resultados.

## Instalar (modo desarrollador)

1. `chrome://extensions` → activar **Modo desarrollador**.
2. **Cargar descomprimida** → elegir esta carpeta `extension-parfumo/`.
3. Abrir un listado de Parfumo (por ejemplo `/Perfumes`).

## Limitaciones

- Parfumo no se pudo consultar al escribirla, así que las tarjetas se detectan por los enlaces
  `/Perfumes/<Casa>/<Nombre>` y la valoración/votos/año se leen del texto de cada tarjeta.
  Si Parfumo cambia el HTML, ajustar `findCards()` y `parseCardText()` (`lib/stats.js`).
- Solo ordena y filtra lo que ya está cargado en la página, no la búsqueda completa del servidor.

## Pruebas

`npm run test:bot` incluye `tools/test/parfumo-stats.test.mjs` (parseo, puntaje, filtros, orden).
