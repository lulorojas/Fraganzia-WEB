import { Link } from 'react-router-dom';
import { PrecioNoDisponible } from './PrecioNoDisponible';
import { preciosPorMetodo, getMejorPromo } from '../../utils/precios';
import { formatARS } from '../../utils/format';
import { useConfig } from '../../hooks/useConfig';
import { usePromocionesActivas } from '../../hooks/usePromociones';

export function PerfumeCard({ perfume, dolarMedio, onAgregar }) {
  const { data: config } = useConfig();
  const { data: promociones } = usePromocionesActivas();

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

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl glass glass-hover-subtle transition-all duration-300">

      {/* ── Imagen: fondo blanco puro como las fotos ── */}
      <Link to={`/perfume/${perfume.id}`} className="relative block overflow-hidden bg-white">
        {perfume.imagenes?.[0] ? (
          <img
            src={perfume.imagenes[0]}
            alt={perfume.nombre}
            className="aspect-square w-full object-contain p-6 transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="aspect-square w-full flex items-center justify-center bg-white">
            <span className="text-6xl opacity-10 select-none text-violet">✦</span>
          </div>
        )}
        {pct > 0 && (
          <span className="absolute top-3 right-3 rounded-full bg-gradient-to-r from-violet to-lila px-3 py-1.5 text-xs font-bold text-white shadow-xl">
            -{pct}%
          </span>
        )}
      </Link>

      {/* ── Info: marca + nombre ── */}
      <Link to={`/perfume/${perfume.id}`} className="px-5 pt-4 pb-2 block">
        <p className="text-xs font-semibold uppercase tracking-wide2 text-lila mb-1.5 truncate">{perfume.marca}</p>
        <h3 className="font-display text-base font-semibold leading-snug text-text line-clamp-2 min-h-[2.5rem]">{perfume.nombre}</h3>
      </Link>

      {/* ── Divider gradiente ── */}
      <div className="px-5">
        <div className="h-px bg-gradient-to-r from-violet/10 via-violet/40 to-violet/10" />
      </div>

      {/* ── Precios + botón ── */}
      <div className="mt-auto px-5 pb-5 pt-3 flex flex-col gap-3">
        {tienePrecios ? (
          pct > 0 ? (
            <div className="space-y-1.5">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-text-secondary">Transferencia</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-text-secondary/40 line-through">{formatARS(precios.precioTransferencia)}</span>
                  <span className="text-base font-bold text-emerald-600">{formatARS(precioTransConPromo)}</span>
                </div>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-text-secondary">Efectivo</span>
                <span className="text-sm font-semibold text-emerald-600">{formatARS(precioEfecConPromo)}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-text-secondary">Transferencia</span>
                <span className="text-base font-bold text-text">{formatARS(precios.precioTransferencia)}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-text-secondary">Efectivo</span>
                <span className="text-sm font-semibold text-text-secondary">{formatARS(precios.precioEfectivo)}</span>
              </div>
            </div>
          )
        ) : (
          <PrecioNoDisponible nombrePerfume={perfume.nombre} whatsappNumero={config?.whatsappNumero} />
        )}
        <button
          onClick={() => onAgregar?.(perfume)}
          className="w-full rounded-xl bg-violet/10 hover:bg-violet border border-violet/30 hover:border-violet py-2.5 text-sm font-semibold text-text transition-all duration-300 hover:shadow-lg hover:shadow-violet/30"
        >
          Agregar al carrito
        </button>
      </div>
    </div>
  );
}
