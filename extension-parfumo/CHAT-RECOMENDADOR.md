# Usar Parfumo+ con tu chat recomendador (desde el celu)

El chat de claude.ai no puede usar la extensión ni abrir Parfumo (Cloudflare lo bloquea). Lo que sí
puede hacer es razonar con **una tabla de tus perfumes**. Tu chat ya tiene sus criterios (aprovechamiento
según la ocasión, ADN, duración, proyección, costo de oportunidad, sprays, semáforos): **no se tocan**.
Lo que cambia es de dónde salen los datos de duración y estela: en vez de armar la tabla de Parfumo a
mano ("la tabla del 15/10"), la sacás con un botón y siempre está al día.

## 1. Sacar la tabla (en la compu)

1. Abrí tu colección en Parfumo y tocá **"Filtrar mi colección con Parfumo+ →"** (te lleva a la búsqueda de tu colección).
2. En el panel de Parfumo+ (arriba a la derecha) tocá **"Copiar datos para el chat"**. Trae aroma, duración,
   estela, botella y precio/valor de cada perfume, con los votos entre paréntesis. Si aplicaste filtros,
   copia solo los que pasan.
3. Pegala en el chat. Para que quede guardada, ponela como **archivo del proyecto** (o en las instrucciones)
   y repetí el paso cuando sumes o saques perfumes.

La tabla solo trae lo que Parfumo publica. Los perfumes que no están en tu colección de Parfumo
(Rumba, Millanel Millonarios, las réplicas, Hawas Ice si lo sacaste, etc.) no aparecen: el chat sigue
usando lo que le contaste vos.

## 2. Qué agregar a las instrucciones del chat (al final de "Reglas de datos")

```
Reglas de datos (actualización):
- La fuente de duración y estela es la última tabla "Parfumo+" que te pegué (tiene fecha arriba).
  Si no hay tabla, o es de hace más de un mes, avisame que la actualice.
- En la tabla, las valoraciones son de 0 a 10 y entre paréntesis están los votos. "-" = sin datos.
- Marcá el nivel de confianza cuando un perfume tenga pocos votos (menos de unos 100) o ningún dato.
- No inventes datos: si falta un número, decí que falta y de dónde sale tu estimación.
- Los sprays siguen siendo estimaciones tuyas hasta que yo te pase mis números reales.
```

### Preferencia de proyección (para que el chat no se quede corto)

```
Preferencia de proyección y sprays:
- Quiero proyección y estela muy fuertes. Es mi criterio: no lo discutas ni lo reduzcas por tu cuenta.
- Para cada perfume dame tres niveles, con números concretos y su reparto: "base", "fuerte" y "bestial".
  Mi nivel por defecto es "bestial", salvo que la ocasión pida discreción (ahí bajá un nivel y decilo).
- Los números de sprays que encuentres en reseñas y tiendas son un piso de referencia, no un tope. Si el
  nivel "bestial" supera lo que dicen las fuentes, igual dalo y marcá en UNA línea qué parte es estimación.
- No repitas advertencias en cada tabla (nariz que se acostumbra, lugares cerrados): decilas una sola vez.
- Si te paso números reales míos, reemplazan tus estimaciones y los usás como base.
```

### Sprays con base en estadísticas (en vez de estimaciones sueltas)

No existe ninguna estadística pública que relacione cantidad de sprays con metros de proyección: lo que hay
son reseñas sueltas y fichas de tiendas. Lo que sí es estadístico es la **estela votada en Parfumo** (con sus
votos). Esta regla usa esa estadística y UN dato tuyo como ancla:

```
Cálculo de sprays (reemplaza cualquier número de reseñas o tiendas):
- Mi ancla: con Atlas y su estela de la tabla uso 8 sprays y tengo la proyección que quiero. (Cambiá el 8 si
  te queda corto o largo: es el único número que mueve toda la columna.)
- Para cada otro perfume: sprays = N × (11 − estela_del_perfume) / (11 − estela_del_ancla), redondeado y
  limitado entre 2 y 2×N. Si el perfume no tiene estela o tiene pocos votos, usá N y marcalo como estimado.
- Dame el nivel "bestial" con ese número, y "base" y "fuerte" como 60 % y 80 % de él.
- Una estela baja no se compensa con más sprays: si un perfume queda en el tope y su estela es menor a 6,
  decime que no llega a "bestial" y qué perfume de la tabla conviene usar en su lugar.
```

El ancla viene en "Atlas, 8 sprays" (en la comunidad de perfumes árabes 6 a 10 sprays es habitual). Ajustalo
a tu caso: subí o bajá de a 1 o 2 y fijate a qué distancia te sienten. Cuando dejás de ganar distancia, ese
es tu número. Al cambiarlo se recalcula toda la columna.

## 3. Lo que falta y no sale de Parfumo

- **Tus sprays reales:** Parfumo no los guarda. Hoy son estimaciones del chat. Cuando los calibres con tu
  piel, pasaselos al chat o pedime que sumemos esa columna al registro de uso de la extensión.
- **Estación y día/noche** (y notas) por perfume: están en la ficha de cada perfume. Falta una ficha
  guardada para poder leerlos y sumarlos a la tabla.
