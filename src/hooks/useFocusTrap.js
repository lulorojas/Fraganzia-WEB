import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Comportamiento de diálogo modal para el elemento de `ref` mientras `activo`:
 * enfoca el primer campo (o el primer botón, o el panel), mantiene el foco
 * adentro con Tab / Shift+Tab, cierra con Escape, bloquea el scroll de fondo
 * y al cerrarse devuelve el foco a donde estaba.
 */
export function useFocusTrap(ref, activo, onCerrar, { enfocar = 'input, select, textarea' } = {}) {
  // En una ref para que el efecto no se re-ejecute (y robe el foco) cada vez
  // que el padre re-renderiza con una función onCerrar nueva.
  const onCerrarRef = useRef(onCerrar);
  onCerrarRef.current = onCerrar;

  useEffect(() => {
    if (!activo) return undefined;
    const previo = document.activeElement;
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const panel = ref.current;
    (panel?.querySelector(enfocar) ?? panel)?.focus({ preventScroll: true });

    function onKey(e) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCerrarRef.current();
        return;
      }
      if (e.key !== 'Tab' || !ref.current) return;
      const items = [...ref.current.querySelectorAll(FOCUSABLE)];
      if (!items.length) return;
      const primero = items[0];
      const ultimo = items[items.length - 1];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    }
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflowPrevio;
      previo?.focus?.({ preventScroll: true });
    };
  }, [ref, activo, enfocar]);
}
