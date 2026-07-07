# Fraganzia WEB 🌸

Tienda online de perfumes/fragancias construida con **React + Vite**, estilizada con **Tailwind CSS** y respaldada por **Firebase** (Authentication, Firestore y Hosting).

## ✨ Características

- 🛍️ Catálogo de productos
- 🛒 Carrito de compras
- 👤 Autenticación de usuarios (Firebase Auth)
- ⚙️ Panel de administración
- 📄 Formularios validados con React Hook Form + Zod
- 🎨 Animaciones con Framer Motion
- ⚡ Manejo de estado de servidor con TanStack React Query

## 🛠️ Stack técnico

| Categoría | Tecnología |
|---|---|
| Frontend | React 18, Vite 5 |
| Estilos | Tailwind CSS, PostCSS |
| Backend / Datos | Firebase (Auth, Firestore, Hosting) |
| Formularios | React Hook Form + Zod |
| Data fetching | TanStack React Query |
| Ruteo | React Router DOM |
| Animaciones | Framer Motion |
| Íconos | Lucide React |
| Metodología de desarrollo | [Spec Kit](https://github.com/github/spec-kit) (spec-driven development) |

## 📋 Requisitos previos

- [Node.js](https://nodejs.org/) 18 o superior
- [npm](https://www.npmjs.com/)
- Una cuenta de [Firebase](https://console.firebase.google.com/) con un proyecto creado
- [Firebase CLI](https://firebase.google.com/docs/cli) (`npm install -g firebase-tools`) si vas a deployar

## 🚀 Instalación

1. Cloná el repositorio:
   ```bash
   git clone https://github.com/lulorojas/Fraganzia-WEB.git
   cd Fraganzia-WEB
   ```

2. Instalá las dependencias:
   ```bash
   npm install
   ```

3. Configurá las variables de entorno. Copiá el archivo de ejemplo y completá tus credenciales de Firebase:
   ```bash
   cp .env.example .env
   ```

   Completá `.env` con los datos de tu proyecto Firebase (Consola → ⚙️ Configuración del proyecto → Tus apps → configuración del SDK):
   ```env
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_STORAGE_BUCKET=
   VITE_FIREBASE_MESSAGING_SENDER_ID=
   VITE_FIREBASE_APP_ID=
   ```

4. Iniciá el servidor de desarrollo:
   ```bash
   npm run dev
   ```

   La app va a estar disponible en `http://localhost:5173`.

## 📦 Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Levanta el servidor de desarrollo con hot-reload |
| `npm run build` | Genera el build de producción en `dist/` |
| `npm run preview` | Sirve localmente el build de producción para probarlo |

## 🔥 Firebase

Este proyecto usa tres servicios de Firebase:

- **Authentication**: gestión de usuarios (login, registro).
- **Firestore**: base de datos de productos, pedidos y usuarios. Las reglas de seguridad están en [`firestore.rules`](./firestore.rules) y los índices en [`firestore.indexes.json`](./firestore.indexes.json).
- **Hosting**: despliegue del sitio estático, configurado en [`firebase.json`](./firebase.json).

### Deploy manual

```bash
npm run build
firebase deploy
```

O por partes:
```bash
firebase deploy --only hosting
firebase deploy --only firestore:rules
```

## 📁 Estructura del proyecto

```
Fraganzia-WEB/
├── .claude/skills/       # Skills de Claude Code
├── .specify/             # Configuración de Spec Kit (constitution, templates)
├── specs/                # Especificaciones de features (spec-driven development)
│   └── 001-catalogo-carrito-admin/
├── scripts/               # Scripts auxiliares
├── src/                   # Código fuente de la app React
├── firebase.json          # Configuración de Firebase Hosting
├── firestore.rules        # Reglas de seguridad de Firestore
├── firestore.indexes.json # Índices de Firestore
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## 🧭 Metodología de desarrollo

Este proyecto sigue **spec-driven development** con [Spec Kit](https://github.com/github/spec-kit): cada feature se define primero como especificación (`specs/<feature>/spec.md`), luego se planifica (`plan.md`, `research.md`, `data-model.md`, `quickstart.md`) y recién después se implementa, todo guiado por Claude Code.

## 🤝 Contribuir

1. Hacé un fork del proyecto
2. Creá tu rama de feature (`git checkout -b feature/nueva-funcionalidad`)
3. Hacé commit de tus cambios (`git commit -m 'Agrega nueva funcionalidad'`)
4. Pusheá la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrí un Pull Request

## 📄 Licencia

Este proyecto no especifica licencia actualmente. Todos los derechos reservados salvo indicación contraria.
