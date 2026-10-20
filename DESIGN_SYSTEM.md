# Fraganzia - Design System Documentation
**Sistema de diseño completo para propuestas de rediseño**

---

## 🎨 Brand Identity

### Concepto
Fraganzia es una marca de perfumes árabes premium que combina:
- **Elegancia** y **sofisticación** 
- **Misterio** y **exclusividad**
- **Modernidad** con toques de **lujo oriental**

### Valores de marca
- Premium sin ser pretencioso
- Accesible pero exclusivo
- Moderno con respeto a la tradición árabe
- Profesional y confiable

---

## 🎨 Paleta de Colores

Paleta "oud y oro": negro cálido, dorado champagne y marfil. Se eligió porque el violeta/lila neón
se leía como tecnología o gaming, y no como perfumería árabe de lujo. El dorado remite a la
perfumería oriental y se ve exclusivo sin necesidad de efectos.

### Colores Primarios
```css
/* Fondos */
--color-bg: #0A0908              /* Negro cálido */

/* Acentos */
--color-gold: #C5A059            /* Dorado: color principal (botones, íconos, etiquetas) */
--color-gold-light: #DDBF85      /* Dorado claro: degradés y hover */
--color-champagne: #E4CFA0       /* Champagne: enlaces y destacados de texto */
--color-ink: #14100A             /* Tinta oscura: texto SOBRE fondos dorados */

/* Texto */
--color-text: #F5EFE4            /* Marfil: texto principal */
--color-text-secondary: #A89F90  /* Gris cálido: texto secundario */
```

En Tailwind: `gold`, `gold-light`, `gold-deep`, `champagne`, `ink`, `text`, `text-secondary`.
**Regla de contraste:** sobre un fondo dorado (`bg-gold`, `gradient-gold`) el texto va siempre en
`text-ink`, nunca en blanco ni marfil.

### Colores Funcionales
```css
--color-success: #10B981         /* Verde: éxito y precios con descuento */
--color-error: #EF4444           /* Rojo: error */
--color-border: rgba(197, 160, 89, 0.18)  /* Borde dorado sutil */
--color-glow: rgba(197, 160, 89, 0.35)    /* Brillo dorado */
```

### Contexto de uso
- **Fondo oscuro cálido**: destaca los productos, que se muestran sobre un "plinto" marfil
- **Dorado como único protagonista**: un solo color de acento, para que lo importante se vea
- **Champagne para texto**: enlaces y palabras destacadas (no para fondos)
- El panel de admin (`src/styles/admin.css`) mantiene su propia paleta violeta, aparte del sitio

---

## ✨ Glassmorphism System

### Concepto
Interfaz basada en **glassmorphism** (morfismo de vidrio) que crea:
- Sensación de profundidad y capas
- Estética moderna y premium
- Efecto de "vidrio esmerilado" con blur
- Transparencias sutiles que permiten ver el fondo

### Niveles de Glass (3)

| Clase | Dónde | Por qué |
|---|---|---|
| `.glass` | Superficies secundarias: chips, tablas y tarjetas del admin | Fondo casi transparente, blur 16px |
| `.glass-strong` | El protagonista de la página (card del hero) | Más opaco y con borde dorado marcado |
| `.glass-frosted` | Lo que flota sobre el contenido: navbar, modales, menús, asistente, mini-carrito | Fondo 85% opaco: el texto se lee sobre cualquier cosa |

`.glass-subtle` y `.glass-medium` quedan como **alias de `.glass`** por compatibilidad. En código nuevo, usá `.glass`.

**Cards que se repiten mucho** (catálogo, slider, recomendaciones): usar `.card-surface` (+ `.card-hover`). Tiene el mismo look pero **sin `backdrop-filter`**, que en celulares obliga a re-difuminar el fondo en cada frame de scroll.

Las clases viven en `src/index.css` dentro de `@layer components`, así una utilidad de Tailwind en el mismo elemento (`rounded-none`, `border-0`, `p-*`) las puede pisar.

### Efectos Interactivos

#### Glass Hover
```css
.glass-hover:hover {
  background: rgba(197, 160, 89, 0.07);
  border-color: rgba(228, 207, 160, 0.4);
  box-shadow: 
    0 12px 40px rgba(143, 115, 56, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 0 40px rgba(197, 160, 89, 0.16);
  transform: translateY(-2px);
}
```

#### Glass Glow (con borde animado)
```css
.glass-glow::before {
  /* Borde gradiente que aparece en hover */
  background: linear-gradient(
    135deg,
    rgba(192, 132, 252, 0.3),
    rgba(139, 51, 208, 0.1),
    rgba(192, 132, 252, 0.3)
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}
.glass-glow:hover::before {
  opacity: 1;
}
```

---

## 🔤 Tipografía

### Familias tipográficas

