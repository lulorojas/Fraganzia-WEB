import { Hourglass } from 'lucide-react';
import { useAhora } from '../../hooks/useAhora';
import { etiquetaVigencia, finDePromo, fechaLarga } from '../../utils/vigencia';

/**
 * Etiqueta con el plazo REAL de una promoción: "Termina en 2 días y 4 h" (falta poco) o "Hasta el 30/11"
 * (falta más). No muestra nada si la promo no tiene fecha de cierre o ya terminó: nunca se inventa un plazo.
 *
 * El texto cambia con la hora, así que el HTML pre-generado puede diferir en unos minutos del que calcula
 * el navegador: `suppressHydrationWarning` lo permite sin errores y el siguiente tic ya lo deja exacto.
 * No es una región `aria-live` a propósito: un lector de pantalla no tiene que anunciar cada minuto que pasa;
 * la fecha completa queda en el `title` y en `dateTime`.
 */
export function VigenciaPromo({ promo, className = '' }) {
  const ahora = useAhora();
  const fin = finDePromo(promo);
  if (fin === null) return null;
  const etiqueta = etiquetaVigencia(fin, ahora);
  if (!etiqueta) return null;

  return (
    <time
      dateTime={new Date(fin).toISOString()}
      title={`Vence el ${fechaLarga(fin)}`}
      suppressHydrationWarning
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-body text-xs font-semibold tabular-nums ${
        etiqueta.urgente ? 'border-amber-300/50 bg-amber-300/10 text-amber-200' : 'border-lila/40 bg-lila/10 text-lila'
      } ${className}`}
    >
      <Hourglass size={13} aria-hidden="true" />
      <span suppressHydrationWarning>{etiqueta.texto}</span>
    </time>
  );
}
