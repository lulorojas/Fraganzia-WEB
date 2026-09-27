import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRightLeft } from 'lucide-react';
import { cambioMetodoSchema } from '../../schemas/cambioMetodoSchema';
import { useSocios } from '../../hooks/useSocios';
import { SOCIOS } from '../../constants';
import { formatARS } from '../../utils/format';
import { Button } from '../ui/Button';

function Campo({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-text-secondary">{label}</label>
      {children}
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}

const INPUT = 'w-full rounded-xl border border-border bg-transparent px-3 py-2 text-text';
const SELECT = 'w-full rounded-xl border border-border bg-bg px-3 py-2 text-text';

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

const vacio = (socioActualId) => ({
  socioId: socioActualId ?? '',
  de: 'mercadopago',
  a: 'efectivo',
  monto: '',
  montoRecibido: '',
  fecha: hoyISO(),
});

export function CambioMetodoForm({ socioActualId, onSubmit, cargando }) {
  const { data: socios } = useSocios();
  const nombreDe = (id) =>
    socios?.find((s) => s.id === id)?.nombre ?? SOCIOS.find((s) => s.id === id)?.nombre ?? id;

  const {
    register, handleSubmit, watch, setValue, reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(cambioMetodoSchema),
    defaultValues: vacio(socioActualId),
  });

  useEffect(() => { setValue('socioId', socioActualId ?? ''); }, [socioActualId, setValue]);

  const de = watch('de');
  const monto = watch('monto');
  const montoRecibido = watch('montoRecibido');

  // El caso normal es uno a uno: se precarga lo recibido con lo que salió, y
  // solo se toca si el cambio tuvo diferencia.
  useEffect(() => {
    setValue('montoRecibido', monto);
  }, [monto, setValue]);

  // Invertir el sentido evita tener que tocar los dos selectores.
  function invertir() {
    const destino = watch('a');
    setValue('de', destino);
    setValue('a', de);
  }

  const diferencia = (Number(monto) || 0) - (Number(montoRecibido) || 0);
  const hayDiferencia = Math.abs(diferencia) > 0.5;

  async function procesar(datos) {
    await onSubmit(datos);
    reset(vacio(socioActualId));
  }

  return (
    <form onSubmit={handleSubmit(procesar)} className="flex flex-col gap-4">
      <div>
        <h3 className="font-display text-lg text-text">Cambio de efectivo y Mercado Pago</h3>
        <p className="mt-1 text-xs text-text-secondary">
          Para cuando le pasás Mercado Pago a alguien y te devuelve efectivo, o al revés. La plata
          sigue siendo tuya: solo cambia de bolsillo.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="De quién es la plata" error={errors.socioId?.message}>
          <select className={SELECT} {...register('socioId')}>
            <option value="">Elegir…</option>
            {SOCIOS.map((s) => <option key={s.id} value={s.id}>{nombreDe(s.id)}</option>)}
          </select>
        </Campo>
        <Campo label="Fecha" error={errors.fecha?.message}>
          <input type="date" className={INPUT} {...register('fecha')} />
        </Campo>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <Campo label="Sale de" error={errors.de?.message}>
          <select className={SELECT} {...register('de')}>
            <option value="efectivo">Efectivo</option>
            <option value="mercadopago">Mercado Pago</option>
          </select>
        </Campo>
        <Button
          type="button" variant="ghost" className="px-2 py-2"
          onClick={invertir} title="Invertir el sentido"
        >
          <ArrowRightLeft className="h-4 w-4" />
        </Button>
        <Campo label="Entra en" error={errors.a?.message}>
          <select className={SELECT} {...register('a')}>
            <option value="efectivo">Efectivo</option>
            <option value="mercadopago">Mercado Pago</option>
          </select>
        </Campo>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="Monto que sale (ARS)" error={errors.monto?.message}>
          <input type="number" step="0.01" className={INPUT} {...register('monto')} />
        </Campo>
        <Campo label="Monto que entra (ARS)" error={errors.montoRecibido?.message}>
          <input type="number" step="0.01" className={INPUT} {...register('montoRecibido')} />
        </Campo>
      </div>

      {hayDiferencia && (
        <p className="text-xs text-lila">
          Hay una diferencia de {formatARS(Math.abs(diferencia))}
          {diferencia > 0
            ? ': se toma como un costo del cambio y se reparte 50/50, igual que un gasto.'
            : ': entra más de lo que sale, se reparte 50/50 como ganancia.'}
        </p>
      )}

      <Button type="submit" disabled={cargando}>
        {cargando ? 'Guardando…' : 'Registrar cambio'}
      </Button>
    </form>
  );
}