> Solo tipografías **sin serifa**. Se sirven desde el sitio, recortadas a los caracteres del español: ver `src/assets/fonts/` y `tools/subset-fonts.py`.

#### 1. Outfit (títulos y marca)
```css
font-family: 'Outfit', sans-serif;
```
- **Uso**: títulos, nombres de producto, logo
- **Pesos**: 300 (títulos grandes, aire de lujo), 400, 500, 600, 700
- **Etiquetas**: en mayúsculas con `tracking-luxury` (0.25em) y color dorado

#### 2. Manrope (texto)
```css
font-family: 'Manrope', sans-serif;
```
- **Uso**: cuerpo de texto, descripciones, interfaz
- **Pesos**: 400, 500, 600, 700

### Jerarquía tipográfica

```css
/* Hero Title */
font-size: 42-68px
font-family: Outfit
font-weight: 300 (la palabra destacada en 400, color champagne)
letter-spacing: -0.025em

/* Section Heading */
font-size: 30-36px
font-family: Outfit
font-weight: 300

/* Card Title */
font-size: 16-18px (1-1.125rem)
font-family: Outfit
font-weight: 600

/* Body Text */
font-size: 14-16px (0.875-1rem)
font-family: Manrope
font-weight: 400

/* Small Text / Captions */
font-size: 12-14px (0.75-0.875rem)
font-family: Manrope
font-weight: 400
color: text-secondary

/* Etiqueta de sección (eyebrow) */
font-size: 11px
font-family: Manrope
font-weight: 600
text-transform: uppercase
letter-spacing: 0.25em
color: gold
```

### Letter Spacing Especial
```css
.tracking-luxury {
  letter-spacing: 0.25em;  /* Para textos en mayúsculas premium */
}

.tracking-wide2 {
  letter-spacing: 0.15em;  /* Para labels y tags */
}
```

---

## 🎭 Componentes Principales

### 1. Product Card (Tarjeta de Producto)

**Estructura**:
```
┌─────────────────────────┐
│   [Imagen producto]     │ ← Fondo marfil (plinto)
│                         │
│   Badge -30%            │ ← Promoción (si aplica)
└─────────────────────────┘
┌─────────────────────────┐
│ ARMAF                   │ ← Marca (uppercase, dorado)
│ Club de Nuit Intense    │ ← Nombre (Outfit, bold)
│                         │
│ ─────────────────       │ ← Divider
│ Transferencia: $45.000  │
│ Efectivo: $50.000       │
│                         │
│   [Agregar al carrito]  │
└─────────────────────────┘
```

**Características**:
- Background oscuro cálido con superficie translúcida (sin blur)
- Imagen con fondo claro para destacar el producto
- Hover: elevación, borde dorado brillante, sombra con glow
- Border radius: 16px
- Transición suave 300ms

### 2. Button Variants

#### Primary (Gradient Violet)
```css
background: linear-gradient(135deg, #B8924A, #E0C58C);
color: #14100A;
box-shadow: 0 4px 12px rgba(143, 115, 56, 0.3);
hover: scale(1.02), shadow(0.5);
```

#### Secondary (Glass)
```css
background: rgba(255, 255, 255, 0.03);
backdrop-filter: blur(16px);
border: 1px solid rgba(147, 51, 234, 0.18);
hover: glow effect
```

#### Ghost
```css
background: transparent;
color: text-secondary;
hover: color text-primary
```

### 3. Modal (AuthModal, etc.)
- Glass frosted background
- Backdrop blur intenso (24-32px)
- Border con glow sutil
- Animation: fade-in + scale
- Overlay oscuro con blur

### 4. Navigation Bar
- Glass effect con backdrop blur
- Sticky/Fixed position
- Logo centrado o a la izquierda
- Cart icon con badge contador
- Subtle shadow

### 5. Hero (portada)
```
- Dos columnas en escritorio: texto + una única acción ("Ver catálogo") | vitrina de 3 destacados
- La vitrina muestra foto, nombre y precio reales: el primer pantallazo ya vende
- En celular, la vitrina se desliza en horizontal
- Debajo, una sola franja de confianza (originales · envíos AMBA · pago · seguimiento)
```
Las cuatro razones de confianza viven en `GarantiasCompra` (una sola fuente): no repetirlas en
el encabezado, el pie ni preguntas frecuentes.

### 6. Logo
- **Monograma**: arco de mihrab (arquitectura oriental) con una "F" adentro, en degradé dorado (`MarcaFraganzia`)
- **Nombre**: FRAGANZIA en Outfit 500, mayúsculas, espaciado 0.32em
- `LogoFraganzia` arma las dos piezas; el tamaño sale de `--logo-scale`. `subtitulo` suma "Perfumes árabes" (pie)
- Íconos (favicon, app, imagen para redes): `node tools/generar-iconos.mjs`

