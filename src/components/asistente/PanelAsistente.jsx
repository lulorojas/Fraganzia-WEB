import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, X, RotateCcw, Undo2, ShoppingBag } from 'lucide-react';
import { usePerfumes } from '../../hooks/usePerfumes';
import { useDolarBlue } from '../../hooks/useDolarBlue';
import { useCart } from '../../context/CartContext';
import {
  AROMAS, MOMENTOS, GENEROS_ASISTENTE, recomendar, rangosDePresupuesto, inspiracion,
} from '../../utils/recomendador';
import { formatARS, nombreCompleto } from '../../utils/format';
import { ImagenProducto } from '../perfumes/ImagenProducto';
import { BotonFavorito } from '../perfumes/BotonFavorito';

const POR_TANDA = 3;

// Las preguntas, en orden. `texto` y `opciones` reciben las respuestas previas
// (para hablarle distinto a quien compra para regalar) y los rangos de precio.
const PASOS = [
  {
    id: 'para',
    texto: () =>
      '¡Hola! Te hago unas preguntas rápidas y te recomiendo perfumes de nuestro catálogo. ¿Es para vos o para regalar?',
    opciones: () => [
      { valor: 'mi', etiqueta: 'Para mí' },
      { valor: 'regalo', etiqueta: 'Para regalar' },
    ],
  },
  {
    id: 'genero',
    texto: (r) => (r.para === 'regalo' ? '¿Para quién es el regalo?' : '¿Qué estilo de perfume buscás?'),
    opciones: (r) =>
      Object.entries(GENEROS_ASISTENTE).map(([valor, etiqueta]) => ({
        valor,
        etiqueta:
          r.para === 'regalo'
            ? { Masculino: 'Para él', Femenino: 'Para ella', indistinto: 'No importa', Kids: 'Para un chico/a' }[valor]
            : etiqueta,
      })),
  },
  {
    id: 'aroma',
    texto: (r) => (r.para === 'regalo' ? '¿Qué tipo de aromas le gustan?' : '¿Qué tipo de aromas te gustan más?'),
    opciones: () =>
      Object.entries(AROMAS).map(([valor, a]) => ({ valor, etiqueta: a.etiqueta, detalle: a.detalle })),
  },
  {
    id: 'momento',
    texto: () => '¿Para qué momento lo querés?',
    opciones: () => Object.entries(MOMENTOS).map(([valor, m]) => ({ valor, etiqueta: m.etiqueta })),
  },
  {
    id: 'presupuesto',
    texto: () => '¿Cuánto querés invertir?',
    opciones: (_, rangos) => [
      ...rangos.map((rango) => ({
        valor: rango.id,
        etiqueta:
          rango.min === 0
            ? `Hasta ${formatARS(rango.max)}`
            : rango.max === Infinity
              ? `Más de ${formatARS(rango.min)}`
              : `${formatARS(rango.min)} a ${formatARS(rango.max)}`,
      })),
      { valor: 'sinLimite', etiqueta: 'No tengo límite' },
    ],
  },
];

