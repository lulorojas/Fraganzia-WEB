<!--
SYNC IMPACT REPORT
==================
Version change: (template / unversioned) → 1.0.0
Bump rationale: MAJOR — ratificación inicial de la constitución completa del proyecto Fraganzia.
                Se define la totalidad de principios inmutables, stack, modelo de datos y gobernanza.

Principios definidos (nuevos):
  I.   Spec-Driven Development (SDD) — ABSOLUTO
  II.  Firebase: solo 3 servicios (Auth, Firestore, Hosting) — ABSOLUTO
  III. SDK modular de Firebase v9+ en React — ABSOLUTO
  IV.  Sin backend propio — ABSOLUTO
  V.   GitHub Actions solo al final — ABSOLUTO
  VI.  No inventar, preguntar — ABSOLUTO

Secciones agregadas (estructura de 15 secciones del meta-prompt):
  1. Rol y contexto            9.  Especificación de páginas y componentes
  2. Principios inmutables     10. Flujos de usuario
  3. Stack tecnológico         11. Variables de entorno
  4. Identidad visual          12. CI/CD
  5. Estructura de carpetas    13. Constantes del sistema
  6. Modelo de datos Firestore 14. Índices Firestore
  7. Reglas de seguridad       15. Notas críticas para el agente
  8. Lógica de negocio         + Gobernanza

Secciones removidas: ninguna (documento inicial).

Templates dependientes:
  ✅ .specify/templates/plan-template.md   — "Constitution Check" es genérico, sigue siendo compatible.
  ✅ .specify/templates/spec-template.md    — sin secciones obligatorias en conflicto.
  ✅ .specify/templates/tasks-template.md   — sin categorías de tareas en conflicto.
  ✅ .specify/templates/checklist-template.md — genérico, compatible.

Follow-up TODOs: ninguno. No quedan placeholders sin resolver.
-->

# Fraganzia Constitution

## 1. Rol y contexto

El agente es el **desarrollador único** de **Fraganzia**, una tienda web de perfumes árabes/de nicho.
Construye una **Single Page Application (SPA)** en React donde el cliente navega un catálogo,
arma un **carrito**, elige método de pago y cierra el pedido por **WhatsApp** (el pedido también
se persiste en Firestore). Un **panel de administración** protegido por Firebase Authentication
permite gestionar perfumes, pedidos, promociones y configuración.

El desarrollo se rige por **Spec-Driven Development (SDD)**: primero la especificación, luego la
aprobación del usuario, luego el código. Esta constitución es la **fuente de verdad absoluta e
inmutable** del proyecto. Ante cualquier duda de implementación, la constitución tiene la última
palabra. No se modifica "sobre la marcha": todo cambio requiere una revisión explícita y aprobada
de este documento (ver Gobernanza).

## 2. Principios inmutables

Estos principios NO pueden violarse bajo ninguna circunstancia.

### I. Spec-Driven Development (SDD) — ABSOLUTO
Antes de escribir cualquier código, el agente presenta la especificación del módulo/componente y
espera **aprobación explícita** del usuario. El flujo es siempre `SPEC → APROBACIÓN → CÓDIGO`,
nunca al revés. Sin aprobación no hay código. La spec de cada módulo DEBE incluir: qué hace, qué
datos lee y de dónde, qué datos escribe y dónde, qué renderiza/retorna, qué props recibe (si es
componente) y qué efectos secundarios produce.

### II. Firebase: solo 3 servicios — ABSOLUTO
El proyecto usa **únicamente**: Firebase **Authentication**, Firebase **Firestore** y Firebase
**Hosting**. Está **terminantemente prohibido**: Cloud Functions, Storage (las fotos van como URLs
externas), Extensions, Admin SDK en el cliente y cualquier otro servicio de Firebase. Si una
funcionalidad "requiere" Cloud Functions, se busca una alternativa 100% cliente; si no existe, se
**simplifica la funcionalidad**, no se agrega el servicio prohibido.

### III. SDK modular de Firebase v9+ en React — ABSOLUTO
Todas las operaciones con Firebase se hacen con el **SDK modular v9+** importado directamente en el
cliente React. Prohibido usar la REST API de Firebase o `fetch()` contra endpoints de Firebase.

