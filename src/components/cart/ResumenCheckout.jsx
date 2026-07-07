import { usdAArs } from '../../utils/precios';
import { formatARS } from '../../utils/format';
import { construirLinkWhatsApp } from '../../utils/whatsapp';
import { WHATSAPP_NUMERO, FACTOR_EFECTIVO } from '../../constants';

export function ResumenCheckout({ items, metodoPago, dolarMedio, whatsappNumero }) {
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
  const esEfectivo = metodoPago === 'Efectivo';
  const totalARS = esEfectivo ? subtotalARS * FACTOR_EFECTIVO : subtotalARS;
  const descuentoARS = subtotalARS - totalARS;

  return (
    <div className="font-luxury text-text">
      <p>Subtotal: {formatARS(subtotalARS)}</p>
      {esEfectivo && <p className="text-success">Descuento 5%: -{formatARS(descuentoARS)}</p>}
      <p className="text-xl">Total: {formatARS(totalARS)}</p>
    </div>
  );
}
