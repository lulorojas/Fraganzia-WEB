import { MessageCircle, Mail, Clock, MapPin } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { construirLinkWhatsApp } from '../utils/whatsapp';
import { useConfig } from '../hooks/useConfig';

export default function Contacto() {
  const { data: config } = useConfig();
  const numero = config?.whatsappNumero ?? '';

  const linkConsulta = construirLinkWhatsApp(
    numero,
    '¡Hola Fraganzia! Quisiera hacer una consulta sobre sus productos.'
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="font-display text-4xl text-text mb-4">Contacto</h1>
        <p className="font-body text-text-secondary text-lg">
          Estamos para ayudarte. Escribinos y te respondemos a la brevedad.
        </p>
      </div>

      {/* WhatsApp principal */}
      <GlassCard className="mb-6 p-8 flex flex-col items-center gap-4 text-center border border-lila/30">
        <MessageCircle className="h-12 w-12 text-success" />
        <h2 className="font-display text-2xl text-text">WhatsApp</h2>
        <p className="font-body text-text-secondary">
          La forma más rápida de comunicarte con nosotros. Consultas sobre productos,
          precios, disponibilidad y envíos.
        </p>
        {numero ? (
          <a href={linkConsulta} target="_blank" rel="noopener noreferrer">
            <Button className="flex items-center gap-2 bg-success/20 hover:bg-success/30 text-success border border-success/40">
              <MessageCircle className="h-4 w-4" />
              Escribirnos por WhatsApp
            </Button>
          </a>
        ) : (
          <p className="text-text-secondary text-sm">Cargando número de contacto…</p>
        )}
      </GlassCard>

      {/* Info adicional */}
      <div className="grid gap-4 sm:grid-cols-2">
        <GlassCard className="p-5 flex items-start gap-4">
          <Clock className="h-6 w-6 text-lila shrink-0 mt-0.5" />
          <div>
            <h3 className="font-display text-text mb-1">Horario de atención</h3>
            <p className="font-body text-text-secondary text-sm">
              Lunes a viernes: 9:00 – 20:00 hs<br />
              Sábados: 10:00 – 16:00 hs
            </p>
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex items-start gap-4">
          <MapPin className="h-6 w-6 text-lila shrink-0 mt-0.5" />
          <div>
            <h3 className="font-display text-text mb-1">Envíos</h3>
            <p className="font-body text-text-secondary text-sm">
              A todo el país vía correo o encomienda.<br />
              Coordinamos el método con vos.
            </p>
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex items-start gap-4 sm:col-span-2">
          <Mail className="h-6 w-6 text-lila shrink-0 mt-0.5" />
          <div>
            <h3 className="font-display text-text mb-1">Sobre tus pedidos</h3>
            <p className="font-body text-text-secondary text-sm">
              Al finalizar tu compra desde el carrito, tu pedido se envía automáticamente por WhatsApp
              con el detalle completo. Coordinamos pago y envío en ese mismo chat.
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
