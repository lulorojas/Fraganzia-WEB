import { Link } from 'react-router-dom';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { PrecioNoDisponible } from './PrecioNoDisponible';
import { preciosPorMetodo } from '../../utils/precios';
import { formatARS } from '../../utils/format';
import { useConfig } from '../../hooks/useConfig';

export function PerfumeCard({ perfume, dolarMedio, onAgregar }) {
  const { data: config } = useConfig();
  const tieneCotizacion = Boolean(dolarMedio);
  const precios = tieneCotizacion ? preciosPorMetodo(perfume.precioUSD, dolarMedio) : null;

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
        <div className="font-luxury text-text">
          <p>Transferencia: {formatARS(precios.precioTransferencia)}</p>
          <p>Efectivo: {formatARS(precios.precioEfectivo)}</p>
        </div>
      ) : (
        <PrecioNoDisponible nombrePerfume={perfume.nombre} whatsappNumero={config?.whatsappNumero} />
      )}

      <Button onClick={() => onAgregar?.(perfume)}>Agregar al carrito</Button>
    </GlassCard>
  );
}
