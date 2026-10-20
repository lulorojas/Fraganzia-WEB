import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Coins, Gem, MessageCircle, Sparkles } from 'lucide-react';
import { usePerfumes } from '../hooks/usePerfumes';
import { useDolarBlue } from '../hooks/useDolarBlue';
import { useCart } from '../context/CartContext';
import { usePromocionesActivas } from '../hooks/usePromociones';
import { HorizontalSlider } from '../components/perfumes/HorizontalSlider';
import { ImagenProducto } from '../components/perfumes/ImagenProducto';
import { GarantiasCompra } from '../components/perfumes/GarantiasCompra';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { abrirAsistente } from '../components/asistente/BotonAsistente';
import { preciosPorMetodo, getMejorPromo } from '../utils/precios';
import { formatARS } from '../utils/format';
import { GENEROS, FAMILIAS_OLFATIVAS } from '../constants';
import { bandasDePrecio } from '../utils/ordenCatalogo';
import { marcasDelCatalogo } from '../utils/busqueda';

const PASOS = [
  { titulo: 'Elegí tus perfumes', texto: 'Sumalos al carrito. Cada uno muestra su precio por transferencia y en efectivo.' },
  { titulo: 'Confirmá el pedido', texto: 'Solo con tu nombre, sin crear una cuenta.' },
  { titulo: 'Lo coordinamos por WhatsApp', texto: 'Acordamos el pago y la entrega, y seguís tu pedido online con un link.' },
];

/** Precio por transferencia (con la promo aplicada) para la vitrina del encabezado. */
function precioVitrina(perfume, dolarMedio, promociones) {
  const precios = dolarMedio
    ? preciosPorMetodo(perfume.precioUSD, dolarMedio)
    : perfume.precioTransferencia
      ? { precioTransferencia: perfume.precioTransferencia }
      : null;
  if (!precios) return null;
  const pct = getMejorPromo(perfume.id, promociones)?.descuentoPorcentaje ?? 0;
  const final = pct ? Math.round((precios.precioTransferencia * (1 - pct / 100)) / 1000) * 1000 : precios.precioTransferencia;
  return { final, antes: pct ? precios.precioTransferencia : null, pct };
}

function TituloSeccion({ etiqueta, titulo, id, enlace = 'Ver todo el catálogo' }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        <p className="mb-2 font-body text-[11px] font-semibold uppercase tracking-luxury text-lila">{etiqueta}</p>
        <h2 id={id} className="font-display text-3xl font-light tracking-tight text-text sm:text-4xl">{titulo}</h2>
      </div>
      <Link to="/catalogo" className="shrink-0 pb-1 font-body text-sm text-lila transition-base hover:text-text">
        {enlace}
      </Link>
    </div>
  );
}

/** Tarjeta de la vitrina del encabezado: foto, nombre y precio; todo el bloque es un enlace. */
function TarjetaVitrina({ perfume, dolarMedio, promociones, prioridad, className = '' }) {
  const precio = precioVitrina(perfume, dolarMedio, promociones);
  return (
    <Link
      to={`/perfume/${perfume.id}`}
      className={`card-surface card-hover group block overflow-hidden rounded-2xl ${className}`}
    >
      <div className="plinto relative overflow-hidden">
        <ImagenProducto
          url={perfume.imagenes?.[0]}
          sizes="(min-width: 1024px) 220px, 46vw"
          width="400"
          height="500"
          prioridad={prioridad}
          className="foto-producto aspect-[4/5] w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
        />
        {precio?.pct > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-violet px-2.5 py-1 text-[11px] font-bold text-white shadow-lg">
            -{precio.pct}%
          </span>
        )}
      </div>
      <div className="p-3.5 sm:p-4">
        <p className="mb-1 truncate font-body text-[10px] font-semibold uppercase tracking-wide2 text-lila sm:text-[11px]">{perfume.marca}</p>
        <h3 className="line-clamp-2 min-h-[2.4rem] font-display text-sm font-medium leading-snug text-text">{perfume.nombre}</h3>
        {precio && (
          <p className="mt-2 flex items-baseline gap-2 tabular-nums">
            <span className={`font-display text-base font-semibold ${precio.pct ? 'text-emerald-400' : 'text-text'}`}>{formatARS(precio.final)}</span>
            {precio.antes && <span className="text-xs text-text-secondary line-through">{formatARS(precio.antes)}</span>}
          </p>
        )}
      </div>
    </Link>
  );
}

