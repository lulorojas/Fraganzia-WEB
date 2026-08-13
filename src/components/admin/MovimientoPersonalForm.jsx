import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { movimientoPersonalSchema } from '../../schemas/movimientoPersonalSchema';
import { useSocios } from '../../hooks/useSocios';
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

export function MovimientoPersonalForm({ onSubmit, cargando }) {
  const { data: socios } = useSocios();
  const {
    register, handleSubmit, reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(movimientoPersonalSchema),
    defaultValues: { socioId: '', tipo: 'aporte', monto: '', metodo: 'efectivo', fecha: hoyISO() },
  });

  async function procesar(data) {
    await onSubmit(data);
    reset({ socioId: '', tipo: 'aporte', monto: '', metodo: 'efectivo', fecha: hoyISO() });
  }

  return (
    <form onSubmit={handleSubmit(procesar)} className="flex flex-col gap-4">
      <h3 className="font-display text-lg text-text">Movimiento personal</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="Socio" error={errors.socioId?.message}>
          <select className={SELECT} {...register('socioId')}>
            <option value="">Elegir…</option>
            {socios?.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </Campo>
        <Campo label="Tipo" error={errors.tipo?.message}>
          <select className={SELECT} {...register('tipo')}>
            <option value="aporte">Aporte</option>
            <option value="retiro">Retiro</option>
          </select>
        </Campo>
        <Campo label="Monto (ARS)" error={errors.monto?.message}>
          <input type="number" step="0.01" className={INPUT} {...register('monto')} />
        </Campo>
        <Campo label="Método" error={errors.metodo?.message}>
          <select className={SELECT} {...register('metodo')}>
            <option value="efectivo">Efectivo</option>
            <option value="mercadopago">Mercado Pago</option>
          </select>
        </Campo>
        <Campo label="Fecha" error={errors.fecha?.message}>
          <input type="date" className={INPUT} {...register('fecha')} />
        </Campo>
      </div>
      <Button type="submit" disabled={cargando}>{cargando ? 'Guardando…' : 'Cargar movimiento'}</Button>
    </form>
  );
}
