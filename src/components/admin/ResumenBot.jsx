import { Link } from 'react-router-dom';
import { GlassCard } from '../ui/GlassCard';
import { useBotProveedorLog, useEstadoBotProveedor } from '../../hooks/useBotProveedorLog';
import { formatFechaHora, milisDeFecha } from '../../utils/format';

const HORAS_SIN_CHEQUEAR = 36; // el bot corre dos veces por día: más que esto es señal de que dejó de correr

/** Estado del bot de precios: si está al día y qué cambió la última vez que aplicó algo. */
export function ResumenBot({ conLink = true }) {
  const { data: estado, isLoading } = useEstadoBotProveedor();
  const { data: corridas } = useBotProveedorLog();
  if (isLoading) return null;

  const ultimoChequeo = estado?.ultimoChequeo ?? estado?.ultimaCorrida;
  const horas = ultimoChequeo ? (Date.now() - milisDeFecha(ultimoChequeo)) / 36e5 : Infinity;
  const alDia = horas <= HORAS_SIN_CHEQUEAR;
  const ultima = corridas?.[0];
  const precios = ultima?.cambios?.length ?? 0;
  const nuevos = ultima?.nuevos?.length ?? 0;

  return (
    <GlassCard className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg text-text">Bot de precios</h2>
        {conLink && (
          <Link to="/admin/bot-proveedor" className="font-body text-xs text-violet hover:underline">
            Ver detalle
          </Link>
        )}
      </div>
      <p className={`mt-1 font-body text-sm ${alDia ? 'text-text' : 'text-error'}`}>
        {alDia ? 'Está al día' : 'No chequeó el catálogo hace más de un día y medio: revisá GitHub → Actions'}
      </p>
      <p className="mt-1 font-body text-xs text-text-secondary">
        Último chequeo: {ultimoChequeo ? formatFechaHora(ultimoChequeo) : 'sin registro todavía'}
      </p>
      {estado && estado.whatsappConfigurado === false && (
        <p className="mt-1 font-body text-xs text-error">
          Los avisos por WhatsApp no están configurados: el bot no te escribe cuando cambia algo (guía en docs/TAREAS-MANUALES.md).
        </p>
      )}
      {ultima && (
        <p className="mt-1 font-body text-xs text-text-secondary">
          Último cambio ({formatFechaHora(ultima.creadoEn)}): {precios} precios actualizados
          {nuevos > 0 && ` y ${nuevos} perfume${nuevos === 1 ? '' : 's'} nuevo${nuevos === 1 ? '' : 's'}`}
        </p>
      )}
    </GlassCard>
  );
}
