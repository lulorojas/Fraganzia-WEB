import { Link } from 'react-router-dom';
import { ArrowRight, Compass, Gift } from 'lucide-react';
import { usePerfumes } from '../hooks/usePerfumes';
import { useDolarBlue } from '../hooks/useDolarBlue';
import { useCart } from '../context/CartContext';
import { usePromocionesActivas } from '../hooks/usePromociones';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { abrirAsistente } from '../components/asistente/BotonAsistente';
import { PerfumeCard } from '../components/perfumes/PerfumeCard';
import { PerfumeGridSkeleton } from '../components/perfumes/PerfumeCardSkeleton';
import { ImagenProducto } from '../components/perfumes/ImagenProducto';
import { VigenciaPromo } from '../components/ui/VigenciaPromo';

const AROMAS = ['Oriental', 'Floral', 'Amaderado', 'Gourmand'];

const PASOS = [
  { titulo: 'Elegí tus perfumes', texto: 'Con el + los sumás al carrito. Con el corazón guardás los que te gustan para decidir después.' },
  { titulo: 'Confirmá el pedido', texto: 'Solo con tu nombre, sin crear una cuenta.' },
  { titulo: 'Lo coordinamos por WhatsApp', texto: 'Acordamos pago y entrega, y seguís tu pedido con un link.' },
];

const GRILLA = 'grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4';

function TituloSeccion({ etiqueta, titulo, id }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <p className="mb-2.5 font-body text-[11px] font-semibold uppercase tracking-luxury text-lila">{etiqueta}</p>
        <h2 id={id} className="font-display text-[1.7rem] font-extralight leading-tight tracking-tight text-text sm:text-4xl">{titulo}</h2>
      </div>
      <Link to="/catalogo" className="flex shrink-0 items-center gap-1.5 pb-1 font-body text-sm font-semibold text-lila transition-base hover:text-text">
        Ver todo <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </div>
  );
}

/** Ventana clara con la foto original, apenas inclinada, que adorna una puerta (es decorativa: el nombre ya está en el catálogo). */
function Flotante({ perfume, className }) {
  const imagen = perfume?.imagenes?.[0];
  if (!imagen) return null;
  return (
    <div aria-hidden="true" className={`plinto pointer-events-none absolute grid aspect-square place-items-center overflow-hidden rounded-2xl shadow-[0_14px_30px_rgba(0,0,0,0.5)] ${className}`}>
      <ImagenProducto url={imagen} alt="" sizes="220px" width="220" height="220" prioridad className="foto-producto h-[88%] w-[88%] object-contain" />
    </div>
  );
}

