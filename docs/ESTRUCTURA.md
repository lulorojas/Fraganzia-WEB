# Estructura del proyecto

Qué hay en cada carpeta, cómo se conectan las partes y dónde tocar para cada tipo de cambio.

## Vista general

```
Fraganzia-WEB/
├── .github/workflows/deploy.yml   # CI: cada push a main compila y publica en Firebase Hosting
├── docs/                          # Esta documentación
├── public/                        # Archivos estáticos que se copian tal cual al sitio
├── specs/                         # Especificaciones de features (Spec Kit)
├── src/                           # Código de la app React
├── tools/                         # Scripts de build y de mantenimiento
├── firebase.json                  # Hosting: rewrites, cabeceras de seguridad y caché
├── firestore.rules                # Reglas de seguridad de la base de datos
├── firestore.indexes.json         # Índices compuestos de Firestore
├── index.html                     # Plantilla HTML (SEO, íconos, preloads)
├── vite.config.js                 # Build: chunks, CSS inline, App Check opcional
└── tailwind.config.js             # Paleta, tipografías y animaciones del design system
```

## `src/`: la aplicación

```
src/
├── main.jsx            # Punto de entrada: fuentes, estilos y montaje de <App>
├── App.jsx             # Providers (React Query, Auth, Carrito, Toasts) + ErrorBoundary
├── index.css           # Tailwind + clases propias (glass, card-surface, foco, reduced-motion)
├── router/
│   └── AppRouter.jsx   # Todas las rutas. Públicas en el bundle principal, /admin lazy
├── pages/              # Una página por ruta
│   ├── Home.jsx, Catalogo.jsx, PerfumeDetalle.jsx, Carrito.jsx,
│   ├── SobreNosotros.jsx, Contacto.jsx, Login.jsx, NotFound.jsx
│   └── admin/          # Panel interno: perfumes, pedidos, promociones, usuarios,
│                       # config y finanzas (ventas, compras, gastos, stock, analytics…)
├── components/
│   ├── layout/         # Navbar, Footer, AdminLayout, AuthModal, ProtectedRoute
│   ├── perfumes/       # PerfumeCard, PerfumeGrid, ImagenProducto, Filtros, slider, notas olfativas
│   ├── asistente/      # Botón flotante y chat "Encontrá tu perfume"
│   ├── cart/           # Ítem del carrito, selector de pago, resumen
│   ├── admin/          # Formularios, tablas y gráficos del panel
│   └── ui/             # Piezas genéricas: Button, Modal, Toast, Spinner, Logo, ErrorBoundary
├── hooks/              # Un hook por dato (usePerfumes, usePedidos, useConfig…), todos con React Query
├── services/           # Única capa que habla con Firestore / APIs externas
├── schemas/            # Validación con zod (formularios y pedidos)
├── context/            # Estado global: sesión (Auth), carrito, toasts
├── firebase/           # Inicialización de Firebase (+ App Check opcional)
├── constants/          # WhatsApp, géneros, familias olfativas, marcas, socios
├── data/               # imagenes-locales.json: qué fotos ya están optimizadas en el sitio
├── utils/              # Precios, formato de moneda, WhatsApp, imágenes, datos iniciales, recomendador
└── assets/fonts/       # Fuentes recortadas al español (ver tools/subset-fonts.py)
```

### Cómo fluye un dato

```
Firestore ──► services/*.js ──► hooks/use*.js (React Query, caché) ──► pages / components
```

- **Servicios**: funciones `async` que leen o escriben en Firestore. Ningún componente importa Firestore directamente.
- **Hooks**: envuelven cada servicio en `useQuery` / `useMutation`. Definen la clave de caché y cuánto tiempo el dato se considera fresco. Las mutaciones invalidan las claves afectadas.
- **Catálogo público**: se lee **una sola vez** (`['perfumes', 'public']`), y los filtros y la búsqueda se aplican en memoria (`filtrarPerfumes` en `perfumesService.js`). Cambiar un filtro no vuelve a leer Firestore.

### Fotos de producto

En Firestore cada perfume guarda la URL original de su foto (a veces en otro sitio). En el build, `tools/localizar-imagenes.mjs` descarga cada foto una sola vez y la guarda como `public/img/p/<hash>-400.webp` y `-800.webp`, donde `<hash>` sale de la URL (`src/utils/hash.js`). `<ImagenProducto>` usa la copia local si existe y, si no, la URL original. Si una foto falla al cargar, muestra un placeholder. Firestore nunca se modifica.

### Arranque rápido: pre-render + datos iniciales

