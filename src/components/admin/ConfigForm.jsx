import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../ui/Button';

const INPUT = 'w-full rounded-xl border border-border bg-white/[0.03] px-3 py-2 font-body text-sm text-text placeholder:text-text-secondary/50 focus:border-violet focus:outline-none transition-colors';

export function ConfigForm({ config, onSubmit, cargando }) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: config ?? { dolarBlueManual: '', whatsappNumero: '' },
  });

  useEffect(() => { if (config) reset(config); }, [config, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 max-w-md">
      <div>
        <label className="font-body text-sm text-text-secondary">Dólar blue manual (fallback)</label>
        <input
          type="number"
          step="0.01"
          className={INPUT}
          {...register('dolarBlueManual', { valueAsNumber: true })}
        />
        <p className="text-xs text-text-secondary mt-1">
          Se usa si la API de dólar no responde.
        </p>
      </div>
      <div>
        <label className="font-body text-sm text-text-secondary">Número de WhatsApp</label>
        <input className={INPUT} {...register('whatsappNumero')} />
        <p className="text-xs text-text-secondary mt-1">
          Formato: 5491130097370 (sin + ni espacios)
        </p>
      </div>
      <Button type="submit" disabled={cargando}>
        {cargando ? 'Guardando…' : 'Guardar configuración'}
      </Button>
    </form>
  );
}
