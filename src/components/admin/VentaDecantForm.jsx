import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ventaDecantSchema } from '../../schemas/ventaDecantSchema';
import { useSocios } from '../../hooks/useSocios';
import { usePerfumesAdmin } from '../../hooks/usePerfumesAdmin';
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

function toFormValues(v) {
  if (!v) return null;
  return { ...v, fecha: v.fecha?.toDate ? v.fecha.toDate().toISOString().slice(0, 10) : hoyISO() };
}

export function VentaDecantForm({ venta, onSubmit, onCancel, cargando }) {
  const { data: perfumes } = usePerfumesAdmin();
  const { data: socios } = useSocios();

  const {
    register, handleSubmit, watch, setValue, reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(ventaDecantSchema),
    defaultValues: toFormValues(venta) ?? {
      perfumeId: '', perfumeNombre: '', tamano: '', cantidad: 1, precioUnitario: '',
      vendidoPor: '', metodoPago: 'efectivo', fecha: hoyISO(),
    },
  });

  useEffect(() => { if (venta) reset(toFormValues(venta)); }, [venta, reset]);

  function handlePerfumeChange(e) {
    const id = e.target.value;
    const p = perfumes?.find((x) => x.id === id);
    setValue('perfumeId', id);
    setValue('perfumeNombre', p?.nombre ?? '');
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="Perfume" error={errors.perfumeId?.message}>
          <select className={SELECT} value={watch('perfumeId')} onChange={handlePerfumeChange}>
            <option value="">Elegir…</option>
            {perfumes?.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </Campo>
        <Campo label="Tamaño" error={errors.tamano?.message}>
          <input className={INPUT} placeholder="ej. 5ml" {...register('tamano')} />
        </Campo>
        <Campo label="Cantidad" error={errors.cantidad?.message}>
          <input type="number" min="1" className={INPUT} {...register('cantidad')} />
        </Campo>
        <Campo label="Precio unitario (ARS)" error={errors.precioUnitario?.message}>
          <input type="number" step="0.01" className={INPUT} {...register('precioUnitario')} />
        </Campo>
        <Campo label="Vendido por" error={errors.vendidoPor?.message}>
          <select className={SELECT} {...register('vendidoPor')}>
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
        <Campo label="Fecha" error={errors.fecha?.message}>
          <input type="date" className={INPUT} {...register('fecha')} />
        </Campo>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={cargando}>
          {cargando ? 'Guardando…' : venta ? 'Guardar cambios' : 'Cargar venta'}
        </Button>
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>}
      </div>
    </form>
  );
}
