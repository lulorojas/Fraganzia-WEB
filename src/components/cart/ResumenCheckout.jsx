import { preciosPorMetodo, calcularTotal2x1 } from '../../utils/precios';
import { formatARS } from '../../utils/format';
import { construirLinkWhatsApp } from '../../utils/whatsapp';
import { WHATSAPP_NUMERO } from '../../constants';

export function ResumenCheckout({ items, metodoPago, dolarMedio, whatsappNumero, promoDescuentoPct = 0, promoNombre, promo2x1 = false, promo2x1Nombre }) {
  const tieneCotizacion = Boolean(dolarMedio);

  if (!tieneCotizacion) {
    return (
      <div className="text-text-secondary">
        <p className="text-error">Precio no disponible</p>
        <a
          href={construirLinkWhatsApp(
            whatsappNumero ?? WHATSAPP_NUMERO,
            'Hola! Quiero consultar los precios de mi pedido.'
          )}
          target="_blank"
          rel="noreferrer"
          className="text-sm underline text-lila transition-base hover:text-violet-light"
        >
          Consultá por WhatsApp
        </a>
      </div>
    );
  }

  const esEfectivo = metodoPago === 'Efectivo';

  const subtotalARS = items.reduce((acc, item) => {
    const { precioTransferencia, precioEfectivo } = preciosPorMetodo(item.precioUSD, dolarMedio);
    const precio = esEfectivo ? precioEfectivo : precioTransferencia;
    return acc + precio * item.cantidad;
  }, 0);

  // Descuento de promoción activa
  let totalARS, descuentoPromoARS;
  if (promo2x1) {
    totalARS = calcularTotal2x1(items, esEfectivo, dolarMedio);
    descuentoPromoARS = subtotalARS - totalARS;
  } else {
    totalARS = Math.round((subtotalARS * (1 - promoDescuentoPct / 100)) / 1000) * 1000;
    descuentoPromoARS = subtotalARS - totalARS;
  }

  return (
    <div className="font-luxury text-text flex flex-col gap-1.5">
      <p className="font-body text-sm text-text-secondary">Subtotal: {formatARS(subtotalARS)}</p>
      {promo2x1 && (
        <p className="font-body text-sm text-lila">
          Promo 2×1{promo2x1Nombre ? ` "${promo2x1Nombre}"` : ''}: -{formatARS(descuentoPromoARS)}
        </p>
      )}
      {!promo2x1 && promoDescuentoPct > 0 && (
        <p className="font-body text-sm text-lila">
          Promo {promoNombre ? `"${promoNombre}"` : ''} -{promoDescuentoPct}%: -{formatARS(descuentoPromoARS)}
        </p>
      )}
      <div className="mt-1 border-t border-border pt-3">
        <p className="text-2xl font-bold tracking-tight">Total: <span className="text-lila">{formatARS(totalARS)}</span></p>
      </div>
    </div>
  );
}
