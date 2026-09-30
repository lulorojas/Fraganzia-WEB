import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Fuentes servidas desde el propio sitio (antes venían de Google Fonts, que
// agregaba dos conexiones extra y bloqueaba el primer render).
import './assets/fonts/fonts.css';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
