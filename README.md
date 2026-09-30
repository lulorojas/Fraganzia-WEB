# Fraganzia WEB 🌸

Tienda online de perfumes árabes: catálogo con precios en pesos actualizados según el dólar blue, carrito, pedidos por WhatsApp y un panel interno de administración y finanzas para los socios.

**En vivo:** https://fraganzia-e9b70.web.app

## Documentación

| Documento | Contenido |
|---|---|
| [📁 Estructura](docs/ESTRUCTURA.md) | Qué hay en cada carpeta, cómo fluyen los datos y dónde tocar para cada cambio |
| [🚀 Deploy desde cero](docs/DEPLOY.md) | Crear el proyecto de Firebase, configurar, publicar y automatizar |
| [🧰 Tecnologías](docs/TECNOLOGIAS.md) | Qué se usa, para qué y por qué |
| [🎨 Design system](DESIGN_SYSTEM.md) | Colores, tipografías y componentes visuales |
| [✉️ EmailJS](EMAILJS_SETUP.md) | Configurar los avisos por email (opcional) |

## Arranque rápido

```bash
npm install
cp .env.example .env.local   # completar con la config de Firebase
npm run dev                  # http://localhost:5173
```

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga instantánea |
| `npm run build` | Build de producción en `dist/` (incluye sitemap y pre-render) |
| `npm run preview` | Sirve el build localmente |
| `npm run deploy` | Build y publicación en Firebase Hosting |
| `npm run deploy:rules` | Publica las reglas e índices de Firestore |
| `npm run test:rules` | Prueba las reglas de Firestore en el emulador (requiere Java) |

Cada push a `main` se publica automáticamente con GitHub Actions (solo hosting; las reglas se publican con `npm run deploy:rules`).

## Stack

React 18 · Vite 5 · Tailwind CSS · React Router · TanStack Query · React Hook Form + Zod · Firebase (Auth, Firestore, Hosting)

## Metodología

El proyecto sigue *spec-driven development* con [Spec Kit](https://github.com/github/spec-kit): cada feature se especifica en `specs/<feature>/` (spec, plan, tareas) antes de implementarse.

## Licencia

Sin licencia especificada: todos los derechos reservados.
