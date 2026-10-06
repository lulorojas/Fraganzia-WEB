import { Link } from 'react-router-dom';
import { Instagram, Sparkles } from 'lucide-react';
import { usePerfumes } from '../hooks/usePerfumes';
import { useDolarBlue } from '../hooks/useDolarBlue';
import { useCart } from '../context/CartContext';
import { usePromocionesActivas } from '../hooks/usePromociones';
import { HorizontalSlider } from '../components/perfumes/HorizontalSlider';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { LogoFraganzia } from '../components/ui/LogoFraganzia';
import { abrirAsistente } from '../components/asistente/BotonAsistente';

export default function Home() {
  const { data: destacados, isLoading } = usePerfumes({ destacado: true });
  const { dolarMedio } = useDolarBlue();
  const { agregar } = useCart();
  const { data: promociones } = usePromocionesActivas();
  useDocumentMeta({ path: '/' });

  return (
    <div className="relative min-h-screen">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="grano relative overflow-hidden px-4 sm:px-6 py-16 sm:py-24 lg:py-32">
        {/* Resplandores de ambiente: gradientes radiales (ya difusos), sin
            filter: blur ni animación, que costaban mucho repintado. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 0%, rgba(123,47,190,0.35) 0%, rgba(123,47,190,0) 40%), radial-gradient(circle at 85% 25%, rgba(192,132,252,0.18) 0%, rgba(192,132,252,0) 25%), radial-gradient(circle at 12% 85%, rgba(123,47,190,0.15) 0%, rgba(123,47,190,0) 22%)',
          }}
        />

        {/* Glass card container con más profundidad */}
        <div className="relative mx-auto max-w-4xl">
          <div className="relative overflow-hidden p-2 sm:p-6 md:p-10">
            {/* Sin animación de entrada: el logo es el LCP y tiene que verse apenas se pinta. */}
            <div className="mb-6 sm:mb-8 flex justify-center">
              <LogoFraganzia
                priority
                className="drop-shadow-2xl [--logo-scale:1.6] sm:[--logo-scale:2.6] md:[--logo-scale:3.2]"
                sizes="(min-width: 768px) 115px, (min-width: 640px) 94px, 58px"
              />
            </div>

            {/* Tagline con Cinzel */}
            <h1 className="font-luxury text-3xl sm:text-5xl md:text-6xl tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-text via-text to-lila mb-5 text-center leading-[1.1] text-balance">
              Perfumes Árabes de Alta Gama
            </h1>

            {/* Descripción */}
            <p className="text-text-secondary text-sm sm:text-base md:text-lg max-w-xl mx-auto mb-8 sm:mb-10 text-center leading-relaxed px-2 text-balance">
              Descubrí la elegancia de las fragancias orientales: exclusividad y calidad premium en cada esencia.
            </p>

            {/* CTAs mejorados */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 mb-10 sm:mb-12 animate-fade-up w-full sm:w-auto">
              <button
                type="button"
                onClick={abrirAsistente}
                className="relative group/btn px-8 sm:px-10 py-3.5 sm:py-4 rounded-full font-body font-bold text-sm sm:text-base text-text tracking-wide overflow-hidden shadow-2xl hover:shadow-violet/50 transition-all duration-300 hover:scale-105 text-center"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-violet via-violet-light to-violet" />
                <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-gradient-to-r from-white/20 to-transparent" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Sparkles size={16} className="sm:w-[18px] sm:h-[18px]" aria-hidden="true" />
                  Encontrá tu perfume
                </span>
              </button>
              <Link
                to="/catalogo"
                className="flex items-center justify-center px-6 sm:px-8 py-3.5 sm:py-4 rounded-full glass-hover border border-lila/30 font-body text-sm sm:text-base text-text transition-all duration-300 hover:border-lila/60"
              >
                Ver catálogo
              </Link>
            </div>

            {/* Ornamental divider - más elaborado */}
            <div className="flex items-center justify-center gap-4 sm:gap-6" aria-hidden="true">
              <div className="h-px w-16 sm:w-24 bg-gradient-to-r from-transparent via-violet/60 to-transparent" />
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-violet/70 text-xl sm:text-2xl">✦</span>
                <span className="text-lila/50 text-base sm:text-lg">◆</span>
                <span className="text-violet/70 text-xl sm:text-2xl">✦</span>
              </div>
              <div className="h-px w-16 sm:w-24 bg-gradient-to-r from-transparent via-violet/60 to-transparent" />
            </div>

            {/* Detalles adicionales */}
            <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-text-secondary">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/70 shrink-0"></span>
                <span className="whitespace-nowrap">Envíos AMBA</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet/70 shrink-0"></span>
                <span className="whitespace-nowrap">100% Originales</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-lila/70 shrink-0"></span>
                <span className="whitespace-nowrap">Consultas WhatsApp</span>
              </span>
            </div>

            <p className="mt-6 text-center text-xs text-text-secondary">
              <a
                href="https://www.instagram.com/fraganzia.ar/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-lila"
              >
                <Instagram size={14} aria-hidden="true" />
                Seguinos en @fraganzia.ar
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ── Destacados Slider ────────────────────────────────── */}
      <section className="px-6 py-16 max-w-7xl mx-auto">
        <div className="mb-8 flex items-baseline justify-between">
          <h2 className="font-luxury text-2xl tracking-wide text-text sm:text-3xl">Destacados</h2>
          <Link to="/catalogo" className="font-body text-sm text-lila transition-base hover:text-text">
            Ver todo el catálogo
          </Link>
        </div>
        {isLoading ? (
          // Mismo alto que el slider cargado, para que la página no salte.
          <div className="flex gap-4 overflow-hidden pb-4" role="status" aria-label="Cargando destacados">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="card-surface h-[560px] w-[280px] flex-none animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <HorizontalSlider perfumes={destacados} dolarMedio={dolarMedio} onAgregar={agregar} />
        )}
      </section>

      {/* ── Promociones ──────────────────────────────────────── */}
      {promociones?.length > 0 && (
        <section className="px-6 py-16 max-w-7xl mx-auto">
          <h2 className="mb-8 font-luxury text-2xl tracking-wide text-text sm:text-3xl">Promociones</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {promociones.map((promo) => (
              <div key={promo.id} className="card-surface card-hover overflow-hidden rounded-2xl group">
                {promo.imagen && (
                  <div className="overflow-hidden bg-[#F5F2FB]">
                    <img
                      src={promo.imagen}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      width="600"
                      height="192"
                      className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="p-5">
                  <h3 className="font-display text-lg font-semibold text-text mb-2">{promo.titulo}</h3>
                  {promo.descripcion && (
                    <p className="text-sm text-text-secondary leading-relaxed">{promo.descripcion}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
