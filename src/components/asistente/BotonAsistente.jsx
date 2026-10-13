import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

// El chat se descarga recién la primera vez que alguien lo abre.
const PanelAsistente = lazy(() => import('./PanelAsistente'));

const EVENTO_ABRIR = 'fraganzia:abrir-asistente';

/** Abre el asistente desde cualquier parte de la app (por ejemplo, un estado vacío). */
export function abrirAsistente() {
  window.dispatchEvent(new Event(EVENTO_ABRIR));
}

/**
 * Monta el asistente para elegir perfume y lo abre cuando alguien llama a
 * abrirAsistente() (botón del encabezado, portada, catálogo, estados vacíos).
 * Antes había además un botón flotante: duplicaba al del encabezado y en la
 * ficha tapaba el precio, así que se sacó.
 */
export function BotonAsistente() {
  const [abierto, setAbierto] = useState(false);
  const [cargado, setCargado] = useState(false);
  const focoPrevioRef = useRef(null);
  const { pathname } = useLocation();

  // En el detalle de producto la barra de compra queda pegada abajo en mobile:
  // el botón se sube para no taparla.
  const subir = pathname.startsWith('/perfume/');

  function abrir() {
    focoPrevioRef.current = document.activeElement;
    setCargado(true);
    setAbierto(true);
  }

  useEffect(() => {
    window.addEventListener(EVENTO_ABRIR, abrir);
    return () => window.removeEventListener(EVENTO_ABRIR, abrir);
  }, []);

  // Al cerrar, el foco vuelve al botón (teclado y lectores de pantalla).
  const cerrar = useCallback(() => {
    setAbierto(false);
    requestAnimationFrame(() => focoPrevioRef.current?.focus?.());
  }, []);

  return (
    <>
      {cargado && (
        <Suspense fallback={null}>
          <PanelAsistente abierto={abierto} onCerrar={cerrar} subir={subir} />
        </Suspense>
      )}
    </>
  );
}
