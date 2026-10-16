import { calcularCarritoConPromos } from '../../utils/precios';
import { formatARS } from '../../utils/format';
import { construirLinkWhatsApp } from '../../utils/whatsapp';
import { WHATSAPP_NUMERO } from '../../constants';

export function ResumenCheckout({ items, metodoPago, dolarMedio, whatsappNumero, promociones }) {
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
  const { subtotalARS, totalARS, lineas } = calcularCarritoConPromos(items, promociones, esEfectivo, dolarMedio);

  return (
    <div className="font-luxury text-text flex flex-col gap-1.5">
      <p className="font-body text-sm text-text-secondary">Subtotal: {formatARS(subtotalARS)}</p>
      {lineas.map((l) => (
        <p key={l.nombre} className="font-body text-sm text-lila">
          {l.tipo === '2x1' ? `Promo 2×1 "${l.nombre}"` : `Promo "${l.nombre}" -${l.pct}%`}: -{formatARS(l.monto)}
        </p>
      ))}
      <div className="mt-1 border-t border-border pt-3">
        <p className="text-2xl font-bold tracking-tight">Total: <span className="text-lila">{formatARS(totalARS)}</span></p>
      </div>
    </div>
  );
}
