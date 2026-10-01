# Tareas manuales y guía de lectura

Este documento junta **todo lo que hay que hacer a mano**: lo que no se puede automatizar desde el código porque pasa en consolas externas (Firebase, Google Cloud, EmailJS, GitHub), en el panel admin o en la PC de cada socio. También indica **qué leer, y en qué orden**, para entender el proyecto.

Marcá cada casilla a medida que lo hacés: `[ ]` → `[x]`.

---

## 1. Urgente: hacelo esta semana

### [ ] Avisarle a tu socio (lulorojas) que actualice su copia del repo
El 30/09 se movieron fuera del repo la carpeta `scripts/` (1.314 archivos), los PDFs de proveedores, las capturas y los `.bat`.

- **Qué pasa cuando hace `git pull`:** esos archivos **se borran de su carpeta**, porque git los saca de la copia local.
- **Si necesita alguno:** el archivo completo está en la PC de Benja, en `Desktop/Fraganzia/Fraganzia-archivo/`, sincronizado por OneDrive. Compartile esa carpeta si la necesita.
- **Pasos para él:**
  1. Si tiene cambios sin commitear, primero `git stash`.
  2. Correr `git pull origin main`.
  3. Correr `npm install` (cambiaron las dependencias).
  4. Revisar el [README](../README.md): el deploy ahora es `npm run deploy` y los `.bat` ya no existen.

### [ ] Cargar fotos que faltan o están rotas
Panel admin → **Perfumes** → editar → campo **Imágenes**.

| Perfume | Problema |
|---|---|
| Al Wataniah Al Layl 100ml | La foto original (en shopify) ya no existe |
| Lattafa Liam Blue Shine 100ml | La foto original (en parfumo.com) ya no existe |
| Lattafa Yara Rosa 100ml | No tiene foto cargada |

Hoy la web muestra un placeholder en lugar de la foto. Después de cargar la foto nueva, el próximo deploy la descarga y la optimiza sola.

### [ ] Sacar la credencial de admin de OneDrive
`Fraganzia-WEB/tools/serviceAccount.json` es la llave de administrador de Firestore: da acceso total a la base. git la ignora, pero **OneDrive la sincroniza a la nube**.

1. Movela a una carpeta que no se sincronice, por ejemplo `C:\credenciales\fraganzia-serviceAccount.json`.
2. Los scripts de `tools/` que la usan (`export-current-catalog.mjs`, `cache-precios-ars.mjs`) la buscan al lado del script. Si los vas a usar, copiala ahí solo mientras los corrés y después borrala.
3. Opcional, más seguro: en Firebase → Configuración del proyecto → **Cuentas de servicio**, generá una clave nueva y **revocá la vieja** desde Google Cloud → IAM → Cuentas de servicio → Claves.

---

## 2. Seguridad: recomendado

### [ ] Restringir la API key por dominio
Google Cloud Console → proyecto `fraganzia-e9b70` → **APIs y servicios → Credenciales** → la clave tipo *Browser key*.

En **Restricciones de aplicaciones**, elegí **Sitios web** y agregá:

```
https://fraganzia-e9b70.web.app/*
https://fraganzia-e9b70.firebaseapp.com/*
https://fraganzia-e9b70--*.web.app/*
http://localhost:5173/*
http://localhost:4173/*
```

La tercera línea cubre los canales de vista previa.

⚠️ El build (sitemap, pre-render y fotos) lee Firestore por REST con esta misma key **desde GitHub Actions**, sin dominio. Si después de restringirla el build dice `sin foto de datos` o `sin perfumes`, la web sigue funcionando pero sin pre-render. Solución: crear una **segunda key** solo para el build, restringida por API (Cloud Firestore API), cargarla como secret `VITE_FIREBASE_API_KEY_BUILD` y avisame para usarla en los scripts.

### [ ] Revisar la configuración de Firebase Authentication
Firebase → Authentication → **Configuración**:
- **Protección de enumeración de correo electrónico:** activada. Evita que alguien averigüe qué emails tienen cuenta.
- **Creación de cuentas:** hoy cualquiera puede registrarse desde el ícono de usuario (cuentas de cliente). Si no se usan, se puede desactivar el registro. Las cuentas de cliente nunca tienen acceso al admin.

