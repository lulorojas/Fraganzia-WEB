# Deploy desde cero

Cómo levantar Fraganzia en un proyecto de Firebase nuevo, paso a paso. Si el proyecto ya existe y solo querés publicar cambios, andá directo a [Publicar cambios](#publicar-cambios).

## 0. Requisitos

| Herramienta | Para qué | Cómo verificar |
|---|---|---|
| Node.js 20 o superior | Compilar la app | `node --version` |
| Git | Clonar y versionar | `git --version` |
| Cuenta de Google | Firebase | — |
| Google Chrome | Pre-render en el build (si no está, el build funciona igual pero sin pre-render) | — |
| Java 11+ (opcional) | Solo para `npm run test:rules` | `java -version` |

La CLI de Firebase no hace falta instalarla: los scripts usan `npx firebase-tools`.

## 1. Clonar e instalar

```bash
git clone https://github.com/lulorojas/Fraganzia-WEB.git
cd Fraganzia-WEB
npm install
```

## 2. Crear el proyecto de Firebase

En [console.firebase.google.com](https://console.firebase.google.com):

1. **Crear proyecto** (Google Analytics no es necesario).
2. **Authentication** → Comenzar → Método de acceso → habilitar **Correo electrónico/contraseña**.
   - En Configuración → Protección de enumeración de correo: dejala activada.
3. **Firestore Database** → Crear base de datos → modo **producción** → región `southamerica-east1` (São Paulo, la más cercana a Argentina). La región no se puede cambiar después.
4. **Hosting** → Comenzar (podés saltear los pasos de la CLI que muestra).
5. ⚙️ Configuración del proyecto → **Tus apps** → agregar app **Web** (`</>`). Copiá el objeto `firebaseConfig` que aparece.

## 3. Variables de entorno

```bash
cp .env.example .env.local
```

Completá `.env.local` con los valores del `firebaseConfig`:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Las variables de EmailJS y reCAPTCHA son opcionales (ver [paso 9](#9-opcional-emails-y-app-check)). `.env.local` está en `.gitignore` y nunca se sube.

## 4. Apuntar el repo a tu proyecto

Si tu proyecto **no** se llama `fraganzia-e9b70`, reemplazá ese id en:

- `firebase.json` → `hosting.site`
- `package.json` → scripts `deploy` y `deploy:rules` (`--project ...`)
- `.github/workflows/deploy.yml` → `projectId`

Y la URL pública (`https://fraganzia-e9b70.web.app`) en:

- `index.html` (canonical, Open Graph, JSON-LD)
- `src/hooks/useDocumentMeta.js` → `SITE_URL`
- `tools/generate-sitemap.mjs` → `SITE`
- `public/robots.txt` → línea `Sitemap:`

## 5. Reglas de seguridad e índices

```bash
npx firebase-tools login          # una sola vez, abre el navegador
npm run deploy:rules
```

Publica `firestore.rules` y `firestore.indexes.json`. Los índices tardan unos minutos en construirse (se ve en Firestore → Índices).

## 6. Crear el primer admin

Los admins no se pueden auto-asignar (la regla de `admins` no permite escrituras desde la web):

1. Authentication → Usuarios → **Agregar usuario** (email + contraseña).
2. Copiá su **UID**.
3. Firestore → Iniciar colección `admins` → ID del documento = **ese UID** → un campo cualquiera, por ejemplo `nombre: "Benja"` (string).

Para el panel financiero, creá también la colección `socios` con un documento por socio (IDs `luciano` y `benja`, que están en `src/constants/index.js`), con el campo `authUid` = UID de cada uno.

## 7. Configuración inicial

Firestore → colección `config` → documento `general`:

| Campo | Tipo | Ejemplo | Para qué |
|---|---|---|---|
| `whatsappNumero` | string | `5491130097370` | Número al que llegan los pedidos (solo dígitos, con 549) |
| `dolarBlueManual` | number (opcional) | `1350` | Si existe, se usa en vez de la cotización de dolarapi.com |

Después, entrá a `/login` con el usuario admin y cargá los perfumes desde **Panel Admin → Perfumes**.

## 8. Primer deploy

```bash
npm run deploy
```

Esto:

1. Compila la app (`vite build`).
2. Genera `dist/sitemap.xml`.
3. Pre-renderiza las páginas públicas con Chrome.
4. Publica `dist/` en Firebase Hosting.

La web queda en `https://<tu-proyecto>.web.app`.

## 9. (Opcional) Emails y App Check

### Emails con EmailJS

Seguí [`EMAILJS_SETUP.md`](../EMAILJS_SETUP.md), en especial la sección de seguridad, y completá `VITE_EMAILJS_*` en `.env.local` y en los secrets de GitHub. Sin esas variables la web funciona igual, solo que no envía emails.

### App Check (protección contra bots)

Hace que Firestore solo acepte pedidos que vengan de tu web, no de scripts.

1. Firebase → **App Check** → registrar la app web con **reCAPTCHA v3** → te da una *site key*.
2. Poné la key en `VITE_RECAPTCHA_SITE_KEY` (`.env.local` y secrets de GitHub) y deployá.
3. En App Check → APIs → Cloud Firestore, dejalo en **Supervisar** unos días y revisá que las solicitudes verificadas sean casi el 100 %.
4. Recién ahí, **Aplicar** (enforce).

Costo: carga el script de reCAPTCHA en cada visita (~150 KB), lo que baja algunos puntos en PageSpeed móvil. Conviene activarlo solo si aparecen pedidos falsos.

## 10. Deploy automático con GitHub Actions

Cada push a `main` compila y publica solo (`.github/workflows/deploy.yml`). Para que funcione, en GitHub → Settings → Secrets and variables → Actions, creá:

| Secret | Valor |
|---|---|
| `VITE_FIREBASE_API_KEY` … `VITE_FIREBASE_APP_ID` | Los mismos 6 valores de `.env.local` |
| `FIREBASE_SERVICE_ACCOUNT` | JSON de una cuenta de servicio con rol *Firebase Hosting Admin*. La forma más simple: `npx firebase-tools init hosting:github`, que lo crea y lo carga solo |
| `VITE_EMAILJS_*`, `VITE_RECAPTCHA_SITE_KEY` | Opcionales |

⚠️ El workflow publica **solo el hosting**. Si cambiás `firestore.rules`, tenés que correr `npm run deploy:rules` a mano.

## 11. Endurecer la API key (recomendado)

La API key web de Firebase es pública por diseño, pero conviene limitar desde dónde se usa:

Google Cloud Console → APIs y servicios → Credenciales → la *Browser key* del proyecto → **Restricciones de aplicaciones: sitios web** →

```
https://<tu-proyecto>.web.app/*
https://<tu-proyecto>.firebaseapp.com/*
http://localhost:5173/*
```

(más tu dominio propio si lo tenés). Los scripts de build (`tools/`) leen Firestore por REST con esta key: si los corrés fuera de esos dominios y falla el sitemap o el pre-render, el build sigue igual, solo sin esos extras.

## 12. Dominio propio (opcional)

Hosting → **Agregar dominio personalizado** y seguí los pasos de DNS. Después actualizá la URL pública en los 4 archivos del [paso 4](#4-apuntar-el-repo-a-tu-proyecto).

---

## Publicar cambios

| Cambio | Comando |
|---|---|
| Código de la web | `git push` a `main` (deploy automático) o `npm run deploy` |
| Reglas o índices de Firestore | `npm run test:rules` y después `npm run deploy:rules` |
| Probar antes de publicar | `npm run build && npx firebase-tools hosting:channel:deploy prueba` (URL temporal de 7 días) |

## Problemas comunes

| Síntoma | Causa probable |
|---|---|
| "Missing or insufficient permissions" al entrar al admin | Falta el documento `admins/{uid}` o el UID no coincide |
| El build dice `prerender: no se encontró Chrome` | Definí `CHROME_PATH` con la ruta a Chrome. Sin pre-render la web funciona, solo carga más lento |
| El build dice `sitemap: sin perfumes` | Faltan variables `VITE_FIREBASE_*` o la API key está restringida para ese entorno |
| Los precios dicen "Precio no disponible" | dolarapi.com no responde y no hay `dolarBlueManual` en `config/general` |
| Un pedido falla con "Hubo un error…" | Revisá que las reglas nuevas estén publicadas (`npm run deploy:rules`) |