function Burbuja({ de, children }) {
  const esBot = de === 'bot';
  return (
    <div className={`flex ${esBot ? 'justify-start' : 'justify-end'}`}>
      <p
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 font-body text-sm leading-relaxed ${
          esBot ? 'rounded-tl-md bg-white/[0.06] text-text' : 'rounded-tr-md bg-violet text-white'
        }`}
      >
        {children}
      </p>
    </div>
  );
}

function Recomendacion({ item, onAgregar, onVer }) {
  const { perfume, precio } = item;
  const imagen = perfume.imagenes?.[0];
  const inspiradoEn = inspiracion(perfume);
  return (
    <li className="card-surface flex gap-3 rounded-2xl p-3">
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-white">
        <BotonFavorito perfume={perfume} className="absolute -left-0.5 -top-0.5 z-10 scale-[0.8]" />
        <ImagenProducto url={imagen} sizes="80px" width="80" height="80" className="h-full w-full object-contain p-1.5" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate font-body text-[11px] font-semibold uppercase tracking-wide2 text-lila">{perfume.marca}</p>
        <p className="line-clamp-2 font-display text-sm font-semibold leading-snug text-text">{perfume.nombre}</p>
        <p className="mt-0.5 font-body text-xs text-text-secondary">
          {[perfume.familiaOlfativa, perfume.genero].filter(Boolean).join(' · ')}
        </p>
        {inspiradoEn && (
          <p className="mt-0.5 truncate font-body text-xs text-lila" title={`Inspirado en ${inspiradoEn}`}>
            Inspirado en {inspiradoEn}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="font-body text-sm font-bold tabular-nums text-text">
            {precio ? formatARS(precio) : 'Consultar'}
          </span>
          <div className="flex gap-1.5">
            <Link
              to={`/perfume/${perfume.id}`}
              onClick={onVer}
              className="rounded-lg border border-violet/30 px-2.5 py-1.5 font-body text-xs font-semibold text-text transition-colors hover:border-violet"
            >
              Ver
            </Link>
            <button
              type="button"
              onClick={() => onAgregar(perfume)}
              aria-label={`Agregar ${nombreCompleto(perfume)} al carrito`}
              className="flex items-center gap-1 rounded-lg bg-violet px-2.5 py-1.5 font-body text-xs font-semibold text-white transition-colors hover:bg-violet-light"
            >
              <ShoppingBag size={13} aria-hidden="true" />
              Agregar
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

export default function PanelAsistente({ abierto, onCerrar, subir }) {
  const { data: perfumes, isLoading } = usePerfumes();
  const { dolarMedio } = useDolarBlue();
  const { agregar } = useCart();
  const [respuestas, setRespuestas] = useState({});
  const [tandas, setTandas] = useState(1);
  const tituloId = useId();
  const listaRef = useRef(null);
  const panelRef = useRef(null);

  const rangos = useMemo(() => rangosDePresupuesto(perfumes ?? [], dolarMedio), [perfumes, dolarMedio]);
  const indicePaso = PASOS.findIndex((p) => !(p.id in respuestas));
  const pasoActual = indicePaso === -1 ? null : PASOS[indicePaso];
  const terminado = !pasoActual;

  const resultados = useMemo(
    () => (terminado ? recomendar(perfumes, respuestas, { dolarMedio, rangos }) : []),
    [terminado, perfumes, respuestas, dolarMedio, rangos]
  );
  const visibles = resultados.slice(0, tandas * POR_TANDA);

  // Siempre mostrar lo último de la conversación y llevar el foco a las
  // nuevas opciones (para que con teclado se pueda seguir sin el mouse).
  useEffect(() => {
    if (!abierto) return;
    const lista = listaRef.current;
    if (lista) lista.scrollTop = lista.scrollHeight;
    panelRef.current?.querySelector('[data-opcion]')?.focus({ preventScroll: true });
  }, [abierto, indicePaso, tandas]);

  useEffect(() => {
    if (!abierto) return undefined;
    const onKey = (e) => e.key === 'Escape' && onCerrar();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [abierto, onCerrar]);

  function responder(id, valor) {
    setRespuestas((r) => ({ ...r, [id]: valor }));
    setTandas(1);
  }

  function deshacer() {
    const respondidos = PASOS.filter((p) => p.id in respuestas);
    const ultimo = respondidos[respondidos.length - 1];
    if (!ultimo) return;
    setRespuestas(({ [ultimo.id]: _, ...resto }) => resto);
    setTandas(1);
  }

  if (!abierto) return null;

  const etiquetaDe = (paso, valor) =>
    paso.opciones(respuestas, rangos).find((o) => o.valor === valor)?.etiqueta ?? valor;

  return (
    <section
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby={tituloId}
      className={`glass-frosted fixed inset-x-3 z-50 flex max-h-[80vh] flex-col overflow-hidden shadow-2xl sm:inset-x-auto sm:right-6 sm:w-[380px] md:bottom-6 md:max-h-[min(640px,calc(100vh-7rem))] ${
        subir ? 'bottom-24' : 'bottom-3'
      }`}
    >
      {/* Encabezado */}
      <header className="flex items-center gap-3 border-b border-violet/15 px-4 py-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet to-violet-light" aria-hidden="true">
          <Sparkles size={18} className="text-white" />
        </span>
        <div className="flex-1">
          <h2 id={tituloId} className="font-display text-base font-semibold text-text">
            Encontrá tu perfume
          </h2>
          <p className="font-body text-xs text-text-secondary">Asistente de Fraganzia</p>
        </div>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar asistente"
          className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-white/5 hover:text-text"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </header>

      {/* Conversación */}
      <div ref={listaRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
        {PASOS.slice(0, terminado ? PASOS.length : indicePaso).map((paso) => (
          <div key={paso.id} className="space-y-3">
            <Burbuja de="bot">{paso.texto(respuestas)}</Burbuja>
            <Burbuja de="usuario">{etiquetaDe(paso, respuestas[paso.id])}</Burbuja>
          </div>
        ))}

        {pasoActual && (
          <>
            <Burbuja de="bot">{pasoActual.texto(respuestas)}</Burbuja>
            {pasoActual.id === 'presupuesto' && isLoading ? (
              <p className="font-body text-xs text-text-secondary">Cargando precios…</p>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1" role="group" aria-label="Opciones">
                {pasoActual.opciones(respuestas, rangos).map((opcion, i) => (
                  <button
                    key={opcion.valor}
                    type="button"
                    data-opcion={i === 0 ? '' : undefined}
                    onClick={() => responder(pasoActual.id, opcion.valor)}
                    className="rounded-2xl border border-violet/35 bg-violet/10 px-3.5 py-2 text-left font-body text-sm text-text transition-colors hover:border-violet hover:bg-violet/25"
                  >
                    {opcion.etiqueta}
                    {opcion.detalle && (
                      <span className="block text-xs text-text-secondary">{opcion.detalle}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {terminado && (
          <>
            <Burbuja de="bot">
              {visibles.length
                ? respuestas.para === 'regalo'
                  ? '¡Listo! Estos son los que mejor le van:'
                  : '¡Listo! Estos son los que mejor te van:'
                : 'No encontré perfumes con esas características. Probá cambiar alguna respuesta.'}
            </Burbuja>
            {visibles.length > 0 && (
              <ul className="space-y-2.5" aria-label="Perfumes recomendados">
                {visibles.map((item) => (
                  <Recomendacion key={item.perfume.id} item={item} onAgregar={agregar} onVer={onCerrar} />
                ))}
              </ul>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              {resultados.length > visibles.length && (
                <button
                  type="button"
                  data-opcion=""
                  onClick={() => setTandas((t) => t + 1)}
                  className="rounded-2xl border border-violet/35 bg-violet/10 px-3.5 py-2 font-body text-sm text-text transition-colors hover:border-violet hover:bg-violet/25"
                >
                  Ver otras opciones
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setRespuestas({});
                  setTandas(1);
                }}
                className="flex items-center gap-1.5 rounded-2xl px-3 py-2 font-body text-sm text-text-secondary transition-colors hover:text-text"
              >
                <RotateCcw size={14} aria-hidden="true" />
                Empezar de nuevo
              </button>
            </div>
          </>
        )}
      </div>

      {/* Pie: volver un paso */}
      {indicePaso !== 0 && (
        <footer className="border-t border-violet/15 px-4 py-2">
          <button
            type="button"
            onClick={deshacer}
            className="flex items-center gap-1.5 py-1 font-body text-xs text-text-secondary transition-colors hover:text-text"
          >
            <Undo2 size={14} aria-hidden="true" />
            Cambiar la respuesta anterior
          </button>
        </footer>
      )}
    </section>
  );
}
