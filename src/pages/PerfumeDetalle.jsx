import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePerfume } from '../hooks/usePerfume';
import { incrementarVista, incrementarAgregadoCarrito } from '../services/estadisticasService';
import { useDolarBlue } from '../hooks/useDolarBlue';
import { useCart } from '../context/CartContext';
import { useConfig } from '../hooks/useConfig';
import { usePromocionesActivas } from '../hooks/usePromociones';
import { NotasOlfativas } from '../components/perfumes/NotasOlfativas';
import { PrecioNoDisponible } from '../components/perfumes/PrecioNoDisponible';
import { Spinner } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';
import { preciosPorMetodo, getMejorPromo } from '../utils/precios';
import { formatARS } from '../utils/format';

export default function PerfumeDetalle() {
  const { id } = useParams();
  const { data: perfume, isLoading } = usePerfume(id);
  const { dolarMedio } = useDolarBlue();
  const { data: config } = useConfig();
  const { data: promociones } = usePromocionesActivas();
  const { dispatch } = useCart();
  const [cantidad, setCantidad] = useState(1);

  // Registra la vista una sola vez por perfume por sesión (ver
  // estadisticasService). El id es la dependencia: navegar a otro perfume
  // vuelve a disparar, recargar el mismo no.
  useEffect(() => {
    if (id) incrementarVista(id);
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Spinner />
      </div>
    );
  }

  if (!perfume) {
    return (
      <div className="flex flex-col items-center gap-4 p-12 text-center">
        <h1 className="font-display text-2xl text-text">Perfume no encontrado</h1>
        <p className="text-text-secondary">
          Este perfume ya no está disponible o el enlace es incorrecto.
        </p>
        <Link to="/catalogo">
          <Button>Volver al catálogo</Button>
        </Link>
      </div>
    );
  }

  const tieneCotizacion = Boolean(dolarMedio);
  const precios = tieneCotizacion ? preciosPorMetodo(perfume.precioUSD, dolarMedio) : null;

  const promo = getMejorPromo(perfume.id, promociones);
  const pct = promo?.descuentoPorcentaje ?? 0;
  const precioTransConPromo = precios && pct ? precios.precioTransferencia * (1 - pct / 100) : null;
  const precioEfecConPromo  = precios && pct ? precios.precioEfectivo  * (1 - pct / 100) : null;

  return (
    <div className="mx-auto max-w-3xl p-6">
      {perfume.imagenes?.[0] && (
        <img
          src={perfume.imagenes[0]}
          alt={perfume.nombre}
          className="mb-4 aspect-video w-full rounded-2xl object-cover"
        />
      )}
      <h1 className="font-display text-3xl text-text">{perfume.nombre}</h1>
      <p className="text-text-secondary">{perfume.marca} · {perfume.volumenML} ml</p>

      {tieneCotizacion ? (
        <div className="mt-4 font-luxury">
          {pct > 0 ? (
            <>
              {promo?.nombre && (
                <p className="mb-1 text-sm text-lila font-medium">🏷️ {promo.nombre} — {pct}% off</p>
              )}
              <div className="flex items-baseline gap-3 text-xl">
                <span className="line-through text-error">{formatARS(precios.precioTransferencia)}</span>
                <span className="text-success font-bold">{formatARS(precioTransConPromo)}</span>
              </div>
              <p className="text-text-secondary">
                Efectivo:{' '}
                <span className="line-through text-error mr-1">{formatARS(precios.precioEfectivo)}</span>
                <span className="text-success font-bold">{formatARS(precioEfecConPromo)}</span>
              </p>
            </>
          ) : (
            <div className="text-xl text-text">
              <p>Transferencia: {formatARS(precios.precioTransferencia)}</p>
              <p>Efectivo: {formatARS(precios.precioEfectivo)}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4">
          <PrecioNoDisponible
            nombrePerfume={perfume.nombre}
            whatsappNumero={config?.whatsappNumero}
          />
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <input
          type="number"
          min={1}
          value={cantidad}
          onChange={(e) => setCantidad(Math.max(1, Number(e.target.value) || 1))}
          className="w-20 rounded-xl border border-border bg-transparent px-3 py-2 text-text"
        />
        <Button
          onClick={() => {
            dispatch({
              type: 'ADD_ITEM',
              payload: {
                perfumeId: perfume.id,
                nombre: perfume.nombre,
                marca: perfume.marca,
                precioUSD: perfume.precioUSD,
                cantidad,
              },
            });
            incrementarAgregadoCarrito(perfume.id);
          }}
        >
          Agregar al carrito
        </Button>
      </div>

      <p className="mt-4 font-body text-text">{perfume.descripcion}</p>

      <div className="mt-6">
        <NotasOlfativas
          notasSalida={perfume.notasSalida}
          notasCorazon={perfume.notasCorazon}
          notasFondo={perfume.notasFondo}
        />
      </div>
    </div>
  );
}