```javascript
// CORRECTO
import { collection, getDocs } from 'firebase/firestore';
// PROHIBIDO
fetch('https://firestore.googleapis.com/...')
```

### IV. Sin backend propio — ABSOLUTO
No existe servidor propio, API propia ni middleware. Toda la lógica de negocio vive en el frontend
React. El único "backend" es Firebase.

### V. GitHub Actions solo al final — ABSOLUTO
El workflow de CI/CD para deploy automático a Firebase Hosting se configura **únicamente** cuando
toda la aplicación funciona correctamente en local. Es el **último** paso del proyecto.

### VI. No inventar, preguntar — ABSOLUTO
Si algo no está especificado en la constitución, el agente **pregunta** antes de implementar. Nunca
asume, nunca improvisa funcionalidades no acordadas.

## 3. Stack tecnológico

| Tecnología          | Versión      | Uso                          | Razón                          |
|---------------------|--------------|------------------------------|--------------------------------|
| React               | 18+          | Framework frontend           | Estabilidad, ecosistema        |
| Vite                | Latest       | Build tool                   | Velocidad de desarrollo        |
| React Router DOM    | v6           | Routing SPA                  | Standard en React 18           |
| Firebase SDK        | v9+ modular  | Auth + Firestore + Hosting   | Requerimiento del proyecto     |
| TailwindCSS         | v3           | Estilos                      | Rapidez + consistencia         |
| Framer Motion       | Latest       | Animaciones                  | Calidad visual premium         |
| TanStack Query      | v5           | Cache y fetching             | Manejo de estado servidor      |
| Lucide React        | Latest       | Iconografía                  | Consistencia visual            |
| React Hook Form     | Latest       | Formularios admin            | Performance + validación       |
| Zod                 | Latest       | Validación de schemas        | Type-safety en runtime         |
| GitHub Actions      | —            | CI/CD (solo al final)        | Deploy automático              |

**Prohibido agregar:**
- Redux, Zustand u otro gestor de estado global → se usa **Context API + useReducer**.
- Axios → se usa **fetch nativo** (solo para APIs externas como dolarapi; nunca contra Firebase).
- Styled Components, Emotion u otra solución CSS-in-JS.
- Next.js → el proyecto es **Vite + React puro**.
- Cualquier librería de UI components completa (MUI, Ant Design, Chakra, etc.).

## 4. Identidad visual

Tema oscuro premium, violeta sobre negro, con glassmorphism y glow violeta.

```css
:root {
  /* Fondos */
  --color-bg: #0A0A0F;                       /* Fondo principal de la app */

  /* Acentos violeta */
  --color-violet: #7B2FBE;                   /* Acento primario (botones, links activos) */
  --color-violet-light: #9B59D0;             /* Violeta claro (hovers, gradientes) */
  --color-lila-accent: #C084FC;              /* Lila de acento (destacados, badges) */

  /* Texto */
  --color-text: #F8F8FF;                     /* Texto principal */
  --color-text-secondary: #A0A0B8;           /* Texto secundario / muted */

  /* Bordes y glow */
  --color-border: rgba(123, 47, 190, 0.2);   /* Bordes de tarjetas glass */
  --color-glow: rgba(123, 47, 190, 0.3);     /* Glow violeta (sombras, halos) */

  /* Estados */
  --color-success: #10B981;                  /* Éxito (confirmaciones) */
  --color-error: #EF4444;                    /* Error (validaciones, fallos) */
}
```

**Tipografías** (Google Fonts):
- `Playfair Display` → títulos y encabezados (serif elegante).
- `Inter` → cuerpo de texto, UI, formularios (sans legible).
- `Cormorant Garamond` → precios y detalles de lujo (serif refinada).

**Efectos visuales** (valores base, ajustables por componente en la spec correspondiente):
```css
/* Glassmorphism */
.glass {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  border: 1px solid var(--color-border);
  border-radius: 16px;
}
/* Glow violeta */
.glow { box-shadow: 0 0 24px var(--color-glow); }
/* Gradiente de acento */
.gradient-violet {
  background: linear-gradient(135deg, var(--color-violet), var(--color-violet-light));
}
/* Transiciones (complementadas con Framer Motion en entradas/salidas) */
.transition-base { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
```
Las animaciones de entrada/salida, listas y modales se implementan con **Framer Motion**.

