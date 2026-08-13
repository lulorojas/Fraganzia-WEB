import { useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { compraSchema } from '../../schemas/compraSchema';
import { useSocios } from '../../hooks/useSocios';
import { usePerfumesAdmin } from '../../hooks/usePerfumesAdmin';
import { METODOS_PAGO_SOCIOS } from '../../constants';
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
      pagos: [{ socioId: '', monto: '', metodo: METODOS_PAGO_SOCIOS[0] }],
      fecha: hoyISO(),
    },
  });

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({ control, name: 'items' });
  const { fields: pagoFields, append: appendPago, remove: removePago } = useFieldArray({ control, name: 'pagos' });

  useEffect(() => { if (compra) reset(toFormValues(compra)); }, [compra, reset]);

  const montoTotal = Number(watch('montoTotal')) || 0;
  const pagos = watch('pagos') || [];
  const sumaPagos = useMemo(() => pagos.reduce((acc, p) => acc + (Number(p.monto) || 0), 0), [pagos]);

  // Con un solo pago, no tiene sentido tipear el mismo monto dos veces.
  useEffect(() => {
    if (pagoFields.length === 1) setValue('pagos.0.monto', montoTotal || '');
  }, [montoTotal, pagoFields.length, setValue]);

  function handlePerfumeChange(index, id, p) {
    setValue(`items.${index}.perfumeId`, id);
    setValue(`items.${index}.perfumeNombre`, p?.nombre ?? '');
  }

  const desbalanceado = Math.abs(sumaPagos - montoTotal) >= 0.01;

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
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm text-text-secondary">Perfumes comprados</p>
          <Button
            type="button" variant="ghost" className="text-xs px-2 py-1"
            onClick={() => appendItem({ perfumeId: '', perfumeNombre: '', cantidad: 1 })}
          >
            + Agregar perfume
          </Button>
        </div>
        <div className="flex flex-col gap-3">
          {itemFields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 gap-2 sm:grid-cols-[2fr_1fr_auto] items-end">
              <Campo label="Perfume" error={errors.items?.[index]?.perfumeId?.message}>
                <PerfumeSearchSelect
                  perfumes={perfumes}
                  value={watch(`items.${index}.perfumeId`)}
                  onChange={(id, p) => handlePerfumeChange(index, id, p)}
                />
              </Campo>
              <Campo label="Cantidad" error={errors.items?.[index]?.cantidad?.message}>
                <input type="number" min="1" className={INPUT} {...register(`items.${index}.cantidad`)} />
              </Campo>
              {itemFields.length > 1 && (
                <Button type="button" variant="ghost" className="text-xs px-2 py-1 text-error" onClick={() => removeItem(index)}>
                  Quitar
                </Button>
              )}
            </div>
          ))}
        </div>
        {errors.items?.message && <p className="mt-2 text-xs text-error">{errors.items.message}</p>}
      </div>

      <Campo label="Monto total (ARS)" error={errors.montoTotal?.message}>
        <input type="number" step="0.01" className={`${INPUT} text-xl font-luxury`} {...register('montoTotal')} />
      </Campo>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm text-text-secondary">Pagos por socio</p>
          <Button
            type="button" variant="ghost" className="text-xs px-2 py-1"
            onClick={() => appendPago({ socioId: '', monto: '', metodo: METODOS_PAGO_SOCIOS[0] })}
          >
            + Agregar pago
          </Button>
        </div>
        <div className="flex flex-col gap-3">
          {pagoFields.map((field, index) => (
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
              {pagoFields.length > 1 && (
                <Button type="button" variant="ghost" className="text-xs px-2 py-1 text-error" onClick={() => removePago(index)}>
                  Quitar
                </Button>
              )}
            </div>
          ))}
        </div>
        {errors.pagos?.message && <p className="mt-2 text-xs text-error">{errors.pagos.message}</p>}
        {desbalanceado && (
          <p className="mt-2 text-xs text-error">
            La suma de pagos ({sumaPagos.toFixed(2)}) no coincide con el monto total ({montoTotal.toFixed(2)}).
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
