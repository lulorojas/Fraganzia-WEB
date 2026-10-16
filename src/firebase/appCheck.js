import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// Solo se incluye en el build si VITE_RECAPTCHA_SITE_KEY está definida (ver
// el alias en vite.config.js); si no, se usa appCheck.off.js y el SDK de App
// Check no suma peso al bundle.
export function activarAppCheck(app) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true,
  });
}
