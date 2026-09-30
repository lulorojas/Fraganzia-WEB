import { Link } from 'react-router-dom';
import { Instagram, Sparkles, Star } from 'lucide-react';
import { usePerfumes } from '../hooks/usePerfumes';
import { useDolarBlue } from '../hooks/useDolarBlue';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { usePromocionesActivas } from '../hooks/usePromociones';
import { HorizontalSlider } from '../components/perfumes/HorizontalSlider';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { LogoFraganzia } from '../components/ui/LogoFraganzia';

export default function Home() {
  const { data: destacados, isLoading } = usePerfumes({ destacado: true });
  const { dolarMedio } = useDolarBlue();
  const { dispatch } = useCart();
  const { showToast } = useToast();
  const { data: promociones } = usePromocionesActivas();
  useDocumentMeta({ path: '/' });

  function handleAgregar(perfume) {
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        perfumeId: perfume.id,
        nombre: perfume.nombre,
        marca: perfume.marca,
        precioUSD: perfume.precioUSD,
        imagenes: perfume.imagenes,
        cantidad: 1,
      },
    });
    showToast(`${perfume.marca} ${perfume.nombre}`, 'success');
  }

  return (
    <div className="relative min-h-screen">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 sm:px-6 py-16 sm:py-24 lg:py-32">
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
          <div className="glass-strong relative overflow-hidden p-6 sm:p-10 md:p-16 rounded-2xl sm:rounded-[32px]">
            {/* Label superior con íconos */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2.5 mb-6 sm:mb-8 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full glass border border-lila/20 text-lila text-[10px] sm:text-xs uppercase tracking-wide sm:tracking-wide2 font-semibold shadow-lg">
              <Sparkles size={14} className="shrink-0" aria-hidden="true" />
              <span className="whitespace-nowrap">Fragancias Importadas</span>
              <Star size={12} className="text-violet-light shrink-0" aria-hidden="true" />
            </div>

            {/* Logo principal: una sola imagen que cambia de tamaño por breakpoint.
                Sin animación de entrada: es el elemento más grande (LCP) y tiene
                que verse apenas se pinta la página. */}
            <div className="mb-6 sm:mb-8 flex justify-center">
              <LogoFraganzia
                priority
                className="drop-shadow-2xl [--logo-scale:1.6] sm:[--logo-scale:2.6] md:[--logo-scale:3.2]"
                sizes="(min-width: 768px) 115px, (min-width: 640px) 94px, 58px"
              />
            </div>

            {/* Tagline con Cinzel */}
            <h1 className="font-luxury text-2xl sm:text-4xl md:text-5xl italic text-transparent bg-clip-text bg-gradient-to-r from-text via-lila to-text mb-3 text-center leading-tight">
              Perfumes Árabes de Alta Gama
            </h1>

            {/* Descripción mejorada */}
            <p className="text-text-secondary text-sm sm:text-base md:text-lg max-w-2xl mx-auto mb-8 sm:mb-10 text-center leading-relaxed px-2">
              Descubrí la elegancia de las fragancias orientales. <br className="hidden sm:block" />
              <span className="text-lila">Exclusividad</span> y <span className="text-lila">calidad premium</span> en cada esencia.
            </p>

            {/* CTAs mejorados */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 mb-10 sm:mb-12 animate-fade-up w-full sm:w-auto">
              <Link
                to="/catalogo"
                className="relative group/btn px-8 sm:px-10 py-3.5 sm:py-4 rounded-full font-body font-bold text-sm sm:text-base text-text tracking-wide overflow-hidden shadow-2xl hover:shadow-violet/50 transition-all duration-300 hover:scale-105 text-center"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-violet via-violet-light to-violet" />
                <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-gradient-to-r from-white/20 to-transparent" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Ver Catálogo
                  <Sparkles size={16} className="sm:w-[18px] sm:h-[18px]" aria-hidden="true" />
                </span>
              </Link>
              <a
                href="https://www.instagram.com/fraganzia.ar/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center gap-2 sm:gap-2.5 px-6 sm:px-8 py-3.5 sm:py-4 rounded-full glass-hover border border-lila/30 font-body text-sm sm:text-base text-text-secondary hover:text-text transition-all duration-300"
              >
                <Instagram size={18} className="sm:w-5 sm:h-5 group-hover:text-lila transition-colors" aria-hidden="true" />
                <span>@fraganzia.ar</span>
              </a>
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
          </div>
        </div>
      </section>

      {/* ── Destacados Slider ────────────────────────────────── */}
      <section className="px-6 py-16 max-w-7xl mx-auto">
        <div className="mb-8 flex items-baseline justify-between">
          <h2 className="font-display text-3xl text-text">Destacados</h2>
          <Link to="/catalogo" className="font-body text-sm text-lila transition-base hover:text-text tracking-wide2 uppercase">
            Ver todo →
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
          <HorizontalSlider perfumes={destacados} dolarMedio={dolarMedio} onAgregar={handleAgregar} />
        )}
      </section>

      {/* ── Promociones ──────────────────────────────────────── */}
      {promociones?.length > 0 && (
        <section className="px-6 py-16 max-w-7xl mx-auto">
          <h2 className="mb-8 font-display text-3xl text-text">Promociones</h2>
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
