import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePerfume } from '../hooks/usePerfume';
import { useDolarBlue } from '../hooks/useDolarBlue';
import { useCart } from '../context/CartContext';
import { useConfig } from '../hooks/useConfig';
import { NotasOlfativas } from '../components/perfumes/NotasOlfativas';
import { PrecioNoDisponible } from '../components/perfumes/PrecioNoDisponible';
import { Spinner } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';
import { preciosPorMetodo } from '../utils/precios';
import { formatARS } from '../utils/format';

export default function PerfumeDetalle() {
  const { id } = useParams();
  const { data: perfume, isLoading } = usePerfume(id);
  const { dolarMedio } = useDolarBlue();
  const { data: config } = useConfig();
  const { dispatch } = useCart();
  const [cantidad, setCantidad] = useState(1);

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
        <div className="mt-4 font-luxury text-xl text-text">
          <p>Transferencia: {formatARS(precios.precioTransferencia)}</p>
          <p>Efectivo: {formatARS(precios.precioEfectivo)}</p>
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
          onClick={() =>
            dispatch({
              type: 'ADD_ITEM',
              payload: {
                perfumeId: perfume.id,
                nombre: perfume.nombre,
                marca: perfume.marca,
                precioUSD: perfume.precioUSD,
                cantidad,
              },
            })
          }
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
