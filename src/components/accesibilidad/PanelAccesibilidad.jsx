import { useId, useRef, useState } from 'react';
import { Accessibility, X } from 'lucide-react';
import { usePreferenciasAccesibilidad } from '../../hooks/usePreferenciasAccesibilidad';
import { useFocusTrap } from '../../hooks/useFocusTrap';

const TAMANOS = [
  { valor: 0, etiqueta: 'Normal' },
  { valor: 1, etiqueta: 'Grande' },
  { valor: 2, etiqueta: 'Muy grande' },
];

const OPCIONES = [
  { campo: 'contraste', titulo: 'Alto contraste', detalle: 'Textos y bordes más claros sobre el fondo oscuro.' },
  { campo: 'movimiento', titulo: 'Reducir movimiento', detalle: 'Sin animaciones ni desplazamientos suaves.' },
  { campo: 'enlaces', titulo: 'Subrayar enlaces', detalle: 'Los enlaces se distinguen sin depender del color.' },
  { campo: 'lectura', titulo: 'Letra de lectura fácil', detalle: 'Tipografía simple con más espacio entre letras y líneas.' },
];

function Interruptor({ checked, onChange, titulo, detalle }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <p id={`${id}-t`} className="font-body text-[15px] font-semibold text-text">{titulo}</p>
        <p id={`${id}-d`} className="mt-0.5 font-body text-[13px] text-text-secondary">{detalle}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-t`}
        aria-describedby={`${id}-d`}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full border transition-colors ${checked ? 'border-violet bg-violet' : 'border-border bg-white/10'}`}
      >
        <span aria-hidden="true" className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${checked ? 'left-[26px]' : 'left-0.5'}`} />
      </button>
    </div>
  );
}

function Panel({ onCerrar }) {
  const panelRef = useRef(null);
  const tituloId = useId();
  const { preferencias, cambiar, restablecer } = usePreferenciasAccesibilidad();
  useFocusTrap(panelRef, true, onCerrar, { enfocar: '[data-principal]' });

  return (
    <div className="fixed inset-0 z-[70]" onClick={onCerrar}>
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="glass-frosted absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-b-none p-5 pb-6 focus:outline-none sm:inset-x-auto sm:bottom-5 sm:left-5 sm:w-[400px] sm:rounded-b-[20px]"
      >
        <div className="mb-3 flex items-center gap-2">
          <Accessibility size={22} className="text-lila" aria-hidden="true" />
          <h2 id={tituloId} className="flex-1 font-display text-lg font-medium text-text">Accesibilidad</h2>
          <button type="button" data-principal="" onClick={onCerrar} aria-label="Cerrar" className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-white/5 hover:text-text">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <fieldset className="border-b border-border pb-4">
          <legend className="mb-2 font-body text-[15px] font-semibold text-text">Tamaño del texto</legend>
          <div className="grid grid-cols-3 gap-2">
            {TAMANOS.map(({ valor, etiqueta }) => (
              <button
                key={valor}
                type="button"
                aria-pressed={preferencias.texto === valor}
                onClick={() => cambiar('texto', valor)}
                className={`rounded-xl border px-2 py-2.5 font-body text-sm transition-colors ${
                  preferencias.texto === valor ? 'border-violet bg-violet/30 font-semibold text-text' : 'border-border text-text-secondary hover:border-violet/60 hover:text-text'
                }`}
              >
                {etiqueta}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="divide-y divide-border">
          {OPCIONES.map(({ campo, titulo, detalle }) => (
            <Interruptor key={campo} checked={preferencias[campo]} onChange={(v) => cambiar(campo, v)} titulo={titulo} detalle={detalle} />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="font-body text-xs text-text-secondary">Se guardan en este navegador.</p>
          <button type="button" onClick={restablecer} className="rounded-xl border border-border px-4 py-2.5 font-body text-sm font-semibold text-text transition-colors hover:border-violet">
            Restablecer
          </button>
        </div>
      </section>
    </div>
  );
}

/** Botón flotante que abre las preferencias de accesibilidad. */
export function PanelAccesibilidad() {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label="Opciones de accesibilidad"
        aria-haspopup="dialog"
        className="fixed bottom-24 left-3 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-lila/50 bg-[rgba(12,9,26,0.95)] text-lila shadow-lg shadow-black/40 transition-colors hover:bg-violet hover:text-white sm:bottom-5 sm:left-5"
      >
        <Accessibility size={22} aria-hidden="true" />
      </button>
      {abierto && <Panel onCerrar={() => setAbierto(false)} />}
    </>
  );
}
