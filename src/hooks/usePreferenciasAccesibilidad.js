import { useCallback, useEffect, useState } from 'react';

const CLAVE = 'fraganzia:accesibilidad';

export const PREFERENCIAS_INICIALES = { texto: 0, contraste: false, movimiento: false, enlaces: false, lectura: false };

/** Pasa las preferencias a atributos de <html>; el CSS (index.css) hace el resto. */
export function aplicarPreferencias(p) {
  const el = document.documentElement;
  const poner = (nombre, valor) => (valor ? el.setAttribute(nombre, valor) : el.removeAttribute(nombre));
  poner('data-texto', p.texto ? String(p.texto) : '');
  poner('data-contraste', p.contraste ? 'alto' : '');
  poner('data-movimiento', p.movimiento ? 'reducido' : '');
  poner('data-enlaces', p.enlaces ? 'subrayados' : '');
  poner('data-lectura', p.lectura ? 'facil' : '');
}

function leer() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE) ?? 'null');
    return { ...PREFERENCIAS_INICIALES, ...(guardado && typeof guardado === 'object' ? guardado : {}) };
  } catch {
    return { ...PREFERENCIAS_INICIALES };
  }
}

/**
 * Preferencias de accesibilidad del visitante (tamaño de texto, alto contraste, menos movimiento,
 * enlaces subrayados, tipografía de lectura fácil). Se guardan en este navegador y se aplican
 * antes de pintar (script en index.html) para que la página no "salte".
 */
export function usePreferenciasAccesibilidad() {
  const [preferencias, setPreferencias] = useState(leer);

  useEffect(() => {
    aplicarPreferencias(preferencias);
    try {
      localStorage.setItem(CLAVE, JSON.stringify(preferencias));
    } catch {
      // Sin almacenamiento (modo privado): se aplican igual mientras dure la visita.
    }
  }, [preferencias]);

  const cambiar = useCallback((campo, valor) => setPreferencias((p) => ({ ...p, [campo]: valor })), []);
  const restablecer = useCallback(() => setPreferencias({ ...PREFERENCIAS_INICIALES }), []);
  return { preferencias, cambiar, restablecer };
}
