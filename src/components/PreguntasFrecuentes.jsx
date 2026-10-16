import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { abrirAsistente } from './asistente/BotonAsistente';

// Respuestas solo con lo que la tienda ya hace y dice en el resto del sitio.
// Si se confirman plazos de entrega, costo de envío o política de cambios,
// agregarlos acá.
const PREGUNTAS = [
  {
    q: '¿Cómo compro?',
    a: 'Elegís tus perfumes, los sumás al carrito y confirmás el pedido. Después nos lo mandás por WhatsApp para coordinar el pago y la entrega, y podés seguirlo online con un link.',
  },
  {
    q: '¿Cómo puedo pagar?',
    a: 'Por transferencia o en efectivo. Cada perfume muestra el precio de las dos formas.',
  },
  {
    q: '¿Hacen envíos a todo el país?',
    a: 'Por ahora enviamos solo al AMBA.',
  },
  {
    q: '¿Los perfumes son originales?',
    a: 'Sí. Trabajamos perfumes árabes originales de marcas como Lattafa, Armaf, Al Haramain y Afnan.',
  },
  {
    q: '¿Qué es un decant?',
    a: 'Una porción chica (3, 5 o 10 ml) de un perfume original, para probarlo antes de llevarte el frasco entero.',
    extra: (
      <Link to="/decants" className="text-lila hover:text-text">
        Ver decants
      </Link>
    ),
  },
  {
    q: '¿No sé qué perfume elegir?',
    a: 'Probá el asistente: te hace unas preguntas rápidas (para quién es, qué aromas te gustan, cuándo lo vas a usar y cuánto querés invertir) y te recomienda. También podés escribirnos por WhatsApp.',
    extra: (
      <button type="button" onClick={abrirAsistente} className="text-lila hover:text-text">
        Encontrá tu perfume
      </button>
    ),
  },
];

/** Preguntas frecuentes plegables (sin JavaScript extra: usa <details>). */
export function PreguntasFrecuentes() {
  return (
    <section aria-labelledby="faq-titulo" className="diferir-render mx-auto max-w-3xl px-6 pb-20">
      <h2 id="faq-titulo" className="mb-6 font-luxury text-2xl tracking-wide text-text sm:text-3xl">
        Preguntas frecuentes
      </h2>
      <div className="flex flex-col gap-3">
        {PREGUNTAS.map(({ q, a, extra }) => (
          <details key={q} className="card-surface group rounded-2xl px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-body text-sm font-semibold text-text [&::-webkit-details-marker]:hidden">
              {q}
              <ChevronDown size={18} className="shrink-0 text-lila transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <p className="mt-3 font-body text-sm leading-relaxed text-text-secondary">{a}</p>
            {extra && <p className="mt-2 font-body text-sm">{extra}</p>}
          </details>
        ))}
      </div>
    </section>
  );
}