export default function Home() {
  const { data: destacados, isLoading } = usePerfumes({ destacado: true });
  const { data: catalogo } = usePerfumes();
  const { dolarMedio } = useDolarBlue();
  const { agregar } = useCart();
  const { data: promociones } = usePromocionesActivas();
  useDocumentMeta({ path: '/' });

  // Las ventanas que adornan las puertas: perfumes distintos y con foto.
  const flotantes = (destacados ?? []).filter((p) => p.imagenes?.[0]);
  const masElegidos = destacados?.slice(0, 8);
  // El catálogo viene de más nuevo a más viejo: las novedades son los primeros que no están ya arriba.
  const idsArriba = new Set(masElegidos?.map((p) => p.id));
  const novedades = catalogo?.filter((p) => !idsArriba.has(p.id)).slice(0, 8);

  const tarjeta = (p, i) => (
    <li key={p.id} className="flex">
      <PerfumeCard perfume={p} dolarMedio={dolarMedio} onAgregar={agregar} promociones={promociones} prioridad={i < 2} />
    </li>
  );

  return (
    <div className="relative">
      {/* ── Dos puertas: la portada es una decisión ─────────── */}
      <section aria-labelledby="titular" className="px-4 pb-6 pt-9 sm:px-6 sm:pb-8 sm:pt-14">
        <div className="mx-auto max-w-7xl">
          <p className="mb-3 font-body text-[11px] font-semibold uppercase tracking-luxury text-lila">Perfumería árabe original</p>
          <h1 id="titular" className="mb-6 font-display text-[2.2rem] font-extralight leading-[1.05] tracking-[-0.035em] text-text text-balance sm:mb-8 sm:text-6xl">
            Encontrá el perfume que te define
          </h1>
          <div className="grid gap-3.5 md:grid-cols-2 md:gap-5">
            <button type="button" onClick={abrirAsistente} className="puerta group">
              <div className="relative z-10 flex h-full max-w-[60%] flex-col gap-2.5 p-6 sm:p-8 md:max-w-[62%]">
                <Gift size={30} strokeWidth={1.5} className="text-lila" aria-hidden="true" />
                <h2 className="font-display text-[1.9rem] font-extralight leading-none tracking-tight text-text sm:text-5xl">Regalar</h2>
                <p className="max-w-[30ch] font-body text-[14.5px] leading-snug text-[#b9aed6]">Respondé unas preguntas y te sugerimos el perfume ideal para esa persona.</p>
                <span className="mt-auto inline-flex items-center gap-2 pt-3 font-body text-[14.5px] font-semibold text-text">
                  Encontrá tu perfume <ArrowRight size={18} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
                </span>
              </div>
              <Flotante perfume={flotantes[1]} className="bottom-[8%] right-[5%] w-[34%] rotate-[4deg]" />
              <Flotante perfume={flotantes[2]} className="bottom-[4%] right-[32%] hidden w-[26%] -rotate-[5deg] sm:grid" />
            </button>

            <Link to="/catalogo" className="puerta group">
              <div className="relative z-10 flex h-full max-w-[60%] flex-col gap-2.5 p-6 sm:p-8 md:max-w-[62%]">
                <Compass size={30} strokeWidth={1.5} className="text-lila" aria-hidden="true" />
                <h2 className="font-display text-[1.9rem] font-extralight leading-none tracking-tight text-text sm:text-5xl">Explorar</h2>
                <p className="max-w-[30ch] font-body text-[14.5px] leading-snug text-[#b9aed6]">Recorré el catálogo por aroma, notas o marca, y compará.</p>
                <ul className="flex flex-wrap gap-1.5" aria-label="Aromas">
                  {AROMAS.map((a) => (
                    <li key={a} className="rounded-full border border-border px-3 py-1 font-body text-xs text-[#d7caf2]">{a}</li>
                  ))}
                </ul>
                <span className="mt-auto inline-flex items-center gap-2 pt-3 font-body text-[14.5px] font-semibold text-text">
                  Ver el catálogo <ArrowRight size={18} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
                </span>
              </div>
              <Flotante perfume={flotantes[3]} className="bottom-[8%] right-[5%] w-[32%] -rotate-[3deg]" />
              <Flotante perfume={flotantes[4]} className="bottom-[4%] right-[30%] hidden w-[26%] rotate-[5deg] sm:grid" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Promociones vigentes ─────────────────────────────── */}
      {promociones?.length > 0 && (
        <section aria-label="Promociones" className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className={`grid gap-5 ${promociones.length > 1 ? 'md:grid-cols-2' : 'mx-auto max-w-5xl'}`}>
            {promociones.map((promo, i) => (
              <Link key={promo.id} to="/catalogo?ofertas=1" className="vitrina group block overflow-hidden rounded-[22px]">
                {promo.imagen && (
                  <img
                    src={promo.imagen}
                    alt={promo.titulo}
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
                    {promo.descripcion && <p className="mt-1 text-sm leading-relaxed text-text-secondary">{promo.descripcion}</p>}
                    {promo.perfumeIds?.length > 0 && (
                      <p className="mt-1 text-xs text-text-secondary">
                        Válida en {promo.perfumeIds.length} {promo.perfumeIds.length === 1 ? 'perfume seleccionado' : 'perfumes seleccionados'}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <VigenciaPromo promo={promo} />
                    <span className="font-body text-sm font-semibold text-lila transition-colors group-hover:text-text">Ver perfumes</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Los más elegidos ─────────────────────────────────── */}
      <section aria-labelledby="h-elegidos" className="diferir-render mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <TituloSeccion etiqueta="Selección" titulo="Los más elegidos" id="h-elegidos" />
        {isLoading ? <PerfumeGridSkeleton cantidad={8} /> : <ul className={GRILLA} aria-label="Los más elegidos">{masElegidos?.map(tarjeta)}</ul>}
      </section>

      {/* ── Decants ──────────────────────────────────────────── */}
      <section aria-labelledby="h-decants" className="border-y border-border bg-gradient-to-br from-[#1a1038] to-[#0e0a22]">
        <div className="mx-auto grid max-w-7xl items-center gap-5 px-4 py-10 sm:px-6 md:grid-cols-[1.3fr_auto_auto] md:gap-9">
          <div>
            <p className="mb-2.5 font-body text-[11px] font-semibold uppercase tracking-luxury text-lila">Probalo antes</p>
            <h2 id="h-decants" className="font-display text-[1.7rem] font-extralight tracking-tight text-text sm:text-4xl">Decants originales</h2>
            <p className="mt-2 max-w-[42ch] font-body text-[#b9aed6]">Fracciones de perfumes originales para conocerlos sin comprar el frasco entero.</p>
          </div>
          <ul className="flex gap-2.5" aria-label="Tamaños de decant">
            {[3, 5, 10].map((ml) => (
              <li key={ml} className="flex items-baseline gap-1 rounded-2xl border border-border px-[18px] py-2.5 font-body text-[13px] text-text-secondary">
                <b className="font-display text-[1.75rem] font-light text-text">{ml}</b>ml
              </li>
            ))}
          </ul>
          <Link to="/decants" className="inline-flex w-max items-center gap-2 rounded-full border border-lila/55 px-6 py-3 font-body text-[14.5px] font-semibold text-text transition-colors hover:bg-violet/25">
            Ver decants <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* ── Novedades ────────────────────────────────────────── */}
      {novedades?.length > 0 && (
        <section aria-labelledby="h-novedades" className="diferir-render mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <TituloSeccion etiqueta="Recién llegados" titulo="Novedades" id="h-novedades" />
          <ul className={GRILLA} aria-label="Novedades">{novedades.map(tarjeta)}</ul>
        </section>
      )}

      {/* ── La marca y cómo comprar ──────────────────────────── */}
      <section aria-labelledby="h-marca" className="diferir-render mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">
        <div className="grid items-center gap-8 md:grid-cols-[1.1fr_1fr] md:gap-14">
          <div>
            <p className="mb-2.5 font-body text-[11px] font-semibold uppercase tracking-luxury text-lila">Fraganzia</p>
            <h2 id="h-marca" className="font-display text-[1.7rem] font-extralight leading-tight tracking-tight text-text sm:text-4xl">Perfumería árabe, elegida con criterio</h2>
            <p className="my-4 max-w-[50ch] font-body text-[#b9aed6]">
              Nació de la búsqueda de fragancias que cuenten historias y sean accesibles sin resignar calidad. Hoy es un catálogo cuidadosamente curado.
            </p>
            <Link to="/sobre-nosotros" className="inline-flex items-center gap-1.5 font-body text-sm font-semibold text-lila transition-base hover:text-text">
              Conocé Fraganzia <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <ol className="grid gap-3.5">
            {PASOS.map(({ titulo, texto }, i) => (
              <li key={titulo} className="flex items-start gap-3.5 font-body text-sm text-[#b9aed6]">
                <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-lila/50 font-display text-[17px] font-light text-lila">{i + 1}</span>
                <span>
                  <strong className="block text-[15px] font-semibold text-text">{titulo}</strong>
                  {texto}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
