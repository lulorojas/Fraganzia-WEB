import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useDolarBlue } from '../hooks/useDolarBlue';
import { useConfig } from '../hooks/useConfig';
import { useCrearPedido } from '../hooks/usePedidos';
import { usePromocionesActivas } from '../hooks/usePromociones';
import { useAuth } from '../context/AuthContext';
import { obtenerPerfumePorId } from '../services/perfumesService';
import { notificarNuevoPedido } from '../services/emailService';
import { CartItem } from '../components/cart/CartItem';
import { SelectorPago } from '../components/cart/SelectorPago';
import { ResumenCheckout } from '../components/cart/ResumenCheckout';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { preciosPorMetodo, calcularCarritoConPromos } from '../utils/precios';
import { formatARS } from '../utils/format';
import { guardarPedidoLocal } from '../utils/misPedidos';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export default function Carrito() {
  useDocumentMeta({ title: 'Tu carrito', path: '/carrito' });
  const { state, dispatch } = useCart();
  const { dolarMedio } = useDolarBlue();
  const { data: config } = useConfig();
  const { mutate: crearPedidoMutation, isPending } = useCrearPedido();
  const { data: promociones } = usePromocionesActivas();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [clienteNombre, setClienteNombre] = useState(user?.displayName ?? '');
  const [errorNombre, setErrorNombre] = useState(null);
  const [avisoDisponibilidad, setAvisoDisponibilidad] = useState(null);

  if (state.items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 flex flex-col items-center">
        <GlassCard className="flex flex-col items-center gap-4 p-10 text-center w-full max-w-sm">
          <h1 className="font-display text-2xl text-text">Tu carrito está vacío</h1>
          <p className="font-body text-text-secondary">Todavía no agregaste ningún perfume.</p>
          <Link to="/catalogo">
            <Button>Ir al catálogo</Button>
          </Link>
        </GlassCard>
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

    const esEfectivo = state.metodoPago === 'Efectivo';
    const { itemsConPrecio, subtotalARS, totalARS, descuentoARS } = calcularCarritoConPromos(
      state.items, promociones, esEfectivo, dolarMedio
    );

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

    crearPedidoMutation(pedido, {
      onSuccess: (pedidoId) => {
        dispatch({ type: 'CLEAR_CART' });
        setClienteNombre('');
        notificarNuevoPedido(
          null,
          pedido.clienteNombre,
          itemsConPrecio,
          formatARS(totalARS)
        ).catch(() => {});
        
        // Al seguimiento del pedido: ahí está el botón para mandarlo por
        // WhatsApp (con el link de seguimiento incluido) y queda guardado en
        // "Mis pedidos". Se pasan los datos para mostrarlo sin esperar a Firestore.
        guardarPedidoLocal(pedidoId);
        navigate(`/pedido/${pedidoId}?nuevo=1`, { state: { pedido } });
      },
      onError: (error) => {
        // Los errores de zod traen el detalle técnico en `issues`; al cliente
        // solo le mostramos el primer mensaje legible.
        const detalle = error.issues?.[0]?.message;
        setAvisoDisponibilidad(
          detalle ?? 'Hubo un error al procesar tu pedido. Probá de nuevo o escribinos por WhatsApp.'
        );
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-luxury text-3xl tracking-wide text-text sm:text-4xl">Tu carrito</h1>
      </div>

      {/* Productos */}
      <ul className="flex flex-col gap-3" aria-label="Productos en el carrito">
        {state.items.map((item) => (
          <CartItem
            key={item.perfumeId}
            item={item}
            precioARS={dolarMedio ? (state.metodoPago === 'Efectivo' ? preciosPorMetodo(item.precioUSD, dolarMedio).precioEfectivo : preciosPorMetodo(item.precioUSD, dolarMedio).precioTransferencia) : 0}
            onCambiarCantidad={handleCambiarCantidad}
            onQuitar={handleQuitar}
          />
        ))}
      </ul>

      {/* Checkout */}
      <GlassCard className="mt-6 flex flex-col gap-5 p-6">
        <ResumenCheckout
          items={state.items}
          metodoPago={state.metodoPago}
          dolarMedio={dolarMedio}
          whatsappNumero={config?.whatsappNumero}
          promociones={promociones}
        />

        <SelectorPago value={state.metodoPago} onChange={handleMetodoPago} />

        {/* Campo de nombre */}
        <div className="flex flex-col gap-2">
          <label htmlFor="clienteNombre" className="font-body text-sm text-text-secondary">
            Tu nombre
          </label>
          <input
            id="clienteNombre"
            type="text"
            value={clienteNombre}
            onChange={(e) => setClienteNombre(e.target.value)}
            placeholder="Ingresá tu nombre"
            maxLength={100}
            autoComplete="name"
            className="rounded-xl border border-border bg-white/[0.03] px-4 py-3 font-body text-sm text-text placeholder:text-text-secondary focus:border-violet focus:outline-none transition-colors"
            required
          />
          {errorNombre && <p className="mt-1 text-xs text-error">{errorNombre}</p>}
        </div>

        {avisoDisponibilidad && (
          <p className="text-sm text-error" role="alert">{avisoDisponibilidad}</p>
        )}

        <Button
          onClick={handleConfirmar}
          disabled={isPending || !clienteNombre.trim()}
        >
          Confirmar pedido
        </Button>
      </GlassCard>
    </div>
  );
}