---

## 🎯 Layout & Spacing

### Grid System
- Max width containers: `max-w-7xl` (1280px)
- Grid columns: 1, 2, 3, 4 (responsive)
- Gap: 4, 6, 8 (1rem, 1.5rem, 2rem)

### Spacing Scale (Tailwind)
```
2  = 0.5rem  (8px)
3  = 0.75rem (12px)
4  = 1rem    (16px)
6  = 1.5rem  (24px)
8  = 2rem    (32px)
10 = 2.5rem  (40px)
12 = 3rem    (48px)
16 = 4rem    (64px)
20 = 5rem    (80px)
24 = 6rem    (96px)
```

### Border Radius
```css
rounded-lg:   8px   /* Small elements */
rounded-xl:   12px  /* Medium elements */
rounded-2xl:  16px  /* Cards, containers */
rounded-3xl:  24px  /* Large sections */
rounded-full: 999px /* Pills, badges */
```

---

## ✨ Efectos Visuales y Animaciones

### 1. Glow Effect
```css
box-shadow: 0 0 40px rgba(197, 160, 89, 0.3);
```
Uso: Hover states, elementos destacados, CTAs

### 2. Backdrop Effects
```css
backdrop-filter: blur(16px) saturate(180%);
-webkit-backdrop-filter: blur(16px) saturate(180%);
```
Uso: Todos los elementos glass

### 3. Transitions
```css
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```
Easing suave para interacciones naturales

### 4. Animaciones Personalizadas

#### Glow Pulse
```css
@keyframes glow-pulse {
  0%, 100%: opacity 0.5, glow 20px
  50%: opacity 1, glow 40px
}
```
Uso: Indicadores, badges promocionales

#### Float
```css
@keyframes float {
  0%, 100%: translateY(0px)
  50%: translateY(-10px)
}
```
Uso: Decoraciones, iconos flotantes

#### Shimmer
```css
@keyframes shimmer {
  0%: backgroundPosition -200% 0
  100%: backgroundPosition 200% 0
}
```
Uso: Loading states, highlights

### 5. Decorative Elements
- Orbs con blur (background decorativo)
- Gradientes radiales superpuestos
- Líneas ornamentales con símbolos (✦, ◆)
- Partículas de luz sutiles

---

## 📐 Component Patterns

### Card Hover Pattern
```
1. Default: border sutil, shadow suave
2. Hover: 
   - translateY(-2px) ← elevación
   - border-color más brillante
   - shadow con glow dorado
   - scale(1.02) en imagen interior
   - transition 300ms smooth
```

### Form Pattern
```
- Glass background
- Inputs con border sutil
- Focus: border dorado + glow
- Labels floating o top-aligned
- Error states en rojo coral
- Success states en verde esmeralda
```

### Loading Pattern
```
- Spinner con gradient dorado rotando
- Skeleton screens con shimmer effect
- Backdrop blur durante loading overlays
```

---

## 🌟 Iconografía

### Fuente de iconos
Lucide React (línea clean, moderna)

### Iconos principales
- `ShoppingCart` - Carrito
- `User` - Usuario/Login
- `Heart` - Favoritos
- `Search` - Búsqueda
- `Filter` - Filtros
- `Instagram` - Social
- `X` - Cerrar
- `Check` - Confirmación
- `ChevronDown/Up` - Navegación

### Estilo
- Stroke width: 1.5-2px
- Size: 16-24px típicamente
- Color: text-secondary por defecto, text o champagne en hover

---

## 📱 Responsive Design

### Breakpoints
```css
sm:  640px   /* Tablets pequeñas */
md:  768px   /* Tablets */
lg:  1024px  /* Desktop */
xl:  1280px  /* Desktop grande */
2xl: 1536px  /* Ultra wide */
```

### Mobile First Approach
- Diseño base para móvil
- Grid: 1 columna → 2 cols → 3 cols → 4 cols
- Typography scale down en mobile
- Touch targets: mínimo 44x44px
- Spacing reducido en mobile

---

## 🎨 Background System

### Body Background
```css
background-color: #0A0908;
background-image:
  radial-gradient(ellipse 80% 40% at 50% 0%, rgba(197, 160, 89, 0.14) 0%, transparent 70%),
  radial-gradient(circle at 85% 95%, rgba(228, 207, 160, 0.06) 0%, transparent 50%);
background-attachment: fixed;
```

### Hero Background
```css
position: relative;
overflow: hidden;

/* Orb decorativo superior */
.orb-top {
  position: absolute;
  top: 0; left: 50%;
  transform: translate(-50%, -50%);
  width: 288px; height: 288px;
  background: rgba(197, 160, 89, 0.18);
  filter: blur(80px);
  border-radius: 50%;
}

/* Orb decorativo lateral */
.orb-side {
  position: absolute;
  top: 40px; right: 40px;
  width: 160px; height: 160px;
  background: rgba(228, 207, 160, 0.1);
  filter: blur(60px);
  border-radius: 50%;
}
```

