import { Link } from 'react-router-dom';
import { PrecioNoDisponible } from './PrecioNoDisponible';
import { preciosPorMetodo, getMejorPromo } from '../../utils/precios';
import { formatARS, nombreCompleto } from '../../utils/format';
import { ImagenProducto } from './ImagenProducto';

/**
 * `config` y `promociones` los pasa la grilla (una sola suscripción para
 * todas las cards). `prioridad` = la card está arriba de todo: su imagen se
 * carga ya, sin lazy loading, porque suele ser el LCP de la página.
 */
export function PerfumeCard({ perfume, dolarMedio, onAgregar, config, promociones, prioridad = false }) {
  const tieneCotizacion = Boolean(dolarMedio);

  // Prioridad: cálculo en vivo con API → precios guardados en Firestore → sin precio
  const precios = tieneCotizacion
    ? preciosPorMetodo(perfume.precioUSD, dolarMedio)
    : (perfume.precioTransferencia
        ? { precioTransferencia: perfume.precioTransferencia, precioEfectivo: perfume.precioEfectivo }
        : null);
  const tienePrecios = Boolean(precios);

  const promo = getMejorPromo(perfume.id, promociones);
  const pct = promo?.descuentoPorcentaje ?? 0;
  const precioTransConPromo = precios && pct ? Math.round(precios.precioTransferencia * (1 - pct / 100) / 1000) * 1000 : null;
  const precioEfecConPromo  = precios && pct ? Math.round(precios.precioEfectivo      * (1 - pct / 100) / 1000) * 1000 : null;

  const url = `/perfume/${perfume.id}`;
  const imagen = perfume.imagenes?.[0];

  return (
    <article className="card-surface card-hover group flex w-full flex-col overflow-hidden rounded-2xl">

      {/* ── Imagen: fondo blanco puro como las fotos ── */}
      {/* El link de la imagen repite el del título: se saca del orden de tabulación
          para que teclado y lectores de pantalla lo encuentren una sola vez. */}
      <Link to={url} tabIndex={-1} aria-hidden="true" className="relative block overflow-hidden bg-white">
        {imagen ? (
          <ImagenProducto
            url={imagen}
            sizes="(min-width: 1280px) 300px, (min-width: 1024px) 23vw, (min-width: 640px) 31vw, 48vw"
            width="400"
            height="400"
            prioridad={prioridad}
            className="aspect-square w-full object-contain p-3 sm:p-6 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="aspect-square w-full flex items-center justify-center bg-white">
            <span className="text-6xl opacity-10 select-none text-violet">✦</span>
          </div>
        )}
        {pct > 0 && (
          <span className="absolute top-3 right-3 rounded-full bg-violet px-3 py-1.5 text-xs font-bold text-white shadow-xl">
            -{pct}%
          </span>
        )}
      </Link>

      {/* ── Info: marca + nombre ── */}
      <Link to={url} className="block px-3 pt-3 pb-2 sm:px-5 sm:pt-4 focus-visible:outline-offset-[-2px]">
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wide2 text-lila mb-1 sm:mb-1.5 truncate">{perfume.marca}</p>
        <h2 className="font-display text-sm sm:text-base font-semibold leading-snug text-text line-clamp-2 min-h-[2.5rem] sm:min-h-[2.75rem]">{perfume.nombre}</h2>
      </Link>

      {/* ── Divider gradiente ── */}
      <div className="px-3 sm:px-5">
        <div className="h-px bg-gradient-to-r from-violet/10 via-violet/40 to-violet/10" />
      </div>

      {/* ── Precios + botón ── */}
      <div className="mt-auto px-3 pb-3 pt-3 sm:px-5 sm:pb-5 flex flex-col gap-3">
        {tienePrecios ? (
          pct > 0 ? (
            <div className="space-y-1.5 tabular-nums">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-text-secondary"><span className="sm:hidden">Transf.</span><span className="hidden sm:inline">Transferencia</span></span>
                <div className="flex flex-col items-end sm:flex-row sm:items-baseline sm:gap-2">
                  <span className="text-xs text-text-secondary line-through">
                    <span className="sr-only">Antes </span>{formatARS(precios.precioTransferencia)}
                  </span>
                  <span className="text-sm sm:text-base font-bold text-emerald-400">{formatARS(precioTransConPromo)}</span>
                </div>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-text-secondary">Efectivo</span>
                <span className="text-xs sm:text-sm font-semibold text-emerald-400">{formatARS(precioEfecConPromo)}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 tabular-nums">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-text-secondary"><span className="sm:hidden">Transf.</span><span className="hidden sm:inline">Transferencia</span></span>
                <span className="text-sm sm:text-base font-bold text-text">{formatARS(precios.precioTransferencia)}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-text-secondary">Efectivo</span>
                <span className="text-xs sm:text-sm font-semibold text-text-secondary">{formatARS(precios.precioEfectivo)}</span>
              </div>
            </div>
          )
        ) : (
          <PrecioNoDisponible nombrePerfume={perfume.nombre} whatsappNumero={config?.whatsappNumero} />
        )}
        <button
          type="button"
          onClick={() => onAgregar?.(perfume)}
          aria-label={`Agregar ${nombreCompleto(perfume)} al carrito`}
          className="w-full rounded-xl bg-violet/10 hover:bg-violet border border-violet/30 hover:border-violet py-2.5 text-xs sm:text-sm font-semibold text-text transition-colors duration-300"
        >
          Agregar al carrito
        </button>
      </div>
    </article>
  );
}
