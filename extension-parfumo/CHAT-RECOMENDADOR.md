# Usar Parfumo+ con tu chat recomendador (desde el celu)

El chat de claude.ai no puede usar la extensión ni abrir Parfumo (Cloudflare lo bloquea). Lo que sí
puede hacer es razonar con **una tabla de tus perfumes** y aplicar los mismos criterios de los filtros.

## 1. Sacar la tabla (en la compu)

1. Abrí tu colección en Parfumo y tocá **"Filtrar mi colección con Parfumo+ →"** (te lleva a la búsqueda de tu colección).
2. En el panel de Parfumo+ tocá **"Copiar datos para el chat"**. Trae aroma, duración, estela, botella y precio/valor
   de cada perfume visible (si aplicaste filtros, copia solo los que pasan).
3. Pegala en el chat. Para que quede guardada, ponela en los **archivos del proyecto** (o en las instrucciones del
   proyecto) y repetí el paso cuando sumes perfumes.

## 2. Criterios para el chat (pegalos en las instrucciones)

```
Tengo una tabla con mis perfumes (valoraciones de 0 a 10; entre paréntesis, los votos). Cuando te pida qué
perfume usar según la ocasión, clima u hora, recomendá solo de esa tabla y explicá por qué.

Cómo decidir:
- El aroma ya me gusta: no uses la valoración de aroma para elegir entre mis perfumes.
- Duración: es lo principal. Para un día entero o una salida larga, preferí duración alta (7 o más).
- Estela según el lugar: oficina, lugares cerrados o calor → estela moderada (6 a 7,5). Noche, salida o frío/aire
  libre → estela alta (8 o más).
- Precio/valor: úsalo para desempatar o cuando pregunte cuál conviene gastar.
- Botella no importa para decidir.
- Confiá en un dato solo si tiene votos suficientes (unos 100). Si tiene pocos, avisalo.
- Duración y estela son opiniones de la comunidad: varían con el clima, la piel y el lote.
- Decime también cuántas rociadas conviene según duración y estela (menos rociadas si la estela es alta;
  más si la duración es corta).
- Si falta un dato ("-"), decilo en vez de inventarlo.
```
