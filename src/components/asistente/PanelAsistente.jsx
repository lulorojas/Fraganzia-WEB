import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, X, RotateCcw, Undo2, ShoppingBag, Search, Check } from 'lucide-react';
import { usePerfumes } from '../../hooks/usePerfumes';
import { useDolarBlue } from '../../hooks/useDolarBlue';
import { useCart } from '../../context/CartContext';
import {
  AROMAS, EVITAR, MOMENTOS, GENEROS_ASISTENTE, recomendar, rangosDePresupuesto, inspiracion,
  referenciasDisponibles, buscarReferencias, nombreCorto,
} from '../../utils/recomendador';
import { formatARS, nombreCompleto } from '../../utils/format';
import { ImagenProducto } from '../perfumes/ImagenProducto';
import { BotonFavorito } from '../perfumes/BotonFavorito';

const POR_TANDA = 3;
const REFERENCIAS_EN_BOTONES = 8;
const OTRA_REFERENCIA = '__otra';

const buscaParecido = (r) => Boolean(r.parecido) && r.parecido !== 'no';
const caminoGeneral = (r) => r.parecido === 'no';

// Lo que no tiene sentido ofrecer para evitar según el aroma y el matiz elegidos
// (si eligió "Dulces" o "Cuero y tabaco", no se le pregunta si quiere evitarlos).
const CONTRADICE = {
  dulce: 'dulce', floral: 'floral', vainilla: 'dulce', cafe: 'dulce', cuero: 'cuero', oud: 'oud',
  frutal: 'frutal', rosa: 'floral', blancas: 'floral',
};
const evitablesPara = (r) => {
  const excluidos = new Set([CONTRADICE[r.aroma], CONTRADICE[r.variante]].filter(Boolean));
  return Object.entries(EVITAR).filter(([valor]) => !excluidos.has(valor));
};

