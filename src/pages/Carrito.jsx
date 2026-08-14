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
import { preciosPorMetodo, calcularTotal2x1 } from '../utils/precios';
import { formatARS } from '../utils/format';
import { construirLinkWhatsApp } from '../utils/whatsapp';
import { WHATSAPP_NUMERO } from '../constants';

export default function Carrito() {
  const { state, dispatch } = useCart();
  const { dolarMedio } = useDolarBlue();
  const { data: config } = useConfig();
  const { mutate: crearPedidoMutation, isPending } = useCrearPedido();
  const { data: promociones } = usePromocionesActivas();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Promo 2x1 activa
  const promo2x1Activa = promociones?.find((p) => p.tipo === '2x1');
  const totalUnidades = state.items.reduce((sum, i) => sum + i.cantidad, 0);
  const tienePromo2x1 = Boolean(promo2x1Activa) && totalUnidades >= 2;

  // Mejor descuento entre todas las promociones activas (tipo descuento)
  const mejorPromo = promociones
    ?.filter((p) => p.tipo !== '2x1' && (p.descuentoPorcentaje ?? 0) > 0)
    ?.reduce((best, p) => (!best || p.descuentoPorcentaje > best.descuentoPorcentaje ? p : best), null);
  const promoDescuentoPct = mejorPromo?.descuentoPorcentaje ?? 0;

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
    const itemsConPrecio = state.items.map((item) => {
      const { precioTransferencia, precioEfectivo } = preciosPorMetodo(item.precioUSD, dolarMedio);
      return {
        ...item,
        precioARS: esEfectivo ? precioEfectivo : precioTransferencia,
      };
    });
    const subtotalARS = itemsConPrecio.reduce(
      (acc, item) => acc + item.precioARS * item.cantidad,
      0
    );
    const totalARS = tienePromo2x1
      ? calcularTotal2x1(itemsConPrecio)
      : Math.round((subtotalARS * (1 - promoDescuentoPct / 100)) / 1000) * 1000;
    const descuentoARS = subtotalARS - totalARS;

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

    // Generar mensaje de notificación para el admin
    const mensajeAdmin = [
      '🔔 NUEVO PEDIDO - Fraganzia',
      '',
      `👤 Cliente: ${pedido.clienteNombre}`,
      '',
      '🛍️ Productos:',
      ...itemsConPrecio.map(it => `  • ${it.cantidad}x ${it.marca} ${it.nombre} - ${formatARS(it.precioARS)}`),
      '',
      `💳 Método: ${pedido.metodoPago}`,
      `💰 Total: ${formatARS(totalARS)}`,
      '',
      `ID: ${Date.now()}`,
    ].join('\n');

    const linkNotificacion = construirLinkWhatsApp(WHATSAPP_NUMERO, mensajeAdmin);

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
        
        // Abrir WhatsApp para notificar al admin
        window.location.href = linkNotificacion;
      },
      onError: (error) => {
        setAvisoDisponibilidad(`Error: ${error.message || 'Hubo un error al procesar tu pedido'}`);
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <p className="tracking-luxury mb-2 font-body text-xs uppercase text-lila">Tu pedido</p>
        <h1 className="font-display text-3xl text-text">Tu carrito</h1>
      </div>

      {/* Productos */}
      <div className="flex flex-col gap-3">
        {state.items.map((item) => (
          <CartItem
            key={item.perfumeId}
            item={item}
            precioARS={dolarMedio ? (state.metodoPago === 'Efectivo' ? preciosPorMetodo(item.precioUSD, dolarMedio).precioEfectivo : preciosPorMetodo(item.precioUSD, dolarMedio).precioTransferencia) : 0}
            onCambiarCantidad={handleCambiarCantidad}
            onQuitar={handleQuitar}
          />
        ))}
      </div>

      {/* Checkout */}
      <GlassCard className="mt-6 flex flex-col gap-5 p-6">
        <ResumenCheckout
          items={state.items}
          metodoPago={state.metodoPago}
          dolarMedio={dolarMedio}
          whatsappNumero={config?.whatsappNumero}
          promoDescuentoPct={promoDescuentoPct}
          promoNombre={mejorPromo?.titulo}
          promo2x1={tienePromo2x1}
          promo2x1Nombre={promo2x1Activa?.titulo}
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
            className="rounded-xl border border-border bg-white/[0.03] px-4 py-3 font-body text-sm text-text placeholder:text-text-secondary/50 focus:border-violet focus:outline-none transition-colors"
            required
          />
          {errorNombre && <p className="mt-1 text-xs text-error">{errorNombre}</p>}
        </div>

        {avisoDisponibilidad && (
          <p className="text-sm text-error">{avisoDisponibilidad}</p>
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