---

## 🛍️ E-commerce Specifics

### Product Image Presentation
- Fondo marfil "plinto" (multiply) para destacar productos
- Aspect ratio: 1:1 (square)
- Object fit: contain con padding
- Hover: scale 1.05, transition suave

### Pricing Display
```
┌─────────────────────────┐
│ Transferencia: $45.000  │ ← Método más económico
│ Efectivo: $50.000       │ ← Precio alternativo
└─────────────────────────┘

Con promoción:
┌─────────────────────────┐
│ Transferencia:          │
│   $65.000 → $45.000     │ ← Tachado + nuevo precio
│ Efectivo:               │
│   $72.000 → $50.000     │
└─────────────────────────┘
```

### Promotion Badge
```css
position: absolute;
top: 10px; right: 10px;
background: #C5A059;
color: #14100A;
padding: 4px 10px;
border-radius: 999px;
font-size: 11px;
font-weight: 600;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
```

### Cart Badge
```css
/* Contador en el ícono del carrito */
position: absolute;
top: -4px; right: -4px;
background: #EF4444;
color: white;
width: 18px; height: 18px;
border-radius: 50%;
font-size: 11px;
```

---

## 🎯 Brand Voice & Copy

### Tono
- **Profesional** pero accesible
- **Sofisticado** sin ser pretencioso
- **Informativo** y directo
- **Cálido** en el servicio al cliente

### Ejemplos de copy
```
Hero: "Perfumes árabes que dejan huella."
Apoyo: "Lattafa, Armaf, Al Haramain y más, con el precio en pesos siempre al día."
CTA: "Ver catálogo", "Comprar ahora", "Encontrá tu perfume"
Social: "@fraganzia.ar"
Location: "Envíos solo al AMBA"
```

### Uppercase Usage
- Tags de marca: ARMAF, LATTAFA, etc.
- Labels: TRANSFERENCIA, EFECTIVO
- Navigation items ocasionalmente
- Tracking amplio (0.15-0.25em)

---

## 🔧 Technical Stack

### Frontend
- **React 18.3.1** - Framework principal
- **Vite 5.4** - Build tool
- **React Router** - Navegación
- **Tailwind CSS 3** - Styling
- **Lucide React** - Iconos

### Backend
- **Firebase Firestore** - Base de datos
- **Firebase Auth** - Autenticación
- **Firebase Hosting** - Deploy

### State Management
- **React Context** - Cart, Auth
- **React Query** - Server state

---

## 🎨 Propuestas de Mejora (Sugerencias para Stitch)

### Áreas para explorar:
1. **Animaciones más ricas**: Parallax, micro-interactions, page transitions
2. **3D elements**: Modelos 3D de botellas con Three.js
3. **Video backgrounds**: Loops sutiles de texturas aromáticas
4. **Scroll experiences**: Scroll-triggered animations, horizontal scrolling
5. **Dark/Light mode**: Versión diurna con vidrio claro
6. **Ilustraciones custom**: Elementos árabes/orientales estilizados
7. **Gradientes animados**: Mesh gradients, gradient shifts
8. **Cursor customizado**: Efecto trail o glow siguiendo el mouse
9. **Partículas**: Sistema de partículas sutil como vapor
10. **Sound design**: Micro-sounds en interacciones clave

### Mantener:
- Superficies con transparencia sutil como base (sin abusar del blur)
- Paleta dorado/negro cálido como identidad (ver "Paleta de Colores")
- Profesionalismo y elegancia
- Fácil navegación y UX clara

### Experimentar:
- Layouts más audaces (grids asimétricos, overlaps)
- Tipografía más dramática en hero
- Filtros y efectos más creativos
- Storytelling visual más fuerte
- Elementos interactivos (filtros en vivo, AR try-on)

---

## 📦 Assets y Recursos

### Fuentes
- **Outfit** y **Manrope**: paquetes @fontsource, recortadas con `tools/subset-fonts.py`

### Iconos
- **Lucide React**: npm package

### Imágenes de productos
- Fondo claro uniforme
- Alta resolución
- PNG con transparencia o fondo blanco
- Aspect ratio: 1:1

---

## 📄 Deployment & URLs

- **Live Site**: https://fraganzia-e9b70.web.app
- **Instagram**: @fraganzia.ar
- **Admin Email**: benjuserra@gmail.com

---

**Fin del Design System**

*Este documento define completamente el sistema de diseño de Fraganzia. Utilízalo como base para generar propuestas de rediseño que respeten la identidad de marca mientras exploran nuevas direcciones creativas.*
