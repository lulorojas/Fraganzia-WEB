import { generarLinkConsultaPrecio } from '../../utils/whatsapp';

export function PrecioNoDisponible({ nombrePerfume, whatsappNumero }) {
  return (
    <div className="font-luxury text-text-secondary">
      <p className="text-error">Precio no disponible</p>
      <a
        href={generarLinkConsultaPrecio(nombrePerfume, whatsappNumero)}
        target="_blank"
        rel="noreferrer"
        className="text-sm underline text-lila transition-base hover:text-violet-light"
        onClick={(e) => e.stopPropagation()}
      >
        Consultá por WhatsApp
      </a>
    </div>
  );
}