## 5. Estructura de carpetas

```text
fraganzia-web/
├── public/                         # Assets estáticos servidos tal cual (favicon, etc.)
├── index.html                      # HTML raíz de Vite (monta #root)
├── vite.config.js                  # Configuración de Vite
├── tailwind.config.js              # Tema Tailwind (colores/fuentes de la Sección 4)
├── postcss.config.js               # PostCSS para Tailwind
├── firebase.json                   # Config de Firebase Hosting (rewrites SPA) + rules/indexes
├── firestore.rules                 # Reglas de seguridad Firestore (Sección 7)
├── firestore.indexes.json          # Índices compuestos (Sección 14)
├── .env.local                      # Variables de entorno reales (GITIGNORED)
├── .env.example                    # Plantilla de variables sin valores (commiteado)
├── .github/
│   └── workflows/
│       └── deploy.yml              # CI/CD a Firebase Hosting (SOLO AL FINAL, Sección 12)
└── src/
    ├── main.jsx                    # Punto de entrada: monta App con providers globales
    ├── App.jsx                     # Composición raíz: Router + Contexts + QueryClient
    ├── index.css                   # Directivas Tailwind + variables CSS de la Sección 4
    ├── firebase/
    │   └── config.js               # Inicializa app Firebase; exporta `auth` y `db`
    ├── router/
    │   └── AppRouter.jsx           # Definición de rutas y guardas de rutas admin
    ├── context/
    │   ├── AuthContext.jsx         # Estado de sesión admin (onAuthStateChanged + isAdmin)
    │   └── CartContext.jsx         # Carrito con useReducer (add/remove/clear/setMetodoPago)
    ├── hooks/
    │   ├── usePerfumes.js          # Query de catálogo con filtros (TanStack Query)
    │   ├── usePerfume.js           # Query de un perfume por id
    │   ├── useDolarBlue.js         # Query del dólar blue + fallback config (Sección 8)
    │   ├── usePedidos.js           # Query/creación de pedidos
    │   ├── usePromociones.js       # Query de promociones activas
    │   ├── useConfig.js            # Query del documento config/general
    │   └── useEstadisticas.js      # Lectura de estadísticas (dashboard admin)
    ├── services/                   # Capa de acceso a Firestore (SDK v9+)
    │   ├── perfumesService.js      # CRUD de perfumes
    │   ├── pedidosService.js       # Crear/listar/leer pedidos
    │   ├── promocionesService.js   # CRUD de promociones
    │   ├── configService.js        # Leer/actualizar config/general
    │   └── estadisticasService.js  # Incrementar vistas / agregados al carrito
    ├── utils/
    │   ├── precios.js              # Conversión USD→ARS y precios efectivo/transferencia
    │   ├── whatsapp.js             # Construcción del mensaje y link wa.me
    │   └── format.js               # Formateo de moneda ARS y utilidades de texto
    ├── constants/
    │   └── index.js                # Constantes del sistema (Sección 13)
    ├── schemas/
    │   ├── perfumeSchema.js        # Schema Zod para alta/edición de perfume
    │   └── pedidoSchema.js         # Schema Zod para validar el pedido antes de guardar
    ├── components/
    │   ├── ui/                     # Reutilizables: Button, GlassCard, Badge, Modal, Spinner
    │   ├── layout/                 # Navbar, Footer, AdminLayout
    │   ├── perfumes/               # PerfumeCard, PerfumeGrid, Filtros, NotasOlfativas
    │   ├── cart/                   # CartDrawer, CartItem, ResumenCheckout, SelectorPago
    │   └── admin/                  # Tablas y formularios del panel admin
    └── pages/
        ├── Home.jsx                # Landing: hero, destacados, promociones
        ├── Catalogo.jsx            # Grilla de perfumes + filtros
        ├── PerfumeDetalle.jsx      # Detalle de un perfume; registra vista
        ├── Carrito.jsx             # Carrito + selección de pago + checkout WhatsApp
        ├── Login.jsx               # Login del admin (email/password)
        └── admin/
            ├── Dashboard.jsx       # Métricas (estadisticas) y accesos rápidos
            ├── AdminPerfumes.jsx   # ABM de perfumes
            ├── AdminPedidos.jsx    # Listado y detalle de pedidos
            ├── AdminPromociones.jsx# ABM de promociones
            └── AdminConfig.jsx     # Edición de dólar blue manual y número WhatsApp
```

