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

### Colores Primarios
```css
/* Fondos */
--color-bg: #06040D              /* Negro profundo con tinte violeta */

/* Acentos principales */
--color-violet: #7B2FBE          /* Violeta real - color principal */
--color-violet-light: #9B59D0    /* Violeta claro - hover states */
--color-lila-accent: #C084FC     /* Lila brillante - highlights */

/* Texto */
--color-text: #F8F4FF            /* Blanco lavanda - texto principal */
--color-text-secondary: #9A90B8  /* Gris violeta - texto secundario */
```

### Colores Funcionales
```css
/* Estados */
--color-success: #10B981         /* Verde esmeralda - éxito */
--color-error: #EF4444           /* Rojo coral - error */

/* Bordes y efectos */
--color-border: rgba(147, 51, 234, 0.18)  /* Borde sutil violeta */
--color-glow: rgba(139, 51, 208, 0.4)     /* Glow effect violeta */
```

### Contexto de uso
- **Fondos oscuros**: Crean atmósfera premium y destacan los productos
- **Violeta como protagonista**: Asociado con lujo, realeza y misterio
- **Lila para acentos**: Añade sofisticación y modernidad
- **Blanco lavanda**: Suaviza el contraste, más elegante que blanco puro

---

## ✨ Glassmorphism System

### Concepto
Interfaz basada en **glassmorphism** (morfismo de vidrio) que crea:
- Sensación de profundidad y capas
- Estética moderna y premium
- Efecto de "vidrio esmerilado" con blur
- Transparencias sutiles que permiten ver el fondo

### Variantes de Glass

#### 1. Glass Subtle (Sutil)
```css
.glass-subtle {
  background: rgba(255, 255, 255, 0.015);
  backdrop-filter: blur(12px) saturate(150%);
  border: 1px solid rgba(147, 51, 234, 0.1);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}
```
**Uso**: Fondos secundarios, elementos de UI menos prominentes

#### 2. Glass (Base)
```css
.glass {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(147, 51, 234, 0.18);
  border-radius: 16px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.37),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
```
**Uso**: Cards de productos, formularios, contenedores principales

#### 3. Glass Medium (Medio)
```css
.glass-medium {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px) saturate(190%);
  border: 1px solid rgba(147, 51, 234, 0.2);
  border-radius: 16px;
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
```
**Uso**: Modales, paneles destacados, elementos interactivos importantes

#### 4. Glass Strong (Fuerte)
```css
.glass-strong {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(24px) saturate(200%);
  border: 1px solid rgba(147, 51, 234, 0.3);
  border-radius: 20px;
  box-shadow: 
    0 16px 48px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 0 0 1px rgba(139, 51, 208, 0.1);
}
```
**Uso**: Headers, hero sections, CTAs principales

#### 5. Glass Frosted (Helado)
```css
.glass-frosted {
  background: rgba(16, 13, 32, 0.75);
  backdrop-filter: blur(32px) saturate(200%) brightness(1.1);
  border: 1px solid rgba(192, 132, 252, 0.25);
  border-radius: 20px;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 0 0 1px rgba(192, 132, 252, 0.15);
}
```
**Uso**: Overlays, dropdowns, tooltips, elementos flotantes

### Efectos Interactivos

#### Glass Hover
```css
.glass-hover:hover {
  background: rgba(139, 51, 208, 0.08);
  border-color: rgba(192, 132, 252, 0.4);
  box-shadow: 
    0 12px 40px rgba(123, 47, 190, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 0 40px rgba(139, 51, 208, 0.2);
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

#### 1. Outfit (Display/Headings)
```css
font-family: 'Outfit', sans-serif;
```
- **Uso**: Títulos, headings, nombres de marca
- **Características**: Geométrica, moderna, limpia
- **Pesos**: 400, 500, 600, 700

#### 2. Manrope (Body)
```css
font-family: 'Manrope', sans-serif;
```
- **Uso**: Cuerpo de texto, descripciones, UI
- **Características**: Humanista, legible, profesional
- **Pesos**: 400, 500, 600, 700

#### 3. Cinzel (Luxury/Display)
```css
font-family: 'Cinzel', serif;
font-style: italic;
letter-spacing: 0.25em;
```
- **Uso**: Taglines, subtítulos especiales, elementos decorativos
- **Características**: Serif elegante, inspirada en inscripciones romanas
- **Efecto**: Agrega sensación de lujo y tradición

### Jerarquía tipográfica

```css
/* Hero Title */
font-size: 48-64px (3-4rem)
font-family: Outfit
font-weight: 700
letter-spacing: -0.02em

/* Section Heading */
font-size: 32-40px (2-2.5rem)
font-family: Outfit
font-weight: 600

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

/* Luxury Tagline */
font-size: 20-24px (1.25-1.5rem)
font-family: Cinzel
font-style: italic
letter-spacing: 0.25em
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
│   [Imagen producto]     │ ← Fondo claro (#F5F2FB)
│                         │
│   Badge -30%            │ ← Promoción (si aplica)
└─────────────────────────┘
┌─────────────────────────┐
│ ARMAF                   │ ← Marca (uppercase, lila)
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
- Background oscuro `#100d20` con glassmorphism
- Imagen con fondo claro para destacar el producto
- Hover: elevación, borde violeta brillante, sombra con glow
- Border radius: 16px
- Transición suave 300ms

### 2. Button Variants

#### Primary (Gradient Violet)
```css
background: linear-gradient(135deg, #7B2FBE, #9B59D0);
color: #F8F4FF;
box-shadow: 0 4px 12px rgba(123, 47, 190, 0.3);
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

### 5. Hero Section
```
- Fondo con gradientes radiales decorativos
- Logo grande centrado
- Tagline en Cinzel italic
- Uppercase labels con tracking amplio
- CTAs con gradient y glow
- Divider ornamental (líneas + símbolo ✦)
```

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
box-shadow: 0 0 40px rgba(139, 51, 208, 0.3);
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
   - shadow con glow violeta
   - scale(1.02) en imagen interior
   - transition 300ms smooth
```

### Form Pattern
```
- Glass background
- Inputs con border sutil
- Focus: border violeta + glow
- Labels floating o top-aligned
- Error states en rojo coral
- Success states en verde esmeralda
```

### Loading Pattern
```
- Spinner con gradient violeta rotando
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
- Color: text-secondary por defecto, text o lila en hover

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
background-color: #06040D;
background-image:
  radial-gradient(ellipse 80% 40% at 50% 0%, rgba(90, 20, 160, 0.18) 0%, transparent 70%),
  radial-gradient(circle at 85% 95%, rgba(192, 132, 252, 0.08) 0%, transparent 50%);
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
  background: rgba(90, 20, 160, 0.2);
  filter: blur(80px);
  border-radius: 50%;
}

/* Orb decorativo lateral */
.orb-side {
  position: absolute;
  top: 40px; right: 40px;
  width: 160px; height: 160px;
  background: rgba(192, 132, 252, 0.1);
  filter: blur(60px);
  border-radius: 50%;
}
```

---

## 🛍️ E-commerce Specifics

### Product Image Presentation
- Background claro `#F5F2FB` para destacar productos
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
background: #7B2FBE;
color: white;
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
Hero: "Venta de perfumes árabes"
Tagline: "fragancias importadas"
CTA: "Ver Catálogo", "Explorar", "Descubrir"
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
- Sistema de glassmorphism como concepto base
- Paleta violeta/lila como identidad
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
- **Outfit**: Google Fonts
- **Manrope**: Google Fonts  
- **Cinzel**: Google Fonts

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
