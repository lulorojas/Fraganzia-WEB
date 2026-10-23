import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PrecioNoDisponible } from './PrecioNoDisponible';
import { preciosPorMetodo, getMejorPromo } from '../../utils/precios';
import { formatARS, nombreCompleto, tituloCard } from '../../utils/format';
import { fuenteRecorte, PLACEHOLDER_PERFUME } from '../../utils/image';
import { ImagenProducto } from './ImagenProducto';
import { BotonFavorito } from './BotonFavorito';

/**
 * Foto del producto sobre el escenario oscuro. Si hay foto recortada flota sobre la luz violeta;
 * si todavía no (una foto recién cargada desde el admin, sin procesar), se muestra la original
 * en una ventana clara hasta que se corra tools/recortar-fotos.mjs.
 */
function Escenario({ imagen, alt, prioridad }) {
  const recorte = fuenteRecorte(imagen);
  if (recorte) {
    return (
      <div className="escenario">
        <img
          src={recorte}
          alt={alt}
          width="480"
          height="570"
          loading={prioridad ? 'eager' : 'lazy'}
          fetchpriority={prioridad ? 'high' : undefined}
          decoding="async"
          className="foto-recorte"
          onError={(e) => {
            if (e.currentTarget.dataset.fallo) return;
            e.currentTarget.dataset.fallo = '1';
            e.currentTarget.src = PLACEHOLDER_PERFUME;
          }}
        />
      </div>
    );
  }
  return (
    <div className="escenario p-2.5">
      <div className="plinto relative grid h-full w-full place-items-center overflow-hidden rounded-[18px]">
        {imagen ? (
          <ImagenProducto
            url={imagen}
            alt={alt}
            sizes="(min-width: 1280px) 300px, (min-width: 1024px) 23vw, (min-width: 640px) 31vw, 48vw"
            width="400"
            height="400"
            prioridad={prioridad}
            className="foto-producto h-[84%] w-[80%] object-contain"
          />
        ) : (
          <span className="select-none text-6xl text-violet opacity-20" aria-hidden="true">✦</span>
        )}
      </div>
    </div>
  );
}

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

  const promo = getMejorPromo(perfume.id, promociones);
  const pct = promo?.descuentoPorcentaje ?? 0;
  const conPromo = (n) => Math.round((n * (1 - pct / 100)) / 1000) * 1000;

  const url = `/perfume/${perfume.id}`;
  const imagen = perfume.imagenes?.[0];
  const completo = nombreCompleto(perfume);
  const meta = [perfume.familiaOlfativa, perfume.genero].filter(Boolean).join(' · ');

  return (
    <article className="vitrina group relative flex w-full flex-col overflow-hidden rounded-[22px]">
      {/* Fuera del link de la imagen: un botón no puede ir dentro de un <a>. */}
      <BotonFavorito perfume={perfume} variante="oscuro" className="absolute right-2.5 top-2.5 z-10" />
      {pct > 0 && (
        <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-violet px-2.5 py-1 text-[11px] font-bold text-white shadow-lg">
          -{pct}%
        </span>
      )}

      {/* El link de la imagen repite el del título: se saca del orden de tabulación
          para que teclado y lectores de pantalla lo encuentren una sola vez. */}
      <Link to={url} tabIndex={-1} aria-hidden="true" className="block">
        <Escenario imagen={imagen} alt="" prioridad={prioridad} />
      </Link>

      <div className="flex flex-1 flex-col gap-0.5 px-3.5 pb-4 pt-3 sm:px-4">
        <p className="truncate font-body text-[10.5px] font-bold uppercase tracking-[0.2em] text-lila">{perfume.marca}</p>
        <h2 className="line-clamp-2 min-h-[2.5em] font-display text-base font-medium leading-tight tracking-tight text-text">
          <Link to={url} className="focus-visible:outline-offset-4">
            {tituloCard(perfume)}
            <span className="sr-only"> ({completo})</span>
          </Link>
        </h2>
        {meta && <p className="font-body text-xs text-text-secondary">{meta}</p>}

        <div className="mt-auto pt-2.5">
          {precios ? (
            <div className="flex items-end justify-between gap-2 pr-11 tabular-nums">
              <div>
                <span className="block font-body text-[10px] uppercase tracking-wide text-text-secondary">Transferencia</span>
                {pct > 0 && (
                  <span className="block text-xs text-text-secondary line-through">
                    <span className="sr-only">Antes </span>
                    {formatARS(precios.precioTransferencia)}
                  </span>
                )}
                <b className={`font-display text-xl font-semibold tracking-tight ${pct > 0 ? 'text-emerald-400' : 'text-text'}`}>
                  {formatARS(pct > 0 ? conPromo(precios.precioTransferencia) : precios.precioTransferencia)}
                </b>
              </div>
              <div className="text-right">
                <span className="block font-body text-[10px] uppercase tracking-wide text-text-secondary">Efectivo</span>
                <span className={`font-body text-[13px] ${pct > 0 ? 'text-emerald-400' : 'text-[#cfc3ea]'}`}>
                  {formatARS(pct > 0 ? conPromo(precios.precioEfectivo) : precios.precioEfectivo)}
                </span>
              </div>
            </div>
          ) : (
            <PrecioNoDisponible nombrePerfume={perfume.nombre} whatsappNumero={config?.whatsappNumero} />
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onAgregar?.(perfume)}
        aria-label={`Agregar al carrito: ${completo}`}
        title="Agregar al carrito"
        className="absolute bottom-3.5 right-3 flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-lila/55 text-lila transition-colors duration-200 hover:border-violet hover:bg-violet hover:text-white"
      >
        <Plus size={18} strokeWidth={2.2} aria-hidden="true" />
      </button>
    </article>
  );
}