## 6. Modelo de datos Firestore

Tipos en notación TypeScript. `Timestamp` es `firebase/firestore`.

### Colección `perfumes` (id auto-generado)
```typescript
{
  nombre: string;              // Nombre comercial del perfume
  marca: string;               // Una de MARCAS (constantes)
  genero: 'Masculino' | 'Femenino' | 'Kids';  // Género objetivo
  familiaOlfativa: string;     // Una de FAMILIAS_OLFATIVAS
  descripcion: string;         // Descripción larga
  notasSalida: string[];       // Notas de salida
  notasCorazon: string[];      // Notas de corazón
  notasFondo: string[];        // Notas de fondo
  precioUSD: number;           // Precio base en USD (fuente de verdad del precio)
  volumenML: number;           // Volumen del frasco en mililitros
  imagenes: string[];          // URLs EXTERNAS de imágenes (NO Firebase Storage)
  destacado: boolean;          // Se muestra en Home
  disponible: boolean;         // Hay stock para vender
  activo: boolean;             // Visible en el catálogo (soft-delete si false)
  createdAt: Timestamp;        // Alta del documento
  updatedAt: Timestamp;        // Última modificación
}
```

### Colección `pedidos` (id auto-generado)
```typescript
{
  items: Array<{
    perfumeId: string;         // Referencia al perfume
    nombre: string;            // Snapshot del nombre al momento del pedido
    marca: string;             // Snapshot de la marca
    precioUSD: number;         // Snapshot del precio USD
    precioARS: number;         // Precio ARS calculado al momento del pedido
    cantidad: number;          // Unidades
  }>;
  metodoPago: 'Transferencia' | 'Efectivo';  // Método elegido
  dolarBlueUsado: number;      // Valor medio del dólar blue aplicado
  subtotalARS: number;         // Suma de items en ARS (precio transferencia)
  descuentoARS: number;        // Descuento aplicado (5% si Efectivo, si no 0)
  totalARS: number;            // Total final en ARS a cobrar
  clienteNombre: string;       // Nombre ingresado por el cliente en el checkout
  estado: 'confirmado';        // Único estado del sistema
  createdAt: Timestamp;        // Momento del pedido
}
```

### Colección `promociones` (id auto-generado)
```typescript
{
  titulo: string;              // Título de la promoción
  descripcion: string;         // Texto descriptivo
  imagen: string;              // URL EXTERNA de la imagen del banner
  perfumeIds: string[];        // Perfumes asociados (puede ser vacío)
  activa: boolean;             // Se muestra en Home si true
  orden: number;               // Orden de aparición (asc)
  createdAt: Timestamp;        // Alta
}
```

### Colección `admins` (id = UID de Firebase Auth)
```typescript
{
  // ID del documento = uid del usuario en Firebase Authentication
  email: string;               // Email del administrador
  nombre: string;              // Nombre para mostrar
  createdAt: Timestamp;        // Alta (creada manualmente por otro admin/consola)
}
```

### Colección `config` (documento único, id = "general")
```typescript
{
  // ID del documento = "general"
  dolarBlueManual: number;     // Fallback del dólar blue si la API falla
  whatsappNumero: string;      // Número destino de pedidos: "5491130097370"
  updatedAt: Timestamp;        // Última edición desde AdminConfig
}
```

### Colección `estadisticas` (id = perfumeId)
```typescript
{
  // ID del documento = id del perfume correspondiente
  perfumeId: string;           // Redundante con el id del doc, para queries
  vistas: number;              // Veces que se abrió el detalle
  agregadosCarrito: number;    // Veces que se agregó al carrito
  updatedAt: Timestamp;        // Última actualización
}
```

## 7. Reglas de seguridad Firestore

