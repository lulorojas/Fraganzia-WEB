import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../ui/Button';

const INPUT = 'w-full rounded-xl border border-border bg-white/[0.03] px-3 py-2 font-body text-sm text-text placeholder:text-text-secondary/50 focus:border-violet focus:outline-none transition-colors';
const SELECT = 'w-full rounded-xl border border-border bg-bg px-3 py-2 font-body text-sm text-text focus:border-violet focus:outline-none transition-colors';

const TIPOS = [
  { value: 'descuento', label: 'Descuento (%)' },
  { value: '2x1', label: '2×1 — Llevás 2, pagás 1' },
  { value: 'otro', label: 'Otro (solo informativa)' },
];

export function PromocionForm({ promocion, onSubmit, onCancel, cargando }) {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: promocion ?? { titulo: '', descripcion: '', imagen: '', activa: true, orden: 1, tipo: 'descuento', descuentoPorcentaje: 0 },
  });
  const tipoActual = watch('tipo');

  useEffect(() => { if (promocion) reset(promocion); }, [promocion, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <label className="font-body text-sm text-text-secondary">Título</label>
        <input className={INPUT} {...register('titulo', { required: 'Requerido' })} />
        {errors.titulo && <p className="text-xs text-error">{errors.titulo.message}</p>}
      </div>
      <div>
        <label className="font-body text-sm text-text-secondary">Tipo de promoción</label>
        <select className={SELECT} {...register('tipo')}>
          {TIPOS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>
      {tipoActual === 'descuento' && (
        <div>
          <label className="font-body text-sm text-text-secondary">Descuento (%)</label>
          <input
            type="number" min="1" max="100" step="1"
            className={INPUT}
            {...register('descuentoPorcentaje', { valueAsNumber: true })}
          />
        </div>
      )}
      <div>
        <label className="font-body text-sm text-text-secondary">Descripción</label>
      <textarea rows={2} className={INPUT} {...register('descripcion')} />
      </div>
      <div>
        <label className="font-body text-sm text-text-secondary">URL de imagen</label>
        <input className={INPUT} {...register('imagen')} />
      </div>
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="font-body text-sm text-text-secondary">Orden</label>
          <input type="number" className={INPUT} {...register('orden', { valueAsNumber: true })} />
        </div>
        <label className="flex items-center gap-2 text-text-secondary cursor-pointer pb-2">
          <input type="checkbox" {...register('activa')} /> Activa
        </label>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={cargando}>
          {cargando ? 'Guardando…' : promocion ? 'Guardar cambios' : 'Crear promoción'}
        </Button>
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>}
      </div>
    </form>
  );
}
