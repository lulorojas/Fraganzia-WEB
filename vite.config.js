import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Ajustes a index.html para el primer pintado:
 *  - mete el CSS principal en un <style> en vez de un <link>: el navegador
 *    pinta apenas llega el HTML, sin esperar otra descarga (en 4G lento eran
 *    ~700 ms). Son ~11 KB con gzip; la CSP ya permite estilos inline.
 *  - baja la prioridad de los scripts (ver abajo).
 */
function optimizarHtml() {
  return {
    name: 'optimizar-html',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const html = bundle['index.html'];
      if (!html || html.type !== 'asset') return;
      let source = String(html.source);
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (!fileName.endsWith('.css') || chunk.type !== 'asset') continue;
        const link = `<link rel="stylesheet" crossorigin href="/${fileName}">`;
        if (!source.includes(link)) continue;
        source = source.replace(link, () => `<style>${chunk.source}</style>`);
        delete bundle[fileName];
      }
      // El HTML ya llega pre-renderizado (tools/prerender.mjs): el JS no es
      // necesario para el primer pintado, así que baja a prioridad baja y no
      // compite con el HTML, las fuentes y la imagen principal.
      source = source
        .replace(/<script type="module" crossorigin/g, '<script type="module" fetchpriority="low" crossorigin')
        .replace(/<link rel="modulepreload" crossorigin/g, '<link rel="modulepreload" fetchpriority="low" crossorigin');
      html.source = source;
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd()), ...process.env };
  // App Check solo entra al bundle si hay site key de reCAPTCHA configurada.
  const appCheckModule = env.VITE_RECAPTCHA_SITE_KEY ? 'appCheck.js' : 'appCheck.off.js';

  return {
    plugins: [react(), optimizarHtml()],
    resolve: {
      alias: {
        '@app-check': fileURLToPath(new URL(`./src/firebase/${appCheckModule}`, import.meta.url)),
      },
    },
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
        format: {
          comments: false,
        },
      },
      rollupOptions: {
        output: {
          // framer-motion ya no va en un chunk propio: solo lo usan el modal de
          // login (lazy) y el admin, así Vite no lo precarga en la home.
          manualChunks: {
            firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            vendor: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
          },
        },
      },
    },
  };
});
