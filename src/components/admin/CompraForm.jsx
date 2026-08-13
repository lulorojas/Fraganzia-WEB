import { useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { compraSchema } from '../../schemas/compraSchema';
import { useSocios } from '../../hooks/useSocios';
import { usePerfumesAdmin } from '../../hooks/usePerfumesAdmin';
import { METODOS_PAGO_SOCIOS } from '../../constants';
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
      proveedor: '', perfumeId: '', perfumeNombre: '', cantidad: 1,
      costoUnitario: '', costoTotal: '',
      pagos: [{ socioId: '', monto: '', metodo: METODOS_PAGO_SOCIOS[0] }],
      fecha: hoyISO(),
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'pagos' });

  useEffect(() => { if (compra) reset(toFormValues(compra)); }, [compra, reset]);

  const cantidad = Number(watch('cantidad')) || 0;
  const costoUnitario = Number(watch('costoUnitario')) || 0;
  const pagos = watch('pagos') || [];
  const costoTotalCalculado = useMemo(() => cantidad * costoUnitario, [cantidad, costoUnitario]);
  const sumaPagos = useMemo(() => pagos.reduce((acc, p) => acc + (Number(p.monto) || 0), 0), [pagos]);

  useEffect(() => { setValue('costoTotal', costoTotalCalculado); }, [costoTotalCalculado, setValue]);

  function handlePerfumeChange(e) {
    const id = e.target.value;
    const p = perfumes?.find((x) => x.id === id);
    setValue('perfumeId', id);
    setValue('perfumeNombre', p?.nombre ?? '');
  }

  const desbalanceado = Math.abs(sumaPagos - costoTotalCalculado) >= 0.01;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="Proveedor" error={errors.proveedor?.message}>
          <input className={INPUT} {...register('proveedor')} />
        </Campo>
        <Campo label="Perfume" error={errors.perfumeId?.message}>
          <select className={SELECT} value={watch('perfumeId')} onChange={handlePerfumeChange}>
            <option value="">Elegir…</option>
            {perfumes?.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </Campo>
        <Campo label="Cantidad" error={errors.cantidad?.message}>
          <input type="number" min="1" className={INPUT} {...register('cantidad')} />
        </Campo>
        <Campo label="Costo unitario (ARS)" error={errors.costoUnitario?.message}>
          <input type="number" step="0.01" className={INPUT} {...register('costoUnitario')} />
        </Campo>
        <Campo label="Fecha" error={errors.fecha?.message}>
          <input type="date" className={INPUT} {...register('fecha')} />
        </Campo>
      </div>

      <p className="text-sm text-text-secondary">Costo total: {costoTotalCalculado.toFixed(2)}</p>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm text-text-secondary">Pagos por socio</p>
          <Button
            type="button" variant="ghost" className="text-xs px-2 py-1"
            onClick={() => append({ socioId: '', monto: '', metodo: METODOS_PAGO_SOCIOS[0] })}
          >
            + Agregar pago
          </Button>
        </div>
        <div className="flex flex-col gap-3">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 gap-2 sm:grid-cols-4 items-end">
              <Campo label="Socio">
                <select className={SELECT} {...register(`pagos.${index}.socioId`)}>
                  <option value="">Elegir…</option>
                  {socios?.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </Campo>
              <Campo label="Monto">
                <input type="number" step="0.01" className={INPUT} {...register(`pagos.${index}.monto`)} />
              </Campo>
              <Campo label="Método">
                <select className={SELECT} {...register(`pagos.${index}.metodo`)}>
                  <option value="efectivo">Efectivo</option>
                  <option value="mercadopago">Mercado Pago</option>
                </select>
              </Campo>
              {fields.length > 1 && (
                <Button type="button" variant="ghost" className="text-xs px-2 py-1 text-error" onClick={() => remove(index)}>
                  Quitar
                </Button>
              )}
            </div>
          ))}
        </div>
        {errors.pagos?.message && <p className="mt-2 text-xs text-error">{errors.pagos.message}</p>}
        {desbalanceado && (
          <p className="mt-2 text-xs text-error">
            La suma de pagos ({sumaPagos.toFixed(2)}) no coincide con el costo total ({costoTotalCalculado.toFixed(2)}).
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={cargando || desbalanceado}>
          {cargando ? 'Guardando…' : compra ? 'Guardar cambios' : 'Cargar compra'}
        </Button>
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>}
      </div>
    </form>
  );
}
