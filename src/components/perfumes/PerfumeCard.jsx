import { Link } from 'react-router-dom';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { PrecioNoDisponible } from './PrecioNoDisponible';
import { preciosPorMetodo, getMejorPromo } from '../../utils/precios';
import { formatARS } from '../../utils/format';
import { useConfig } from '../../hooks/useConfig';
import { usePromocionesActivas } from '../../hooks/usePromociones';

export function PerfumeCard({ perfume, dolarMedio, onAgregar }) {
  const { data: config } = useConfig();
  const { data: promociones } = usePromocionesActivas();

  const tieneCotizacion = Boolean(dolarMedio);
  const precios = tieneCotizacion ? preciosPorMetodo(perfume.precioUSD, dolarMedio) : null;

  const promo = getMejorPromo(perfume.id, promociones);
  const pct = promo?.descuentoPorcentaje ?? 0;
  const precioTransConPromo = precios && pct ? precios.precioTransferencia * (1 - pct / 100) : null;
  const precioEfecConPromo = precios && pct ? precios.precioEfectivo * (1 - pct / 100) : null;

  return (
    <GlassCard className="flex flex-col gap-2">
      <Link to={`/perfume/${perfume.id}`} className="flex flex-col gap-2">
        {perfume.imagenes?.[0] && (
          <img
            src={perfume.imagenes[0]}
            alt={perfume.nombre}
            className="aspect-square w-full rounded-xl object-cover"
          />
        )}
        <Badge>{perfume.marca}</Badge>
        <h3 className="font-display text-lg text-text">{perfume.nombre}</h3>
      </Link>

      {tieneCotizacion ? (
        <div className="font-luxury text-sm">
          {pct > 0 ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="line-through text-error">{formatARS(precios.precioTransferencia)}</span>
                <span className="text-success font-bold text-base">{formatARS(precioTransConPromo)}</span>
                <span className="text-lila text-xs">-{pct}%</span>
              </div>
              <p className="text-text-secondary text-xs">
                Efectivo: <span className="text-success">{formatARS(precioEfecConPromo)}</span>
              </p>
            </>
          ) : (
            <>
              <p className="text-text">Transferencia: {formatARS(precios.precioTransferencia)}</p>
              <p className="text-text">Efectivo: {formatARS(precios.precioEfectivo)}</p>
            </>
          )}
        </div>
      ) : (
        <PrecioNoDisponible nombrePerfume={perfume.nombre} whatsappNumero={config?.whatsappNumero} />
      )}

      <Button onClick={() => onAgregar?.(perfume)}>Agregar al carrito</Button>
    </GlassCard>
  );
}
