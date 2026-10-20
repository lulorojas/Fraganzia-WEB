import { generarLinkConsultaPrecio } from '../../utils/whatsapp';

export function PrecioNoDisponible({ nombrePerfume, whatsappNumero }) {
  return (
    <div className="font-display text-text-secondary">
      <p className="text-error">Precio no disponible</p>
      <a
        href={generarLinkConsultaPrecio(nombrePerfume, whatsappNumero)}
        target="_blank"
        rel="noreferrer"
        className="text-sm underline text-champagne transition-base hover:text-gold-light"
        onClick={(e) => e.stopPropagation()}
      >
        Consultá por WhatsApp
      </a>
    </div>
  );
}