// Las preguntas, en orden. `texto` y `opciones` reciben las respuestas previas
// (para hablarle distinto a quien compra para regalar) y el contexto
// ({ rangos, perfumes }). `mostrar` decide si la pregunta aplica: si se elige
// un perfume de referencia, se saltean aroma, matiz, evitar y momento.
// `tipo`: 'opciones' (una sola), 'multiple' (varias + Listo) o 'parecido'
// (botones de referencias + buscador).
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
    id: 'parecido',
    tipo: 'parecido',
    texto: (r) =>
      r.para === 'regalo'
        ? '¿Le gusta algún perfume conocido? Te muestro los nuestros que más se le parecen.'
        : '¿Buscás algo parecido a algún perfume conocido?',
    opciones: (r, { perfumes }) => [
      { valor: 'no', etiqueta: 'No, quiero descubrir' },
      ...referenciasDisponibles(perfumes, r.genero).slice(0, REFERENCIAS_EN_BOTONES),
      { valor: OTRA_REFERENCIA, etiqueta: 'Otro…', icono: true },
    ],
  },
  {
    id: 'aroma',
    mostrar: caminoGeneral,
    texto: (r) => (r.para === 'regalo' ? '¿Qué tipo de aromas le gustan?' : '¿Qué tipo de aromas te gustan más?'),
    opciones: () =>
      Object.entries(AROMAS).map(([valor, a]) => ({ valor, etiqueta: a.etiqueta, detalle: a.detalle })),
  },
  {
    id: 'variante',
    mostrar: (r) => caminoGeneral(r) && Boolean(r.aroma) && r.aroma !== 'sorpresa',
    texto: () => '¿Algún matiz en especial?',
    opciones: (r) => [
      ...Object.entries(AROMAS[r.aroma]?.variantes ?? {}).map(([valor, v]) => ({ valor, etiqueta: v.etiqueta })),
      { valor: 'igual', etiqueta: 'Me da igual' },
    ],
  },
  {
    id: 'evitar',
    tipo: 'multiple',
    mostrar: caminoGeneral,
    texto: (r) =>
      r.para === 'regalo'
        ? '¿Hay algo que sepas que no le gusta? Podés marcar varias.'
        : '¿Hay algo que prefieras evitar? Podés marcar varias.',
    opciones: (r) => evitablesPara(r).map(([valor, e]) => ({ valor, etiqueta: e.etiqueta })),
  },
  {
    id: 'momento',
    mostrar: caminoGeneral,
    texto: () => '¿Para qué momento lo querés?',
    opciones: () => Object.entries(MOMENTOS).map(([valor, m]) => ({ valor, etiqueta: m.etiqueta })),
  },
  {
    id: 'presupuesto',
    texto: () => '¿Cuánto querés invertir?',
    opciones: (_, { rangos }) => [
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
  // Estado de la pregunta en curso: selección múltiple y buscador de referencias.
  const [seleccion, setSeleccion] = useState([]);
  const [buscandoOtra, setBuscandoOtra] = useState(false);
  const [textoReferencia, setTextoReferencia] = useState('');
  const tituloId = useId();
  const listaRef = useRef(null);
  const panelRef = useRef(null);

  const rangos = useMemo(() => rangosDePresupuesto(perfumes ?? [], dolarMedio), [perfumes, dolarMedio]);
  const contexto = { rangos, perfumes };
  const pasosVisibles = PASOS.filter((p) => !p.mostrar || p.mostrar(respuestas));
  const indicePaso = pasosVisibles.findIndex((p) => !(p.id in respuestas));
  const pasoActual = indicePaso === -1 ? null : pasosVisibles[indicePaso];
  const terminado = !pasoActual;

  const { lista: resultados, referenciaSinResultados } = useMemo(
    () => (terminado ? recomendar(perfumes, respuestas, { dolarMedio, rangos }) : { lista: [] }),
    [terminado, perfumes, respuestas, dolarMedio, rangos]
  );
  const visibles = resultados.slice(0, tandas * POR_TANDA);
  const sugerencias = buscandoOtra ? buscarReferencias(perfumes, respuestas.genero, textoReferencia) : [];

  // Siempre mostrar lo último de la conversación y llevar el foco a las
  // nuevas opciones (para que con teclado se pueda seguir sin el mouse).
  useEffect(() => {
    if (!abierto) return;
    const lista = listaRef.current;
    if (lista) lista.scrollTop = lista.scrollHeight;
    panelRef.current?.querySelector('[data-opcion]')?.focus({ preventScroll: true });
  }, [abierto, indicePaso, tandas, buscandoOtra]);

  useEffect(() => {
    if (!abierto) return undefined;
    const onKey = (e) => e.key === 'Escape' && onCerrar();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [abierto, onCerrar]);

  function limpiarPregunta() {
    setSeleccion([]);
    setBuscandoOtra(false);
    setTextoReferencia('');
    setTandas(1);
  }

  // Responder una pregunta borra las respuestas de las que vienen después:
  // así cambiar de camino (con o sin referencia) no arrastra respuestas viejas.
  function responder(id, valor) {
    const posicion = PASOS.findIndex((p) => p.id === id);
    setRespuestas((r) => {
      const previas = Object.fromEntries(
        Object.entries(r).filter(([clave]) => PASOS.findIndex((p) => p.id === clave) < posicion)
      );
      return { ...previas, [id]: valor };
    });
    limpiarPregunta();
  }

  function elegirOpcion(paso, valor) {
    if (paso.tipo === 'multiple') {
      setSeleccion((s) => (s.includes(valor) ? s.filter((v) => v !== valor) : [...s, valor]));
    } else if (paso.tipo === 'parecido' && valor === OTRA_REFERENCIA) {
      setBuscandoOtra(true);
    } else {
      responder(paso.id, valor);
    }
  }

  function deshacer() {
    const respondidos = pasosVisibles.filter((p) => p.id in respuestas);
    const ultimo = respondidos[respondidos.length - 1];
    if (!ultimo) return;
    setRespuestas(({ [ultimo.id]: _, ...resto }) => resto);
    limpiarPregunta();
  }

  if (!abierto) return null;

  const etiquetaDe = (paso, valor) => {
    if (paso.tipo === 'multiple') {
      return valor.length ? valor.map((v) => EVITAR[v]?.etiqueta ?? v).join(', ') : 'Nada en especial';
    }
    if (paso.tipo === 'parecido') return valor === 'no' ? 'No, quiero descubrir' : nombreCorto(valor);
    return paso.opciones(respuestas, contexto).find((o) => o.valor === valor)?.etiqueta ?? valor;
  };

  const claseOpcion =
    'rounded-2xl border px-3.5 py-2 text-left font-body text-sm text-text transition-colors hover:border-violet hover:bg-violet/25';

  let mensajeFinal = 'No encontré perfumes con esas características. Probá cambiar alguna respuesta.';
  if (visibles.length) {
    const tuyo = respuestas.para === 'regalo' ? 'le van' : 'te van';
    if (buscaParecido(respuestas) && !referenciaSinResultados) {
      mensajeFinal = `¡Listo! Estos son los nuestros más parecidos a ${nombreCorto(respuestas.parecido)}:`;
    } else if (referenciaSinResultados) {
      mensajeFinal = `No tengo alternativas a ${nombreCorto(respuestas.parecido)} para ese perfil, pero estos ${tuyo} muy bien:`;
    } else {
      mensajeFinal = `¡Listo! Estos son los que mejor ${tuyo}:`;
    }
  }

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
        {pasosVisibles.slice(0, terminado ? pasosVisibles.length : indicePaso).map((paso) => (
          <div key={paso.id} className="space-y-3">
            <Burbuja de="bot">{paso.texto(respuestas)}</Burbuja>
            <Burbuja de="usuario">{etiquetaDe(paso, respuestas[paso.id])}</Burbuja>
          </div>
        ))}

        {pasoActual && (
          <>
            <Burbuja de="bot">{pasoActual.texto(respuestas)}</Burbuja>
            {(pasoActual.id === 'presupuesto' || pasoActual.tipo === 'parecido') && isLoading ? (
              <p className="font-body text-xs text-text-secondary">Cargando catálogo…</p>
            ) : buscandoOtra ? (
              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 rounded-2xl border border-violet/35 bg-white/[0.04] px-3 py-2 focus-within:border-violet">
                  <Search size={15} className="text-text-secondary" aria-hidden="true" />
                  <input
                    data-opcion=""
                    type="text"
                    value={textoReferencia}
                    onChange={(e) => setTextoReferencia(e.target.value)}
                    placeholder="Escribí el perfume (ej.: Sauvage)"
                    aria-label="Perfume conocido al que se parezca"
                    className="w-full bg-transparent font-body text-sm text-text placeholder:text-text-secondary focus:outline-none"
                  />
                </label>
                {sugerencias.length > 0 && (
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Perfumes encontrados">
                    {sugerencias.map((s) => (
                      <button
                        key={s.valor}
                        type="button"
                        onClick={() => responder('parecido', s.valor)}
                        className={`${claseOpcion} border-violet/35 bg-violet/10`}
                      >
                        {s.etiqueta}
                      </button>
                    ))}
                  </div>
                )}
                {textoReferencia.trim().length >= 3 && sugerencias.length === 0 && (
                  <p className="font-body text-xs text-text-secondary">
                    No tenemos alternativas a ese perfume. Probá con otro nombre o seguí sin referencia.
                  </p>
                )}
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setBuscandoOtra(false)}
                    className="font-body text-xs text-text-secondary underline-offset-2 hover:text-text hover:underline"
                  >
                    Ver los más pedidos
                  </button>
                  <button
                    type="button"
                    onClick={() => responder('parecido', 'no')}
                    className="font-body text-xs text-text-secondary underline-offset-2 hover:text-text hover:underline"
                  >
                    Seguir sin referencia
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1" role="group" aria-label="Opciones">
                {pasoActual.opciones(respuestas, contexto).map((opcion, i) => {
                  const marcada = pasoActual.tipo === 'multiple' && seleccion.includes(opcion.valor);
                  return (
                    <button
                      key={opcion.valor}
                      type="button"
                      data-opcion={i === 0 ? '' : undefined}
                      aria-pressed={pasoActual.tipo === 'multiple' ? marcada : undefined}
                      onClick={() => elegirOpcion(pasoActual, opcion.valor)}
                      className={`${claseOpcion} ${marcada ? 'border-violet bg-violet/40' : 'border-violet/35 bg-violet/10'} ${opcion.icono || marcada ? 'flex items-center gap-1.5' : ''}`}
                    >
                      {marcada && <Check size={14} aria-hidden="true" />}
                      {opcion.icono && <Search size={14} aria-hidden="true" />}
                      {opcion.etiqueta}
                      {opcion.detalle && (
                        <span className="block text-xs text-text-secondary">{opcion.detalle}</span>
                      )}
                    </button>
                  );
                })}
                {pasoActual.tipo === 'multiple' && (
                  <button
                    type="button"
                    onClick={() => responder(pasoActual.id, seleccion)}
                    className="rounded-2xl bg-violet px-4 py-2 font-body text-sm font-semibold text-white transition-colors hover:bg-violet-light"
                  >
                    {seleccion.length ? 'Listo' : 'Nada en especial'}
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {terminado && (
          <>
            <Burbuja de="bot">{mensajeFinal}</Burbuja>
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
                  limpiarPregunta();
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
