# Tecnologías usadas

Qué usa Fraganzia, para qué, y por qué se eligió cada cosa. Las versiones son las de `package.json` al momento de escribir esto.

## Resumen

```
Navegador                                   Build (tu PC o GitHub Actions)
─────────                                   ──────────────────────────────
React 18 + React Router      ◄── HTML ───   Vite 5 (compila y empaqueta)
Tailwind CSS (estilos)       pre-render     Chrome headless (pre-render)
React Query (caché de datos)                Scripts Node en tools/
        │
        ▼
Firebase: Auth · Firestore · Hosting         dolarapi.com · EmailJS · WhatsApp
```

## Frontend

### React 18
Librería de interfaz. Toda la web es una SPA (*single page application*): se descarga una vez y la navegación entre páginas no recarga el sitio.
**Por qué:** es el estándar más difundido, con muchísimo material y librerías.

### React Router 6
Maneja las URLs (`/catalogo`, `/perfume/:id`, `/admin/...`) y qué página mostrar en cada una. El panel admin se carga con `lazy()`: un visitante nunca descarga ese código.

### Vite 5
Servidor de desarrollo (`npm run dev`, recarga instantánea) y empaquetador para producción (`npm run build`). Divide el código en *chunks* (React, Firebase, admin) para que el navegador los cachee por separado. `vite.config.js` además:
- mete el CSS dentro del HTML para que la página se pinte sin esperar otra descarga;
- baja la prioridad del JavaScript en páginas pre-renderizadas;
- incluye App Check solo si está configurado.

### Tailwind CSS 3
Estilos con clases utilitarias (`px-4`, `text-lila`, `md:grid-cols-2`) directamente en el JSX. La paleta, las tipografías y las animaciones de la marca están en `tailwind.config.js`. En el build solo quedan las clases que realmente se usan.
Además hay clases propias en `src/index.css`: el sistema *glass* (vidrio esmerilado), `card-surface` (tarjetas livianas), foco visible para teclado y soporte de "reducir movimiento". Ver [`DESIGN_SYSTEM.md`](../DESIGN_SYSTEM.md).

### TanStack React Query 5
Maneja todos los datos que vienen del servidor: los pide, los guarda en caché, evita pedir dos veces lo mismo, y los refresca cuando quedan viejos.
**Por qué:** cada lectura de Firestore cuesta. Con React Query el catálogo se lee una vez y se reutiliza en todas las pantallas.

### React Hook Form + Zod
Formularios (login, admin, finanzas) y validación. Zod define la "forma" de cada dato (`src/schemas/`): los mismos límites del pedido que valida el navegador también los exige `firestore.rules`.

### Framer Motion
Animaciones con resortes (*springs*) en modales y el panel. Solo se descarga cuando se abre un modal o el admin, no en la carga inicial.

### Lucide React
Íconos SVG. Solo se incluyen en el bundle los íconos que se usan.

### Fuentes
Outfit (títulos), Manrope (texto), Cinzel (frases destacadas) y Playfair Display (el logo). Se sirven desde el propio sitio, recortadas a los caracteres del español con `tools/subset-fonts.py` (~70 KB en total).

## Backend: Firebase

No hay servidor propio: todo es Firebase. No usa Cloud Functions, así que funciona en el plan gratuito (Spark).

### Firestore
Base de datos NoSQL en tiempo real. Guarda catálogo, promociones, pedidos, estadísticas y todo el panel financiero. La seguridad no depende del código de la web sino de **`firestore.rules`**, que se ejecuta en los servidores de Google:
- el catálogo es de lectura pública y escritura solo admin;
- los pedidos los puede crear cualquiera, pero con forma, tipos y tamaños validados;
- los contadores de interés solo pueden subir de a 1;
- las finanzas son privadas de los admins, y los movimientos personales, de cada socio.

Las reglas tienen pruebas automáticas (`npm run test:rules`, con el emulador de Firebase).

### Firebase Authentication
Login con email y contraseña. Un usuario es admin si existe su documento en la colección `admins`.

### Firebase Hosting
Sirve la web por CDN con HTTPS. `firebase.json` define:
- **URLs limpias y rewrites:** `/catalogo` sirve la página pre-renderizada, y `/perfume/...` y el resto van a la app;
- **cabeceras de seguridad:** CSP, HSTS, nosniff, Referrer-Policy y Permissions-Policy;
- **caché:** archivos con hash por un año, el HTML siempre revalidado.

### App Check (opcional)
Con reCAPTCHA v3, verifica que las solicitudes a Firestore vengan de la web real. Está preparado pero apagado por defecto (ver [DEPLOY.md](./DEPLOY.md#app-check-protección-contra-bots)).

## Servicios externos

| Servicio | Para qué | Si falla… |
|---|---|---|
| [dolarapi.com](https://dolarapi.com) | Cotización del dólar blue para convertir precios USD → ARS | Se usa `dolarBlueManual` de la config, o se muestra "consultá por WhatsApp" |
| WhatsApp (`wa.me`) | Envío del pedido al vendedor | — |
| [EmailJS](https://www.emailjs.com) (opcional) | Avisos por email de pedidos y registros | Sin configurar, simplemente no manda emails |

## Rendimiento y SEO

- **Pre-render** (`tools/prerender.mjs`, con Puppeteer + Chrome): en el build se genera el HTML ya armado de la home, el catálogo, Nosotros y Contacto, más una "foto" de los datos públicos. El visitante ve la página al instante, sin esperar al JavaScript, y los buscadores ven contenido real.
- **Datos iniciales:** React arranca con la foto del build (`src/utils/datosIniciales.js`) y la refresca desde Firestore en segundo plano.
- **SEO:** título y descripción por página (`useDocumentMeta`), canonical, Open Graph, datos estructurados (`Store`, `Product`) y `sitemap.xml` generado en cada build.
- **Imágenes:** WebP para las fotos locales, tamaños explícitos (sin saltos de layout) y carga diferida salvo las primeras.

## Herramientas de desarrollo

| Herramienta | Uso |
|---|---|
| ESLint / Prettier | No configurados todavía |
| `@firebase/rules-unit-testing` | Pruebas de `firestore.rules` |
| `puppeteer-core` | Pre-render en el build |
| `sharp` | Conversión de imágenes a WebP |
| `firebase-admin` | Scripts de mantenimiento con credenciales de admin (`tools/`) |
| GitHub Actions | Deploy automático en cada push a `main` |
| [Spec Kit](https://github.com/github/spec-kit) | Metodología: cada feature se especifica en `specs/` antes de implementarse |
