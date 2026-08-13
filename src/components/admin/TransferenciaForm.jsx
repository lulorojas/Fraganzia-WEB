import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { transferenciaSchema } from '../../schemas/transferenciaSchema';
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

export function TransferenciaForm({ onSubmit, cargando }) {
  const { data: socios } = useSocios();
  const {
    register, handleSubmit, reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(transferenciaSchema),
    defaultValues: { de: '', a: '', monto: '', metodo: 'efectivo', fecha: hoyISO() },
  });

  async function procesar(data) {
    await onSubmit(data);
    reset({ de: '', a: '', monto: '', metodo: 'efectivo', fecha: hoyISO() });
  }

  return (
    <form onSubmit={handleSubmit(procesar)} className="flex flex-col gap-4">
      <h3 className="font-display text-lg text-text">Transferencia entre socios</h3>
      <p className="text-xs text-text-secondary">
        Es solo un registro contable: deja constancia de un pago ya realizado por fuera del
        sistema. No mueve dinero real.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="De (quién transfiere)" error={errors.de?.message}>
          <select className={SELECT} {...register('de')}>
            <option value="">Elegir…</option>
            {socios?.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </Campo>
        <Campo label="A (quién recibe)" error={errors.a?.message}>
          <select className={SELECT} {...register('a')}>
            <option value="">Elegir…</option>
            {socios?.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
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
      <Button type="submit" disabled={cargando}>{cargando ? 'Guardando…' : 'Registrar transferencia'}</Button>
    </form>
  );
}
