import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { gastoSchema } from '../../schemas/gastoSchema';
import { useSocios } from '../../hooks/useSocios';
import { GASTO_CATEGORIAS } from '../../constants';
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

function toFormValues(g) {
  if (!g) return null;
  return { ...g, fecha: g.fecha?.toDate ? g.fecha.toDate().toISOString().slice(0, 10) : hoyISO() };
}

export function GastoForm({ gasto, onSubmit, onCancel, cargando }) {
  const { data: socios } = useSocios();

  const {
    register, handleSubmit, reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(gastoSchema),
    defaultValues: toFormValues(gasto) ?? {
      categoria: GASTO_CATEGORIAS[0], descripcion: '', monto: '',
      pagadoPor: '', metodoPago: 'efectivo', fecha: hoyISO(),
    },
  });

  useEffect(() => { if (gasto) reset(toFormValues(gasto)); }, [gasto, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="Categoría" error={errors.categoria?.message}>
          <select className={SELECT} {...register('categoria')}>
            {GASTO_CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Campo>
        <Campo label="Monto (ARS)" error={errors.monto?.message}>
          <input type="number" step="0.01" className={INPUT} {...register('monto')} />
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
        <Campo label="Fecha" error={errors.fecha?.message}>
          <input type="date" className={INPUT} {...register('fecha')} />
        </Campo>
      </div>

      <Campo label="Descripción" error={errors.descripcion?.message}>
        <input className={INPUT} {...register('descripcion')} />
      </Campo>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={cargando}>
          {cargando ? 'Guardando…' : gasto ? 'Guardar cambios' : 'Cargar gasto'}
        </Button>
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>}
      </div>
    </form>
  );
}