Contenido completo listo para `firestore.rules`:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Un usuario es admin si existe su documento en /admins/{uid}.
    function isAdmin() {
      return request.auth != null
        && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    // Catálogo: lectura pública; escritura solo admin.
    match /perfumes/{perfumeId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Promociones: lectura pública; escritura solo admin.
    match /promociones/{promoId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Config: lectura pública (el cliente necesita whatsappNumero y el
    // fallback dolarBlueManual); escritura solo admin.
    match /config/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Pedidos: el cliente PUEDE crear su pedido; solo admin lee/edita/borra.
    // La creación exige estado 'confirmado' y método de pago válido.
    match /pedidos/{pedidoId} {
      allow create: if request.resource.data.estado == 'confirmado'
        && request.resource.data.metodoPago in ['Transferencia', 'Efectivo'];
      allow read, update, delete: if isAdmin();
    }

    // Estadísticas: sin Cloud Functions, el cliente incrementa contadores
    // desde el navegador. Lectura solo admin (dashboard). La escritura pública
    // se restringe a los campos permitidos para evitar abuso de otros datos.
    match /estadisticas/{perfumeId} {
      allow read: if isAdmin();
      allow write: if request.resource.data.keys()
        .hasOnly(['perfumeId', 'vistas', 'agregadosCarrito', 'updatedAt']);
    }

    // Admins: solo admins leen; alta/baja se hace manualmente (consola).
    match /admins/{uid} {
      allow read: if isAdmin();
      allow write: if false;
    }
  }
}
```

## 8. Lógica de negocio

### 8.1 Dólar blue (`hooks/useDolarBlue.js` + `utils/precios.js`)
Se obtiene el dólar blue de `https://dolarapi.com/v1/dolares/blue` con `fetch` nativo y se cachea
con TanStack Query. Si la API falla, se usa `config/general.dolarBlueManual`.

```javascript
// utils/precios.js

// Valor medio del dólar blue: promedio entre compra y venta.
export function valorDolarMedio(dolar) {
  return (dolar.compra + dolar.venta) / 2; // p. ej. (1000 + 1050) / 2 = 1025
}

// Conversión de USD a ARS usando el valor medio del dólar blue.
export function usdAArs(precioUSD, dolarMedio) {
  return precioUSD * dolarMedio;
}

// Precio por método de pago. Efectivo aplica 5% de descuento; transferencia es base.
export function preciosPorMetodo(precioUSD, dolarMedio) {
  const precioARS = usdAArs(precioUSD, dolarMedio);      // precio transferencia (base)
  return {
    precioTransferencia: precioARS,                       // base
    precioEfectivo: precioARS * 0.95,                     // 5% off
  };
}
```

```javascript
// hooks/useDolarBlue.js (pseudo-real)
// 1. useQuery(['dolarBlue']) → fetch('https://dolarapi.com/v1/dolares/blue')
//    respuesta: { compra: number, venta: number, ... }
// 2. staleTime ~30 min para no golpear la API en cada render.
// 3. onError / si no hay dato → leer config/general.dolarBlueManual y usarlo como
//    compra y venta iguales (medio = dolarBlueManual).
// 4. Retorna { dolarMedio, esFallback }.
```
**Regla:** ambos precios (efectivo y transferencia) están **siempre visibles** en la UI.

### 8.2 Mensaje de WhatsApp (`utils/whatsapp.js`)
El checkout construye el texto del pedido y abre `wa.me` con el mensaje pre-armado.

```javascript
// utils/whatsapp.js
import { WHATSAPP_NUMERO } from '../constants';
import { formatARS } from './format';

// Arma el texto del pedido y devuelve el link wa.me listo para abrir.
export function generarLinkWhatsApp({ clienteNombre, items, metodoPago, total }) {
  const lineas = [
    '¡Hola Fraganzia! Quiero hacer un pedido:',
    '',
    ...items.map(
      (it) => `• ${it.cantidad}x ${it.marca} - ${it.nombre} (${formatARS(it.precioARS)} c/u)`
    ),
    '',
    `Método de pago: ${metodoPago}`,
    `Total: ${formatARS(total)}`,
    '',
    `Cliente: ${clienteNombre}`,
  ];
  const texto = encodeURIComponent(lineas.join('\n')); // encodeURIComponent para saltos/acentos
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${texto}`;
}
```
En el checkout: se valida el pedido con Zod, se **guarda en Firestore** (`pedidos`) y **luego** se
abre `window.open(generarLinkWhatsApp(...), '_blank')`.

### 8.3 Cálculo del total del carrito
```javascript
// El subtotal se calcula sobre el precio de transferencia (base).
// subtotalARS = Σ (item.precioARS * item.cantidad)
// Si metodoPago === 'Efectivo':  descuentoARS = subtotalARS * 0.05, total = subtotalARS * 0.95
// Si metodoPago === 'Transferencia': descuentoARS = 0, total = subtotalARS
```

## 9. Especificación de páginas y componentes

### Rutas
| Ruta                  | Página              | Acceso   |
|-----------------------|---------------------|----------|
| `/`                   | Home                | Público  |
| `/catalogo`           | Catalogo            | Público  |
| `/perfume/:id`        | PerfumeDetalle      | Público  |
| `/carrito`            | Carrito             | Público  |
| `/login`              | Login               | Público  |
| `/admin`              | Dashboard           | Admin    |
| `/admin/perfumes`     | AdminPerfumes       | Admin    |
| `/admin/pedidos`      | AdminPedidos        | Admin    |
| `/admin/promociones`  | AdminPromociones    | Admin    |
| `/admin/config`       | AdminConfig         | Admin    |

Las rutas `/admin/*` están protegidas por una guarda que exige sesión con Auth **y** `isAdmin`.

### Páginas
- **Home** — Secciones en orden: (1) Hero con nombre/branding y CTA al catálogo; (2) Perfumes
  destacados (`perfumes` con `destacado == true`); (3) Promociones activas (`promociones` con
  `activa == true`, ordenadas por `orden`). Consume: `usePerfumes`, `usePromociones`, `useDolarBlue`.
- **Catalogo** — Grilla `PerfumeGrid` + panel `Filtros` (por género, familia olfativa, marca y
  búsqueda por texto). Consume: `usePerfumes` (con filtros), `useDolarBlue`. Interacción: filtrar,
  abrir detalle, agregar al carrito.
- **PerfumeDetalle** — Muestra imágenes, notas olfativas (salida/corazón/fondo), descripción y
  **ambos precios**. Al montar, registra una vista (`estadisticasService.incrementarVista`).
  Interacción: seleccionar cantidad y agregar al carrito. Consume: `usePerfume`, `useDolarBlue`.
- **Carrito** — Lista de `CartItem`, `SelectorPago` (Transferencia/Efectivo), `ResumenCheckout`
  con subtotal/descuento/total, campo nombre del cliente y botón "Pedir por WhatsApp". Al
  confirmar: valida (Zod) → guarda pedido → abre WhatsApp → limpia carrito. Consume: `CartContext`,
  `useDolarBlue`, `usePedidos`.
- **Login** — Formulario email/password (React Hook Form + Zod) → `signInWithEmailAndPassword`.
  Redirige a `/admin` si el usuario es admin.
- **Dashboard** — Métricas desde `estadisticas` (más vistos, más agregados) y accesos rápidos.
- **AdminPerfumes / AdminPromociones** — Tablas + formularios ABM (React Hook Form + Zod).
- **AdminPedidos** — Listado de pedidos (ordenado por `createdAt` desc) con detalle.
- **AdminConfig** — Edita `dolarBlueManual` y `whatsappNumero` en `config/general`.

### Componentes complejos (contrato resumido)
- **PerfumeCard** — props: `{ perfume, dolarMedio }`. Estado interno: hover. Efectos: al click
  "agregar", despacha `CartContext.add` e incrementa `agregadosCarrito`. Muestra ambos precios.
- **CartDrawer / Carrito CartItem** — props: `{ item }`. Efectos: `CartContext.updateCantidad` /
  `remove`.
- **SelectorPago** — props: `{ value, onChange }`. Sin estado propio (controlado).
- **Filtros** — props: `{ filtros, onChange }`. Controlado por la página.
- **ProtectedRoute** — props: `{ children }`. Lee `AuthContext`; redirige a `/login` si no admin.

## 10. Flujos de usuario

### Flujo cliente (compra)
1. Entra a **Home**, ve destacados y promociones.
2. Va al **Catálogo**, filtra por género/familia/marca/búsqueda.
3. Abre un **detalle** (se registra la vista), revisa notas y ambos precios.
4. **Agrega al carrito** (se registra el agregado); repite con otros perfumes.
5. Va al **Carrito**, elige **método de pago** (ve el descuento del 5% si es efectivo).
6. Ingresa su **nombre** y confirma.
7. El sistema **valida y guarda el pedido** en Firestore y **abre WhatsApp** con el mensaje armado.
8. Cierra la compra conversando por WhatsApp con Fraganzia.

### Flujo admin
1. Entra a **/login**, se autentica (email/password).
2. La guarda verifica `isAdmin`; accede a **/admin**.
3. En **Dashboard** revisa vistas y agregados.
4. Gestiona **perfumes** (alta/edición/soft-delete con `activo`), **promociones** y revisa
   **pedidos**.
5. Ajusta **config** (dólar blue manual de fallback, número de WhatsApp) cuando es necesario.

## 11. Variables de entorno

Prefijo `VITE_` (obligatorio para exponerlas al cliente en Vite).

**`.env.local`** (valores reales, **GITIGNORED**):
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

**`.env.example`** (commiteado, **sin valores**):
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```
Nota: `STORAGE_BUCKET` viene en la config estándar de Firebase; **no se usa** el servicio Storage
(Principio II). El número de WhatsApp y el dólar de fallback NO son env vars: viven en
`config/general` (editables por el admin).

## 12. CI/CD

Workflow **`.github/workflows/deploy.yml`** — se crea **solo al final** (Principio V).

Pasos que ejecuta al hacer `push` a `main`:
1. `checkout` del repositorio.
2. `setup-node` (Node LTS) + cache de dependencias.
3. `npm ci` — instala dependencias.
4. `npm run build` — build de producción de Vite (inyectando las `VITE_*` desde secrets).
5. Deploy a **Firebase Hosting** con `firebase-tools` (canal `live`).

Secrets requeridos en GitHub (Settings → Secrets and variables → Actions):
- `FIREBASE_SERVICE_ACCOUNT` — credencial de deploy a Hosting.
- `FIREBASE_PROJECT_ID` — id del proyecto Firebase.
- Las seis `VITE_FIREBASE_*` de la Sección 11 (para el build).

El YAML completo se redacta y aprueba (SPEC → APROBACIÓN → CÓDIGO) cuando la app funcione en local.

## 13. Constantes del sistema

Definidas en `src/constants/index.js` como exports inmutables:

```javascript
export const WHATSAPP_NUMERO = '5491130097370'; // +54 9 11 3009-7370

export const GENEROS = ['Masculino', 'Femenino', 'Kids'];

export const FAMILIAS_OLFATIVAS = [
  'Floral', 'Amaderado', 'Oriental', 'Cítrico', 'Acuático', 'Aromático',
  'Gourmand', 'Chipre', 'Fougère', 'Especiado', 'Aldehídico', 'Verde',
];

export const MARCAS = [
  'Afnan', 'Al Haramain', 'Al Wataniah', 'Anfar', 'Armaf', 'Bharara',
  'Dumont', 'Emper', 'Fragrance World', 'French Avenue', 'Grandeur',
  'Khadlaj', "L'Affair", 'Lattafa', 'Maison Alhambra', 'Nautica',
  'Orientica', 'Paris Corner', 'Rasasi', 'Rave', 'Rayhaan', 'Riiffs', 'Zimaya',
];

export const METODOS_PAGO = ['Transferencia', 'Efectivo'];

export const DESCUENTO_EFECTIVO = 0.05;   // 5% off pagando en efectivo
export const FACTOR_EFECTIVO = 0.95;      // precioEfectivo = precioARS * 0.95

export const ESTADOS_PEDIDO = ['confirmado']; // único estado del sistema

export const DOLAR_BLUE_API = 'https://dolarapi.com/v1/dolares/blue';
```

## 14. Índices Firestore

Contenido completo listo para `firestore.indexes.json` (índices compuestos para las queries del
catálogo con filtro por atributo + orden por fecha, y para el listado de pedidos):

```json
{
  "indexes": [
    {
      "collectionGroup": "perfumes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "activo", "order": "ASCENDING" },
        { "fieldPath": "genero", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "perfumes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "activo", "order": "ASCENDING" },
        { "fieldPath": "marca", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "perfumes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "activo", "order": "ASCENDING" },
        { "fieldPath": "familiaOlfativa", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "perfumes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "activo", "order": "ASCENDING" },
        { "fieldPath": "destacado", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "promociones",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "activa", "order": "ASCENDING" },
        { "fieldPath": "orden", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```
Nota: `pedidos` ordenado solo por `createdAt` usa el índice de campo único automático (no requiere
índice compuesto).

## 15. Notas críticas para el agente

1. **Sin Cloud Functions (Principio II):** la obtención del dólar blue y el incremento de
   `estadisticas` ocurren **en el cliente**. No proponer nunca una función serverless "para hacerlo
   bien"; se resuelve desde el navegador o se simplifica.
2. **Fotos como URLs externas:** `perfumes.imagenes` y `promociones.imagen` son URLs de terceros.
   Prohibido usar Firebase Storage (Principio II).
3. **Precio fuente de verdad = USD:** los precios se guardan en `precioUSD`. ARS siempre se **calcula
   en runtime** con el dólar blue; nunca se persiste un precio ARS "fijo" (salvo el snapshot dentro
   de un `pedido` ya cerrado).
4. **Doble precio siempre visible:** en toda tarjeta/detalle/carrito se muestran precio
   Transferencia (base) y precio Efectivo (−5%).
5. **Fallback del dólar:** si `dolarapi.com` falla, usar `config/general.dolarBlueManual`. La UI debe
   poder indicar que se usó el valor de fallback (`esFallback`).
6. **`isAdmin()` vía colección `admins`:** el rol admin se determina por la existencia de
   `/admins/{uid}`. Los admins se crean **manualmente** (consola). El cliente nunca escribe `admins`.
7. **Estadísticas escribibles por público — trade-off consciente:** al no haber backend, las reglas
   restringen la escritura a los campos permitidos, pero no impiden un abuso determinado. Es una
   decisión aceptada dado el Principio IV; no "arreglar" agregando backend/Functions.
8. **Idioma:** dominio de negocio en **español** (colecciones, campos, rutas de dominio, constantes
   como `perfumes`, `pedidos`, `genero`, `familiaOlfativa`); convención técnica en **inglés** (`hooks`,
   `utils`, `components`, `services`, `useDolarBlue`, `AppRouter`). No mezclar dentro de un mismo
   identificador.
9. **Estado global solo con Context API + useReducer:** el carrito y la auth viven en Context.
   Prohibido Redux/Zustand (Sección 3).
10. **`fetch` nativo solo para APIs externas** (dolarapi). Contra Firebase, **siempre** el SDK v9+
    (Principio III). Nada de Axios.
11. **Checkout: primero persistir, después abrir WhatsApp.** Validar con Zod → guardar `pedido` en
    Firestore → `window.open(wa.me...)` → limpiar carrito. El pedido no se pierde si el usuario no
    completa el chat.
12. **`encodeURIComponent` en el mensaje de WhatsApp** para respetar saltos de línea y acentos.
13. **GitHub Actions al final (Principio V):** no crear `.github/workflows/deploy.yml` hasta que la
    app funcione completa en local.
14. **SDD estricto (Principio I):** ningún componente/módulo se codea sin spec aprobada. Ante
    ambigüedad, preguntar (Principio VI); no improvisar.

## Gobernanza

Esta constitución **supersede** cualquier otra práctica o preferencia de conveniencia durante el
desarrollo. Es la fuente de verdad del proyecto Fraganzia.

- **Inmutabilidad:** los principios (Sección 2) y el stack (Sección 3) son inmutables. No se
  cambian "sobre la marcha".
- **Procedimiento de enmienda:** todo cambio a esta constitución requiere (1) propuesta explícita
  con justificación, (2) evaluación de impacto sobre secciones dependientes, (3) **aprobación
  explícita del usuario**, y (4) actualización del número de versión y del Sync Impact Report.
- **Versionado semántico del documento:**
  - **MAJOR:** remoción/redefinición incompatible de principios o gobernanza.
  - **MINOR:** nuevo principio/sección o expansión material de una guía existente.
  - **PATCH:** aclaraciones, correcciones de redacción o refinamientos no semánticos.
- **Cumplimiento:** toda spec y todo código deben verificarse contra esta constitución antes de
  aprobarse. Cualquier complejidad añadida debe justificarse; si contradice un principio inmutable,
  se rechaza. El flujo `SPEC → APROBACIÓN → CÓDIGO` es condición de cumplimiento.

**Version**: 1.0.0 | **Ratified**: 2026-07-07 | **Last Amended**: 2026-07-07
