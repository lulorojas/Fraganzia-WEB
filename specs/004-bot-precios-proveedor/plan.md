# Bot diario de precios y nuevos ingresos del proveedor

## Contexto

Hoy los precios en dólares (`precioUSD`) de cada perfume se cargan a mano a partir de un PDF que pasa el proveedor (Franzebi Imports). Esta iteración automatiza ese paso: un bot corre una vez al día, lee el catálogo mayorista del proveedor, actualiza `precioUSD` de los perfumes existentes y da de alta los nuevos. La web no cambia: sigue calculando el precio en pesos con `preciosPorMetodo` (`src/utils/precios.js`: `precioUSD × dólar medio × 1.40` transferencia / `× 1.35` efectivo, redondeado a miles).

Decisiones confirmadas por el usuario:
- Fuente: https://linktr.ee/Franzebi, link "PERFUMES ARABES MAYORISTA".
- Los cambios se aplican solos, sin revisión previa (precios y nuevos ingresos).
- Corre en GitHub Actions con cron diario (gratis, sin plan Blaze).
- Avisa por mensaje con el resumen de lo que hizo.

## 1. Obtención del catálogo

La fuente no es una página con datos: Linktree enlaza a un PDF en Google Drive (`drive.google.com/file/d/<ID>/view`).

1. `GET https://linktr.ee/Franzebi` y buscar el link cuyo texto es "PERFUMES ARABES MAYORISTA". Extraer el `<ID>` de Drive. No guardar el ID fijo: si el proveedor sube un PDF nuevo, Linktree apunta a otro ID.
2. Descargar `https://drive.usercontent.google.com/download?id=<ID>&export=download&confirm=t`.
3. Si la respuesta no es un PDF (empieza distinto de `%PDF`), terminar con error (ver punto 5).
4. Guardar el hash SHA-256 del PDF en `config/botProveedor` (Firestore). Si coincide con el de la última corrida, terminar sin hacer nada: el catálogo no cambió.

## 2. Extracción y parseo

- Extraer texto del PDF con `pdfjs-dist` (ya hay scripts de referencia en `Fraganzia-archivo/scripts/extract-pdf-text.mjs`).
- Parsear cada línea del PDF a `{ nombre, volumenML, precioUSD }`. El formato exacto del PDF se define leyendo el primer PDF real; el parser debe tener un test con un fragmento real como fixture en `tools/test/fixtures/`.
- Normalizar el nombre con `normalizarTexto` (`src/utils/texto.js`) para comparar.

## 3. Cruce con el catálogo y escritura

Leer la colección `perfumes` con `listarColeccion` (`tools/lib/firestore-rest.mjs`, 1 lectura de ~405 docs por corrida).

- **Existente** (nombre normalizado + volumen coinciden): si `precioUSD` cambió, actualizar `precioUSD`, `ultimaActualizacionPrecios` y `updatedAt`. No tocar nada más (fotos, descripción, destacado, disponible).
- **Nuevo** (sin coincidencia): crear el documento oculto, con `activo: true`, `disponible: false`, `pendienteCarga: true`, `nombre`, `marca` (la existente que coincida con el prefijo del nombre, o la primera palabra), `genero` (del encabezado "FRAGANCIAS MASCULINAS/FEMENINAS/KIDS" de la página del PDF), `volumenML`, `precioUSD`, `imagenes: []`, `createdAt` / `updatedAt`. No se publica hasta cargar familia olfativa, notas, descripción y foto, que el PDF no trae: se completan en una sesión con el asistente ("cargá los nuevos"), que al terminar pone `disponible: true` y borra `pendienteCarga`. El aviso diario los lista.
- **Ya no está en el PDF**: no se toca. Marcarlo no disponible queda fuera de alcance de esta iteración (el proveedor puede quitar un producto temporalmente).
- Coincidencia ambigua (más de un perfume con el mismo nombre normalizado): no tocar ninguno y listarlo en el resumen.

Escritura con la API REST de Firestore y la cuenta de servicio, en lotes de hasta 400 operaciones.

## 4. Protecciones (porque se aplica sin revisión)

Un parseo roto no debe pisar los precios reales. El bot aborta sin escribir nada y avisa si:
- El PDF devuelve menos de 100 filas parseadas.
- Más del 30 % de los perfumes existentes cambian de precio en una sola corrida.
- Un precio parseado es 0, negativo o no numérico, o varía más de 50 % contra el actual (esa fila se omite y se lista en el resumen; las demás se aplican).

Cada corrida guarda en `botProveedorLog/{fecha}`: hash del PDF, cantidad de actualizados, nuevos, omitidos y la lista de cambios (`nombre`, `precioAnterior`, `precioNuevo`). Esto permite revertir a mano.

## 5. Ejecución y avisos

- Workflow `.github/workflows/bot-proveedor.yml`: `schedule` diario (por ejemplo 09:00 UTC) más `workflow_dispatch` para correrlo a demanda. Script: `tools/bot-proveedor.mjs`.
- Secrets de GitHub: credencial de la cuenta de servicio de Firebase (`FIREBASE_SERVICE_ACCOUNT`) y las de CallMeBot (`CALLMEBOT_PHONE`, `CALLMEBOT_APIKEY`).
- Aviso: por WhatsApp al propio número del usuario con CallMeBot (gratis; se registra una vez mandando un mensaje al bot). El mensaje diario tiene: nuevos ingresos con su nombre, cantidad de precios actualizados, filas omitidas y errores, truncado a 1200 caracteres. Si no hubo cambios, no se envía nada. Si el bot falla o aborta por las protecciones, se envía siempre.
- La cuota diaria de Firestore es compartida con la web: el bot hace una lectura de la colección por día y solo las escrituras necesarias.

## 6. Fuera de alcance

- Fotos de los perfumes nuevos, género, familia olfativa y descripción (se completan después en el admin).
- Catálogo de diseñador, testers, decants y demás categorías del Linktree.
- Despublicar perfumes que desaparecen del PDF.
- Aviso por otros canales (mail, WhatsApp Business API).

## Verificación

1. Test del parser contra un fragmento real del PDF.
2. Corrida local con `--dry-run` (imprime los cambios sin escribir) contra el PDF real; revisar la lista a mano.
3. Corrida real una vez con `workflow_dispatch` y comprobar `botProveedorLog` y el aviso.
4. Segunda corrida inmediata: debe terminar por hash igual, sin escrituras.
