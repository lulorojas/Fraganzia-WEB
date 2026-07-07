import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useDolarBlue } from '../hooks/useDolarBlue';
import { useConfig } from '../hooks/useConfig';
import { useCrearPedido } from '../hooks/usePedidos';
import { usePromocionesActivas } from '../hooks/usePromociones';
import { useAuth } from '../context/AuthContext';
import { obtenerPerfumePorId } from '../services/perfumesService';
import { CartItem } from '../components/cart/CartItem';
import { SelectorPago } from '../components/cart/SelectorPago';
import { ResumenCheckout } from '../components/cart/ResumenCheckout';
import { Button } from '../components/ui/Button';
import { usdAArs } from '../utils/precios';
import { generarLinkWhatsApp } from '../utils/whatsapp';
import { FACTOR_EFECTIVO, WHATSAPP_NUMERO } from '../constants';

export default function Carrito() {
  const { state, dispatch } = useCart();
  const { dolarMedio } = useDolarBlue();
  const { data: config } = useConfig();
  const { mutateAsync: crearPedido, isPending } = useCrearPedido();
  const { data: promociones } = usePromocionesActivas();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mejor descuento entre todas las promociones activas
  const mejorPromo = promociones
    ?.filter((p) => (p.descuentoPorcentaje ?? 0) > 0)
    ?.reduce((best, p) => (!best || p.descuentoPorcentaje > best.descuentoPorcentaje ? p : best), null);
  const promoDescuentoPct = mejorPromo?.descuentoPorcentaje ?? 0;

  const [clienteNombre, setClienteNombre] = useState(user?.displayName ?? '');
  const [errorNombre, setErrorNombre] = useState(null);
  const [avisoDisponibilidad, setAvisoDisponibilidad] = useState(null);

  if (state.items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 p-12 text-center">
        <h1 className="font-display text-2xl text-text">Tu carrito está vacío</h1>
        <p className="text-text-secondary">Todavía no agregaste ningún perfume.</p>
        <Link to="/catalogo">
          <Button>Ir al catálogo</Button>
        </Link>
      </div>
    );
  }

  function handleCambiarCantidad(perfumeId, cantidad) {
    dispatch({ type: 'UPDATE_CANTIDAD', payload: { perfumeId, cantidad } });
  }

  function handleQuitar(perfumeId) {
    dispatch({ type: 'REMOVE_ITEM', payload: { perfumeId } });
  }

  function handleMetodoPago(metodo) {
    dispatch({ type: 'SET_METODO_PAGO', payload: metodo });
  }

  async function handleConfirmar() {
    setErrorNombre(null);
    setAvisoDisponibilidad(null);

    if (!clienteNombre.trim()) {
      setErrorNombre('El nombre es obligatorio.');
      return;
    }

    // FR-030: verificar disponibilidad vigente antes de confirmar.
    const resultados = await Promise.all(
      state.items.map(async (item) => ({
        item,
        perfumeActual: await obtenerPerfumePorId(item.perfumeId),
      }))
    );
    const noDisponibles = resultados.filter(
      ({ perfumeActual }) => !perfumeActual || !perfumeActual.disponible || !perfumeActual.activo
    );

    if (noDisponibles.length > 0) {
      noDisponibles.forEach(({ item }) => {
        dispatch({ type: 'REMOVE_ITEM', payload: { perfumeId: item.perfumeId } });
      });
      setAvisoDisponibilidad(
        `Algunos productos ya no están disponibles y se quitaron del carrito: ${noDisponibles
          .map(({ item }) => item.nombre)
          .join(', ')}. Revisá tu pedido y confirmá de nuevo.`
      );
      return;
    }

    if (!dolarMedio) {
      setAvisoDisponibilidad('No hay cotización disponible en este momento. Consultá por WhatsApp.');
      return;
    }

    const itemsConPrecio = state.items.map((item) => ({
      ...item,
      precioARS: usdAArs(item.precioUSD, dolarMedio),
    }));
    const subtotalARS = itemsConPrecio.reduce(
      (acc, item) => acc + item.precioARS * item.cantidad,
      0
    );
    // Descuento promo (si existe) + descuento efectivo (si corresponde)
    const descuentoPromoARS = subtotalARS * (promoDescuentoPct / 100);
    const subtotalConPromo = subtotalARS - descuentoPromoARS;
    const esEfectivo = state.metodoPago === 'Efectivo';
    const descuentoEfectivoARS = esEfectivo ? subtotalConPromo * (1 - FACTOR_EFECTIVO) : 0;
    const totalARS = subtotalConPromo - descuentoEfectivoARS;
    const descuentoARS = descuentoPromoARS + descuentoEfectivoARS;

    const pedido = {
      items: itemsConPrecio,
      metodoPago: state.metodoPago,
      dolarBlueUsado: dolarMedio,
      subtotalARS,
      descuentoARS,
      totalARS,
      clienteNombre: clienteNombre.trim(),
      estado: 'confirmado',
    };

    await crearPedido(pedido);

    const link = generarLinkWhatsApp({
      clienteNombre: pedido.clienteNombre,
      items: itemsConPrecio,
      metodoPago: pedido.metodoPago,
      total: totalARS,
      numero: config?.whatsappNumero ?? WHATSAPP_NUMERO,
    });
    window.open(link, '_blank');

    dispatch({ type: 'CLEAR_CART' });
    navigate('/');
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 font-display text-2xl text-text">Tu carrito</h1>

      {state.items.map((item) => (
        <CartItem
          key={item.perfumeId}
          item={item}
          precioARS={dolarMedio ? usdAArs(item.precioUSD, dolarMedio) : 0}
          onCambiarCantidad={handleCambiarCantidad}
          onQuitar={handleQuitar}
        />
      ))}

      <div className="mt-6">
        <ResumenCheckout
          items={state.items}
          metodoPago={state.metodoPago}
          dolarMedio={dolarMedio}
          whatsappNumero={config?.whatsappNumero}
          promoDescuentoPct={promoDescuentoPct}
          promoNombre={mejorPromo?.titulo}
        />
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <SelectorPago value={state.metodoPago} onChange={handleMetodoPago} />

        <div>
          <input
            type="text"
            placeholder="Tu nombre"
            value={clienteNombre}
            onChange={(e) => setClienteNombre(e.target.value)}
            className="w-full rounded-xl border border-border bg-transparent px-3 py-2 text-text"
          />
          {errorNombre && <p className="mt-1 text-sm text-error">{errorNombre}</p>}
        </div>

        {avisoDisponibilidad && (
          <p className="text-sm text-error">{avisoDisponibilidad}</p>
        )}

        <Button onClick={handleConfirmar} disabled={isPending}>
          Confirmar pedido por WhatsApp
        </Button>
      </div>
    </div>
  );
}
