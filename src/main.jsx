import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
// Fuentes servidas desde el propio sitio (antes venían de Google Fonts, que
// agregaba dos conexiones extra y bloqueaba el primer render).
import './assets/fonts/fonts.css';
import App from './App';
import './index.css';

const root = document.getElementById('root');
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);
// Las páginas públicas llegan pre-renderizadas (ver tools/prerender.mjs): si
// el #root ya tiene contenido, lo hidratamos en vez de tirarlo y volver a
// pintar todo de cero con createRoot.
if (root.hasChildNodes()) {
  hydrateRoot(root, app);
} else {
  createRoot(root).render(app);
}

