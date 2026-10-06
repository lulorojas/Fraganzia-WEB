import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

// El chat se descarga recién la primera vez que alguien lo abre.
const PanelAsistente = lazy(() => import('./PanelAsistente'));

const EVENTO_ABRIR = 'fraganzia:abrir-asistente';

/** Abre el asistente desde cualquier parte de la app (por ejemplo, un estado vacío). */
export function abrirAsistente() {
  window.dispatchEvent(new Event(EVENTO_ABRIR));
}

/** Botón flotante (abajo a la derecha) que abre el asistente para elegir perfume. */
export function BotonAsistente() {
  const [abierto, setAbierto] = useState(false);
  const [cargado, setCargado] = useState(false);
  const botonRef = useRef(null);
  const { pathname } = useLocation();

  // En el detalle de producto la barra de compra queda pegada abajo en mobile:
  // el botón se sube para no taparla.
  const subir = pathname.startsWith('/perfume/');

  function abrir() {
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
    requestAnimationFrame(() => botonRef.current?.focus());
  }, []);

  return (
    <>
      <button
        ref={botonRef}
        type="button"
        onClick={abrir}
        aria-haspopup="dialog"
        aria-expanded={abierto}
        className={`fixed right-4 z-40 flex h-14 items-center gap-2 rounded-full bg-gradient-to-br from-violet to-violet-light px-4 font-body text-sm font-semibold text-white shadow-lg shadow-violet/40 ring-1 ring-white/10 transition-transform duration-200 hover:scale-105 active:scale-95 sm:right-6 md:hidden ${
          subir ? 'bottom-24' : 'bottom-5'
        } ${abierto ? 'hidden' : ''}`}
      >
        <Sparkles size={20} aria-hidden="true" />
        <span className="hidden sm:inline">Encontrá tu perfume</span>
        <span className="sr-only sm:hidden">Abrir asistente para elegir perfume</span>
      </button>

      {cargado && (
        <Suspense fallback={null}>
          <PanelAsistente abierto={abierto} onCerrar={cerrar} subir={subir} />
        </Suspense>
      )}
    </>
  );
}