function VitrinaCargando() {
  return Array.from({ length: 3 }, (_, i) => (
    <div key={i} className="card-surface aspect-[4/7] w-[44vw] flex-none animate-pulse rounded-2xl sm:w-[30vw] lg:w-auto" aria-hidden="true" />
  ));
}


const ETIQUETA_GENERO = { Masculino: 'Para él', Femenino: 'Para ella', Unisex: 'Unisex', Kids: 'Kids' };

function Subtitulo({ children }) {
  return <h3 className="mb-3 font-body text-xs font-semibold uppercase tracking-wide2 text-text-secondary">{children}</h3>;
}

/** Chip de atajo: un solo toque lleva al catálogo ya filtrado. */
function Chip({ to, children, cantidad }) {
  return (
    <Link
      to={to}
      className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-white/[0.02] px-4 py-2 font-body text-sm text-text transition-colors hover:border-violet hover:bg-violet/15"
    >
      {children}
      {cantidad != null && <span className="text-xs text-text-secondary">{cantidad}</span>}
    </Link>
  );
}

/** Atajos para llegar a los resultados en un clic: género, presupuesto, aroma y marca (con datos reales del catálogo). */
function Explorar({ catalogo, dolarMedio }) {
  const { generos, bandas, familias, marcas } = useMemo(() => {
    const lista = catalogo ?? [];
    return {
      generos: GENEROS.map((g) => ({ g, n: lista.filter((p) => p.genero === g).length })).filter((x) => x.n > 0),
      bandas: bandasDePrecio(lista, dolarMedio),
      familias: FAMILIAS_OLFATIVAS.map((f) => ({ f, n: lista.filter((p) => p.familiaOlfativa === f).length })).filter((x) => x.n >= 3),
      marcas: marcasDelCatalogo(lista).sort((a, b) => b.cantidad - a.cantidad).slice(0, 10),
    };
  }, [catalogo, dolarMedio]);

  if (!generos.length) return null;

  const etiquetaBanda = ({ id, min, max }) =>
    id === 'bajo' ? `Hasta ${formatARS(max)}` : id === 'alto' ? `Más de ${formatARS(min)}` : `${formatARS(min)} a ${formatARS(max)}`;
  const tile = 'card-surface card-hover group flex justify-between rounded-2xl p-5';

  return (
    <section aria-labelledby="explorar" className="mx-auto max-w-7xl px-4 pb-14 pt-14 sm:px-6 sm:pt-16">
      <TituloSeccion id="explorar" etiqueta="Explorar" titulo="Encontrá lo tuyo en un clic" />
      <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr]">
        <div>
          <Subtitulo>¿Para quién?</Subtitulo>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {generos.map(({ g, n }) => (
              <Link key={g} to={`/catalogo?genero=${g}`} className={`${tile} min-h-[112px] flex-col`}>
                <span className="font-display text-2xl font-light text-text">{ETIQUETA_GENERO[g]}</span>
                <span className="mt-4 flex items-center justify-between font-body text-xs text-text-secondary">
                  {n} perfumes
                  <ArrowRight size={16} className="text-lila transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </div>
        {bandas.length > 0 && (
          <div>
            <Subtitulo>¿Cuánto querés invertir?</Subtitulo>
            <div className="grid gap-3">
              {bandas.map((banda) => (
                <Link key={banda.id} to={`/catalogo?precio=${banda.id}&orden=precio-asc`} className={`${tile} items-center`}>
                  <span className="font-display text-lg font-light tabular-nums text-text">{etiquetaBanda(banda)}</span>
                  <ArrowRight size={16} className="text-lila transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        {familias.length > 0 && (
          <div>
            <Subtitulo>Por aroma</Subtitulo>
            <div className="flex flex-wrap gap-2">
              {familias.map(({ f, n }) => (
                <Chip key={f} to={`/catalogo?familia=${encodeURIComponent(f)}`} cantidad={n}>{f}</Chip>
              ))}
            </div>
          </div>
        )}
        {marcas.length > 0 && (
          <div>
            <Subtitulo>Por marca</Subtitulo>
            <div className="flex flex-wrap gap-2">
              {marcas.map(({ marca, cantidad }) => (
                <Chip key={marca} to={`/catalogo?marca=${encodeURIComponent(marca)}`} cantidad={cantidad}>{marca}</Chip>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

const PILARES = [
  { Icono: Gem, texto: 'Cada perfume, elegido con criterio' },
  { Icono: Coins, texto: 'Precios al día, según la cotización del dólar' },
  { Icono: MessageCircle, texto: 'Atención personal por WhatsApp' },
];

/** Quiénes somos en corto: la historia de la marca, tres pilares y números reales del catálogo. */
function PorQueFraganzia({ catalogo }) {
  const cantidad = catalogo?.length ?? 0;
  const marcas = useMemo(() => marcasDelCatalogo(catalogo).length, [catalogo]);
  const estadisticas = [
    cantidad >= 50 && { valor: `${Math.floor(cantidad / 50) * 50}+`, texto: 'perfumes en el catálogo' },
    marcas >= 3 && { valor: String(marcas), texto: 'marcas árabes' },
    { valor: '3 · 5 · 10', texto: 'ml en decants, para probar' },
  ].filter(Boolean);

  return (
    <section aria-labelledby="por-que" className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
      <div className="card-surface relative grid items-center gap-10 overflow-hidden rounded-3xl p-7 sm:p-12 lg:grid-cols-[1.15fr_1fr]">
        <span aria-hidden="true" className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-violet/15 blur-3xl" />
        <div className="relative">
          <p className="mb-3 font-body text-[11px] font-semibold uppercase tracking-luxury text-lila">Fraganzia</p>
          <h2 id="por-que" className="font-display text-3xl font-light tracking-tight text-text sm:text-4xl">
            Perfumería árabe, elegida con criterio
          </h2>
          <p className="mt-4 max-w-lg font-body text-sm leading-relaxed text-text-secondary sm:text-base">
            Nació de la búsqueda de fragancias que cuenten historias y sean accesibles sin resignar calidad.
            Hoy es un catálogo cuidadosamente curado.
          </p>
          <ul className="mt-6 flex flex-col gap-3">
            {PILARES.map(({ Icono, texto }) => (
              <li key={texto} className="flex items-center gap-3 font-body text-sm text-text">
                <Icono size={18} className="shrink-0 text-lila" aria-hidden="true" />
                {texto}
              </li>
            ))}
          </ul>
          <Link to="/sobre-nosotros" className="mt-7 inline-flex items-center gap-2 font-body text-sm font-semibold text-lila transition-base hover:text-text">
            Conocé Fraganzia
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <dl className="relative grid grid-cols-3 gap-3 lg:grid-cols-1">
          {estadisticas.map(({ valor, texto }) => (
            <div key={texto} className="rounded-2xl border border-border bg-white/[0.02] p-4 text-center lg:flex lg:items-baseline lg:gap-4 lg:text-left">
              <dt className="font-display text-2xl font-light tabular-nums text-lila sm:text-3xl lg:min-w-[7.5rem]">{valor}</dt>
              <dd className="mt-1 font-body text-xs text-text-secondary sm:text-sm lg:mt-0">{texto}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export default function Home() {
  const { data: destacados, isLoading } = usePerfumes({ destacado: true });
  const { data: catalogo } = usePerfumes();
  // El catálogo viene ordenado de más nuevo a más viejo.
  const nuevos = catalogo?.slice(0, 8);
  const { dolarMedio } = useDolarBlue();
  const { agregar } = useCart();
  const { data: promociones } = usePromocionesActivas();
  useDocumentMeta({ path: '/' });

  // Perfumes con una promoción vigente (solo se muestra la sección si hay).
  const ofertas = useMemo(
    () => (promociones?.length ? (catalogo ?? []).filter((p) => getMejorPromo(p.id, promociones)) : []),
    [catalogo, promociones]
  );

  // Lo que se ve en el primer pantallazo: tres destacados con foto.
  const vitrina = destacados?.filter((p) => p.imagenes?.[0]).slice(0, 3) ?? [];
  // La del medio sube (en pantallas grandes), así la vitrina no es una fila plana.
  const claseVitrina = ['lg:mt-10', 'lg:-mt-2', 'lg:mt-10'];

  return (
    <div className="relative">
      {/* ── Encabezado ───────────────────────────────────────── */}
      <section className="grano relative overflow-hidden px-4 pb-10 pt-10 sm:px-6 sm:pb-16 sm:pt-14 lg:pb-20 lg:pt-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 60% 70% at 78% 30%, rgba(123,47,190,0.32) 0%, rgba(123,47,190,0) 70%), radial-gradient(circle at 8% 90%, rgba(192,132,252,0.12) 0%, rgba(192,132,252,0) 40%)',
          }}
        />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-14">
          <div className="max-w-xl">
            <p className="mb-5 flex items-center gap-3 font-body text-[11px] font-semibold uppercase tracking-luxury text-lila">
              <span aria-hidden="true" className="h-px w-8 bg-violet" />
              Perfumería árabe original
            </p>
            <h1 className="font-display text-[2.6rem] font-light leading-[1.05] tracking-tight text-text sm:text-6xl lg:text-[4.2rem]">
              Perfumes árabes que dejan <span className="font-normal text-lila">huella.</span>
            </h1>
            <p className="mt-5 max-w-md font-body text-base leading-relaxed text-text-secondary sm:text-lg">
              Lattafa, Armaf, Al Haramain y más, con el precio en pesos siempre al día.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link
                to="/catalogo"
                className="gradient-violet inline-flex items-center gap-2 rounded-full px-8 py-4 font-body text-base font-semibold text-white shadow-lg shadow-violet/20 transition-all duration-300 hover:shadow-violet/40 hover:brightness-110"
              >
                Ver catálogo
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Vitrina: en celular se desliza, en pantallas grandes son tres tarjetas. */}
          <div
            className="hide-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0 scroll-pl-4 sm:scroll-pl-6 lg:scroll-pl-0"
            role="region"
            aria-label="Algunos perfumes para empezar"
          >
            <h2 className="sr-only">Algunos perfumes para empezar</h2>
            {isLoading || !vitrina.length ? (
              <VitrinaCargando />
            ) : (
              vitrina.map((perfume, i) => (
                <div key={perfume.id} className={`w-[44vw] flex-none snap-start sm:w-[30vw] lg:w-auto ${claseVitrina[i]}`}>
                  <TarjetaVitrina
                    perfume={perfume}
                    dolarMedio={dolarMedio}
                    promociones={promociones}
                    prioridad={i === 0}
                    className="h-full"
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── Por qué comprar acá: una sola vez en toda la portada ── */}
      <section aria-label="Cómo comprás en Fraganzia" className="border-y border-border bg-violet/[0.03]">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
          <GarantiasCompra variante="franja" />
        </div>
      </section>

      {/* ── Promociones: antes de los destacados, es lo que más empuja la compra ── */}
      {promociones?.length > 0 && (
        <section aria-label="Promociones" className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
          <div className={`grid gap-5 ${promociones.length > 1 ? 'md:grid-cols-2' : 'mx-auto max-w-5xl'}`}>
            {promociones.map((promo, i) => (
              <Link
                key={promo.id}
                to="/catalogo"
                className="card-surface card-hover group block overflow-hidden rounded-2xl"
              >
                {promo.imagen && (
                  <img
                    src={promo.imagen}
                    alt={promo.titulo}
                    // La primera promoción suele ser lo primero grande que se ve en el
                    // celular: se pide ya, con prioridad, en vez de esperar al scroll.
                    loading={i === 0 ? 'eager' : 'lazy'}
                    fetchpriority={i === 0 ? 'high' : undefined}
                    decoding="async"
                    width="1200"
                    height="675"
                    className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                )}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
                  <div className="min-w-0">
                    <h2 className="font-display text-lg font-semibold text-text">{promo.titulo}</h2>
                    {promo.descripcion && (
                      <p className="mt-1 text-sm leading-relaxed text-text-secondary">{promo.descripcion}</p>
                    )}
                    {promo.perfumeIds?.length > 0 && (
                      <p className="mt-1 text-xs text-text-secondary">
                        Válida en {promo.perfumeIds.length} {promo.perfumeIds.length === 1 ? 'perfume seleccionado' : 'perfumes seleccionados'}
                      </p>
                    )}
                  </div>
                  <span className="font-body text-sm font-semibold text-lila transition-colors group-hover:text-text">
                    Ver perfumes
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Atajos: marca, género, aroma y presupuesto ───────── */}
      <Explorar catalogo={catalogo} dolarMedio={dolarMedio} />

      {ofertas.length > 0 && (
        <section className="diferir-render mx-auto max-w-7xl px-4 pb-14 sm:px-6">
          <TituloSeccion etiqueta="Promociones vigentes" titulo="En oferta" />
          <HorizontalSlider perfumes={ofertas} dolarMedio={dolarMedio} onAgregar={agregar} promociones={promociones} etiqueta="Perfumes en oferta" />
        </section>
      )}

      {/* ── Destacados ───────────────────────────────────────── */}
      <section className="diferir-render mx-auto max-w-7xl px-4 pb-14 sm:px-6">
        <TituloSeccion etiqueta="Selección" titulo="Los más elegidos" />
        {isLoading ? (
          // Mismo alto que el slider cargado, para que la página no salte.
          <div className="flex gap-4 overflow-hidden pb-4" role="status" aria-label="Cargando destacados">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="card-surface h-[560px] w-[280px] flex-none animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <HorizontalSlider perfumes={destacados} dolarMedio={dolarMedio} onAgregar={agregar} promociones={promociones} />
        )}
      </section>

      {/* ── ¿No sabés cuál elegir? Las dos salidas para quien duda ── */}
      <section aria-label="Ayuda para elegir" className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card-surface relative flex flex-col items-start gap-4 overflow-hidden rounded-2xl p-7 sm:p-9">
            <span aria-hidden="true" className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet/10 blur-2xl" />
            <Sparkles size={22} className="text-lila" aria-hidden="true" />
            <div>
              <h2 className="font-display text-2xl font-light tracking-tight text-text sm:text-3xl">¿No sabés cuál elegir?</h2>
              <p className="mt-2 max-w-sm font-body text-sm leading-relaxed text-text-secondary">
                Respondé unas preguntas rápidas y te recomendamos el ideal para vos.
              </p>
            </div>
            <button
              type="button"
              onClick={abrirAsistente}
              className="gradient-violet mt-auto rounded-full px-6 py-3 font-body text-sm font-semibold text-white shadow-lg shadow-violet/20 transition-all hover:shadow-violet/40 hover:brightness-110"
            >
              Encontrá tu perfume
            </button>
          </div>
          <div className="card-surface relative flex flex-col items-start gap-4 overflow-hidden rounded-2xl p-7 sm:p-9">
            <span aria-hidden="true" className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet/10 blur-2xl" />
            <span className="font-display text-xl font-light text-lila" aria-hidden="true">3 · 5 · 10 ml</span>
            <div>
              <h2 className="font-display text-2xl font-light tracking-tight text-text sm:text-3xl">Probalo antes</h2>
              <p className="mt-2 max-w-sm font-body text-sm leading-relaxed text-text-secondary">
                Los decants son porciones chicas de perfumes originales, para conocerlos sin comprar el frasco entero.
              </p>
            </div>
            <Link
              to="/decants"
              className="mt-auto inline-flex items-center gap-2 rounded-full border border-violet/40 px-6 py-3 font-body text-sm font-semibold text-text transition-all hover:border-violet hover:bg-violet/10"
            >
              Ver decants
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {nuevos?.length > 0 && (
        <section className="diferir-render mx-auto max-w-7xl px-4 pb-14 sm:px-6">
          <TituloSeccion etiqueta="Recién llegados" titulo="Nuevos ingresos" />
          <HorizontalSlider perfumes={nuevos} dolarMedio={dolarMedio} onAgregar={agregar} promociones={promociones} etiqueta="Nuevos ingresos" />
        </section>
      )}

      <PorQueFraganzia catalogo={catalogo} />

      {/* ── Cómo comprar: reemplaza a las preguntas frecuentes, que repetían lo de la franja ── */}
      <section aria-labelledby="como-comprar" className="diferir-render mx-auto max-w-5xl px-4 pb-6 sm:px-6">
        <h2 id="como-comprar" className="mb-10 text-center font-display text-3xl font-light tracking-tight text-text sm:text-4xl">
          Comprar es simple
        </h2>
        <ol className="grid gap-8 sm:grid-cols-3 sm:gap-6">
          {PASOS.map(({ titulo, texto }, i) => (
            <li key={titulo} className="flex gap-4 sm:flex-col sm:items-center sm:text-center">
              <span
                aria-hidden="true"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-violet/50 font-display text-lg font-light text-lila"
              >
                {i + 1}
              </span>
              <div>
                <h3 className="font-display text-lg font-medium text-text">{titulo}</h3>
                <p className="mt-1.5 font-body text-sm leading-relaxed text-text-secondary">{texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