1. En el build, `tools/prerender.mjs` guarda en el HTML una "foto" de los datos públicos (catálogo, promociones, config, dólar) y el HTML ya armado de cada página pública.
2. En el navegador, `src/utils/datosIniciales.js` carga esa foto en React Query **antes** del primer render. React arranca mostrando lo mismo que el HTML, sin pantallas de carga.
3. Como la foto tiene la fecha del build, React Query la considera vieja y la refresca desde Firestore en segundo plano.

## `public/`: estáticos

| Archivo | Para qué |
|---|---|
| `img/p/` | Fotos de producto optimizadas (WebP 400 y 800 px), generadas por `tools/localizar-imagenes.mjs` |
| `productos-18-09/` | Fotos originales cargadas en el catálogo del 18-09 (Firestore apunta a ellas) |
| `logo-96/192/256.webp` | Logo en varios tamaños (se elige según pantalla) |
| `icon-*.png`, `manifest.webmanifest`, `favicon.svg` | Íconos del navegador y de "agregar a inicio" |
| `robots.txt` | Indica a buscadores qué indexar y dónde está el sitemap |
| `placeholder-perfume.svg` | Imagen de reemplazo cuando un producto no tiene foto |
| `flyers/` | Plantillas HTML de historias de Instagram |

`sitemap.xml` no está en `public/`: lo genera el build en `dist/`.

## `tools/`: scripts

| Script | Cuándo corre | Qué hace |
|---|---|---|
| `localizar-imagenes.mjs` | Al inicio de cada `npm run build` (o `npm run imagenes`) | Descarga las fotos de producto (muchas estaban en sitios ajenos) y las guarda optimizadas en `public/img/p/`. Solo procesa las nuevas |
| `generate-sitemap.mjs` | En cada `npm run build` | Genera `dist/sitemap.xml` con todas las páginas y perfumes |
| `prerender.mjs` | En cada `npm run build` | Foto de datos + HTML pre-renderizado de las páginas públicas |
| `lib/firestore-rest.mjs` | Lo usan los dos anteriores | Lee colecciones públicas por REST, sin credenciales de admin |
| `test-rules.mjs` | `npm run test:rules` | Prueba `firestore.rules` en el emulador local |
| `subset-fonts.py` | A mano, si cambian las fuentes | Recorta las fuentes a los caracteres del español |
| `export-current-catalog.mjs` | A mano | Exporta el catálogo a CSV (necesita `serviceAccount.json`) |
| `cache-precios-ars.mjs` | A mano | Guarda precios en pesos de respaldo en cada perfume |

Los scripts de una sola vez que se usaron para armar el catálogo inicial (importar PDFs de proveedores, corregir imágenes, etc.) se movieron a `../../Fraganzia-archivo/`, fuera del repo.

## Colecciones de Firestore

| Colección | Lectura | Escritura | Contenido |
|---|---|---|---|
| `perfumes` | Pública | Admin | Catálogo |
| `promociones` | Pública | Admin | Descuentos y 2x1 |
| `config` | Pública | Admin | WhatsApp, dólar manual |
| `pedidos` | Admin | Cualquiera puede **crear** (validado) | Pedidos de la tienda |
| `estadisticas`, `busquedas` | Admin | Pública, solo +1 por vez | Interés de clientes |
| `admins` | Admin | Nadie (se da de alta desde la consola) | Quién es admin |
| `socios`, `ventasSocios`, `ventasDecants`, `compras`, `gastos`, `movimientosPersonales`, `transferenciasSocios`, `ajustesStock`, `cambiosMetodo`, `auditoria` | Admin | Admin | Panel financiero interno |

Las reglas completas y su justificación están comentadas en `firestore.rules`.

## ¿Dónde toco si quiero…?

| Quiero… | Archivo |
|---|---|
| Cambiar colores, tipografías o animaciones | `tailwind.config.js`, `src/index.css`, `DESIGN_SYSTEM.md` |
| Agregar una página | `src/pages/` + una `<Route>` en `src/router/AppRouter.jsx` (y en `PAGINAS` de `tools/prerender.mjs` si es pública y estática) |
| Cambiar el número de WhatsApp | Panel admin → Config (o `src/constants/index.js` como valor por defecto) |
| Cambiar cómo se calculan los precios | `src/utils/precios.js` |
| Agregar un campo al perfume | Formulario en `components/admin/PerfumeForm.jsx`, `schemas/perfumeSchema.js` y, si se ve en las cards, `CAMPOS_PERFUME` en `tools/prerender.mjs` |
| Cambiar qué puede escribir el público | `firestore.rules` + `tools/test-rules.mjs`, y desplegar con `npm run deploy:rules` |
| Cambiar cabeceras de seguridad o caché | `firebase.json` |