### [ ] (Opcional) Activar App Check si aparecen pedidos falsos
Las reglas ya validan los pedidos, pero no pueden distinguir un bot de una persona. Si ves pedidos basura en el admin, seguí [DEPLOY.md → App Check](DEPLOY.md#app-check-protección-contra-bots). Cuesta algunos puntos de PageSpeed en móvil.

---

## 3. Emails (si querés recibir avisos por email)

Hoy **no se envía ningún email**: la configuración tenía una clave de ejemplo. Los avisos de pedido llegan igual por WhatsApp.

### [ ] Configurar EmailJS o descartarlo
Seguí [EMAILJS_SETUP.md](../EMAILJS_SETUP.md), en especial la sección **Seguridad**:
1. En las plantillas de avisos al admin, poné tu email **fijo** en "To Email". No uses `{{to_email}}`.
2. En EmailJS → Account → Security, restringí los dominios a `fraganzia-e9b70.web.app`.
3. Cargá las claves en `.env.local` y como **secrets de GitHub**: `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_PUBLIC_KEY`, `VITE_EMAILJS_ADMIN_EMAIL`. Ver [DEPLOY.md → paso 10](DEPLOY.md#10-deploy-automático-con-github-actions).

---

## 4. Catálogo y contenido (panel admin)

### [ ] Cargar notas olfativas
Ningún perfume tiene notas cargadas, así que la **pirámide olfativa** de la ficha de producto no aparece.

Panel admin → Perfumes → editar → *Notas de salida / corazón / fondo* (separadas por coma). Conviene empezar por los **destacados** y los **más vistos** (Dashboard → "Perfumes más vistos").

### [ ] Completar descripciones faltantes
79 de los 405 perfumes publicados no tienen descripción. Además de mostrarse en la ficha, la descripción mejora el SEO y las recomendaciones del asistente, que busca palabras como "vainilla" u "oud".

### [ ] (Opcional) Limpiar estadísticas de prueba
Durante las pruebas del 30/09 se sumaron unas 15 vistas falsas a **Lattafa Atlas Canyon 55ml** y algunas a la home. Si te molesta en el dashboard: Firebase → Firestore → `estadisticas` → documento `00WxVBQoLMLZgqU6lX7R` → bajá `vistas` en ~15.

---

## 5. SEO y medición

### [ ] Dar de alta el sitio en Google Search Console
1. [search.google.com/search-console](https://search.google.com/search-console) → agregar propiedad → **Prefijo de URL** → `https://fraganzia-e9b70.web.app/`.
2. Verificá con la opción **Etiqueta HTML** y pasame el código: lo agrego en `index.html`.
3. En **Sitemaps**, enviá `sitemap.xml`.

Así Google indexa los ~400 perfumes y podés ver qué buscan los que llegan a la web.

### [ ] Medir en PageSpeed Insights (producción)
[pagespeed.web.dev](https://pagespeed.web.dev) con `/`, `/catalogo` y algún `/perfume/...`.

En las pruebas locales dio: móvil 81-92, escritorio 94-98, y accesibilidad, buenas prácticas y SEO en 100. PageSpeed varía ±5 puntos entre corridas.

### [ ] (Opcional) Dominio propio
Si compran por ejemplo `fraganzia.com.ar`, seguí [DEPLOY.md → paso 12](DEPLOY.md#12-dominio-propio-opcional) y avisame: hay que cambiar la URL en 4 archivos.

---

## 6. Mantenimiento del repo (opcional, coordinarlo entre los dos)

### [ ] Actualizar el repo "padre" (`Fraganzia/`)
La carpeta `Desktop/Fraganzia/Fraganzia` es otro repo (`lulorojas/Fraganzia`) que contiene a `Fraganzia-WEB` como *gitlink*, un puntero a un commit viejo. Además tiene `SKILL.md` (plantilla vacía de `npx skills init`) y las skills instaladas en `.agents/`, sin commitear. Decidan si ese repo se sigue usando. Si no, no hace falta tocar nada.

### [ ] Achicar el historial de git (318 MB)
Los archivos archivados siguen en el historial, así que clonar el repo baja 318 MB. Se puede limpiar con `git filter-repo`, pero **reescribe el historial**: los dos tienen que volver a clonar y hay que hacer force push. Solo vale la pena si molesta.

### [ ] (Opcional) Actualizar dependencias grandes
React Router 6 → 7 tiene un aviso de seguridad que **no afecta** a esta web (no hay redirecciones con URLs del usuario). Firebase 10 → 12 suma mejoras. Las dos actualizaciones requieren probar el admin a fondo: mejor hacerlas en una rama y con vista previa.

---

## 📚 Qué leer para entender el proyecto

En este orden:

| # | Documento | Para qué | Tiempo |
|---|---|---|---|
| 1 | [README.md](../README.md) | Qué es, cómo levantarlo y los comandos | 2 min |
| 2 | [docs/ESTRUCTURA.md](ESTRUCTURA.md) | Carpetas, cómo viajan los datos, colecciones de Firestore y "¿dónde toco si quiero…?" | 10 min |
| 3 | [docs/TECNOLOGIAS.md](TECNOLOGIAS.md) | Qué se usa, para qué y por qué (React, Firebase, pre-render…) | 10 min |
| 4 | [docs/DEPLOY.md](DEPLOY.md) | Cómo se publica: desde cero, automático con GitHub y problemas comunes | 10 min |
| 5 | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) | Colores, tipografías, niveles de vidrio y componentes, antes de tocar algo visual | 15 min |
| 6 | [`firestore.rules`](../firestore.rules) | Quién puede leer y escribir cada cosa (está comentado), antes de tocar la base | 10 min |
| 7 | [EMAILJS_SETUP.md](../EMAILJS_SETUP.md) | Solo si vas a configurar los emails | 5 min |
| 8 | [`specs/`](../specs) | Especificaciones originales de cada módulo (catálogo, panel financiero): el *por qué* de cada decisión de negocio | a demanda |
| 9 | Este documento | Lo que queda pendiente a mano | — |

**Para entender el código**, seguí el camino de un dato:

1. **Rutas:** `src/router/AppRouter.jsx`, todas las páginas que existen.
2. **Página:** `src/pages/Catalogo.jsx`, cómo una página pide datos y los muestra.
3. **Hook:** `src/hooks/usePerfumes.js`, la caché con React Query.
4. **Servicio:** `src/services/perfumesService.js`, la lectura de Firestore.
5. **Build:** `tools/prerender.mjs`, cómo se arma el HTML para que cargue rápido.
