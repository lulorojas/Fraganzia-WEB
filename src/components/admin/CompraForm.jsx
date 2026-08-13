import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { compraSchema } from '../../schemas/compraSchema';
import { useSocios } from '../../hooks/useSocios';
import { usePerfumesAdmin } from '../../hooks/usePerfumesAdmin';
import { Button } from '../ui/Button';
import { PerfumeSearchSelect } from '../ui/PerfumeSearchSelect';

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

function toFormValues(c) {
  if (!c) return null;
  return { ...c, fecha: c.fecha?.toDate ? c.fecha.toDate().toISOString().slice(0, 10) : hoyISO() };
}

export function CompraForm({ compra, onSubmit, onCancel, cargando }) {
  const { data: perfumes } = usePerfumesAdmin();
  const { data: socios } = useSocios();

  const {
    register, handleSubmit, control, watch, setValue, reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(compraSchema),
    defaultValues: toFormValues(compra) ?? {
      proveedor: '',
      items: [{ perfumeId: '', perfumeNombre: '', cantidad: 1 }],
      montoTotal: '',
      pagadoPor: '',
      metodoPago: 'efectivo',
      fecha: hoyISO(),
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  useEffect(() => { if (compra) reset(toFormValues(compra)); }, [compra, reset]);

  function handlePerfumeChange(index, id, p) {
    setValue(`items.${index}.perfumeId`, id, { shouldValidate: true });
    setValue(`items.${index}.perfumeNombre`, p?.nombre ?? '');
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="Proveedor" error={errors.proveedor?.message}>
          <input className={INPUT} {...register('proveedor')} />
        </Campo>
        <Campo label="Fecha" error={errors.fecha?.message}>
          <input type="date" className={INPUT} {...register('fecha')} />
        </Campo>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm text-text-secondary">Perfumes comprados</p>
          <Button
            type="button" variant="ghost" className="shrink-0 text-xs px-2 py-1"
            onClick={() => append({ perfumeId: '', perfumeNombre: '', cantidad: 1 })}
          >
            + Agregar perfume
          </Button>
        </div>
        <div className="flex flex-col gap-3">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 gap-2 sm:grid-cols-[2fr_auto_auto] sm:items-end">
              <Campo label="Perfume" error={errors.items?.[index]?.perfumeId?.message}>
                <PerfumeSearchSelect
                  perfumes={perfumes}
                  value={watch(`items.${index}.perfumeId`)}
                  onChange={(id, p) => handlePerfumeChange(index, id, p)}
                />
              </Campo>
              <Campo label="Cantidad" error={errors.items?.[index]?.cantidad?.message}>
                <input type="number" min="1" className={`${INPUT} sm:w-24`} {...register(`items.${index}.cantidad`)} />
              </Campo>
              {fields.length > 1 && (
                <Button
                  type="button" variant="ghost"
                  className="self-start text-xs px-2 py-2 text-error sm:self-auto"
                  onClick={() => remove(index)}
                >
                  Quitar
                </Button>
              )}
            </div>
          ))}
        </div>
        {errors.items?.message && <p className="mt-2 text-xs text-error">{errors.items.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Campo label="Monto total (ARS)" error={errors.montoTotal?.message}>
          <input type="number" step="0.01" className={`${INPUT} font-luxury text-lg`} {...register('montoTotal')} />
        </Campo>
        <Campo label="Pagado por" error={errors.pagadoPor?.message}>
          <select className={SELECT} {...register('pagadoPor')}>
            <option value="">Elegir…</option>
            {socios?.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </Campo>
        <Campo label="Método de pago" error={errors.metodoPago?.message}>
          <select className={SELECT} {...register('metodoPago')}>
            <option value="efectivo">Efectivo</option>
            <option value="mercadopago">Mercado Pago</option>
          </select>
        </Campo>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={cargando}>
          {cargando ? 'Guardando…' : compra ? 'Guardar cambios' : 'Cargar compra'}
        </Button>
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>}
      </div>
    </form>
  );
}
