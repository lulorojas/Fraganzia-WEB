import { useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { cambioMetodoSchema } from '../../schemas/cambioMetodoSchema';
import { useSocioActual } from '../../hooks/useSocioActual';
import { useCrearCambioMetodo } from '../../hooks/useCambiosMetodo';
import { fechaInput, formatARS } from '../../utils/format';
import { Field } from './ui/kit';

const NOMBRE = { efectivo: 'Efectivo', mercadopago: 'Mercado Pago' };
const OTRO = { efectivo: 'mercadopago', mercadopago: 'efectivo' };

/**
 * Pasaje de plata propia entre efectivo y Mercado Pago. Es privado del socio
 * logueado. `montoRecibido` arranca igual a `monto` y sigue al monto mientras no
 * se toque: el caso normal es uno a uno.
 */
export function PasajeForm({ onGuardado }) {
  const socioActualId = useSocioActual();
  const crear = useCrearCambioMetodo();
  const [de, setDe] = useState('mercadopago');
  const [monto, setMonto] = useState('');
  const [recibido, setRecibido] = useState(null);
  const [error, setError] = useState(null);

  const a = OTRO[de];
  const entra = recibido ?? monto;
  const diferencia = (Number(monto) || 0) - (Number(entra) || 0);

  async function enviar(e) {
    e.preventDefault();
    setError(null);
    const res = cambioMetodoSchema.safeParse({
      socioId: socioActualId, de, a, monto, montoRecibido: entra, fecha: fechaInput(),
    });
    if (!res.success) {
      setError(res.error.issues[0].message);
      return;
    }
    try {
      await crear.mutateAsync({ datos: res.data, socioId: socioActualId });
      setMonto('');
      setRecibido(null);
      onGuardado?.('Pasaje registrado');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <Field label="Sale de">
          <div className="input" style={{ display: 'flex', alignItems: 'center' }}>{NOMBRE[de]}</div>
        </Field>
        <button type="button" className="btn btn-secondary btn-icon" onClick={() => setDe(a)} title="Invertir el sentido" aria-label="Invertir el sentido">
          <ArrowLeftRight />
        </button>
        <Field label="Entra en">
          <div className="input" style={{ display: 'flex', alignItems: 'center' }}>{NOMBRE[a]}</div>
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Monto que sale ($)">
          <input className="input" inputMode="decimal" placeholder="0" value={monto} onChange={(e) => setMonto(e.target.value)} />
        </Field>
        <Field label="Monto que entra ($)">
          <input className="input" inputMode="decimal" placeholder="0" value={entra} onChange={(e) => setRecibido(e.target.value)} />
        </Field>
      </div>
      {Math.abs(diferencia) > 0.5 && (
        <div className="notice">
          Hay una diferencia de {formatARS(Math.abs(diferencia))}
          {diferencia > 0
            ? ': entra menos de lo que sale, se toma como un costo y se reparte 50/50 entre los socios.'
            : ': entra más de lo que sale, se toma como ganancia y se reparte 50/50 entre los socios.'}
        </div>
      )}
      {error && <div className="notice bad">{error}</div>}
      <div>
        <button type="submit" className="btn btn-primary" disabled={crear.isPending || !Number(monto)}>
          {crear.isPending ? 'Guardando…' : 'Registrar pasaje'}
        </button>
      </div>
    </form>
  );
}
