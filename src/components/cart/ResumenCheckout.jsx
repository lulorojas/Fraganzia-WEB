import { usdAArs } from '../../utils/precios';
import { formatARS } from '../../utils/format';
import { construirLinkWhatsApp } from '../../utils/whatsapp';
import { WHATSAPP_NUMERO, FACTOR_EFECTIVO } from '../../constants';

export function ResumenCheckout({ items, metodoPago, dolarMedio, whatsappNumero, promoDescuentoPct = 0, promoNombre }) {
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

  const subtotalARS = items.reduce(
    (acc, item) => acc + usdAArs(item.precioUSD, dolarMedio) * item.cantidad,
    0
  );

  // Descuento de promoción activa
  const descuentoPromoARS = subtotalARS * (promoDescuentoPct / 100);
  const subtotalConPromo = subtotalARS - descuentoPromoARS;

  // Descuento por efectivo sobre el subtotal ya con promo
  const esEfectivo = metodoPago === 'Efectivo';
  const descuentoEfectivoARS = esEfectivo ? subtotalConPromo * (1 - FACTOR_EFECTIVO) : 0;
  const totalARS = subtotalConPromo - descuentoEfectivoARS;

  return (
    <div className="font-luxury text-text flex flex-col gap-1">
      <p className="text-text-secondary">Subtotal: {formatARS(subtotalARS)}</p>
      {promoDescuentoPct > 0 && (
        <p className="text-lila text-sm">
          Promo {promoNombre ? `"${promoNombre}"` : ''} -{promoDescuentoPct}%: -{formatARS(descuentoPromoARS)}
        </p>
      )}
      {esEfectivo && (
        <p className="text-success text-sm">Descuento efectivo 5%: -{formatARS(descuentoEfectivoARS)}</p>
      )}
      <p className="text-xl font-bold">Total: {formatARS(totalARS)}</p>
    </div>
  );
}
