import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../ui/Button';

const INPUT = 'w-full rounded-xl border border-border bg-transparent px-3 py-2 text-text';

export function PromocionForm({ promocion, onSubmit, onCancel, cargando }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: promocion ?? { titulo: '', descripcion: '', imagen: '', activa: true, orden: 1 },
  });

  useEffect(() => { if (promocion) reset(promocion); }, [promocion, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <label className="text-sm text-text-secondary">Título</label>
        <input className={INPUT} {...register('titulo', { required: 'Requerido' })} />
        {errors.titulo && <p className="text-xs text-error">{errors.titulo.message}</p>}
      </div>
      <div>
        <label className="text-sm text-text-secondary">Descripción</label>
        <textarea rows={2} className={INPUT} {...register('descripcion')} />
      </div>
      <div>
        <label className="text-sm text-text-secondary">URL de imagen</label>
        <input className={INPUT} {...register('imagen')} />
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-sm text-text-secondary">Orden</label>
          <input type="number" className={INPUT} {...register('orden', { valueAsNumber: true })} />
        </div>
        <label className="flex items-center gap-2 text-text-secondary cursor-pointer mt-5">
          <input type="checkbox" {...register('activa')} /> Activa
        </label>
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={cargando}>
          {cargando ? 'Guardando…' : promocion ? 'Guardar cambios' : 'Crear promoción'}
        </Button>
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>}
      </div>
    </form>
  );
}
