/**
 * true si `clave` ya se registró en esta sesión del navegador; si no, la marca
 * y devuelve false. Sirve para contar un evento (vista, búsqueda) una sola vez
 * por sesión. Si el storage no está disponible (incógnito, bloqueado), se
 * registra igual.
 */
export function yaRegistradoEnSesion(clave) {
  try {
    if (sessionStorage.getItem(clave)) return true;
    sessionStorage.setItem(clave, '1');
    return false;
  } catch {
    return false;
  }
}
