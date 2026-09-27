import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ajusteStockSchema } from '../../schemas/ajusteStockSchema';
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

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function toFormValues(a) {
  if (!a) return null;
  return {
    ...a,
    // Se edita el valor absoluto; el signo lo pone el selector sumar/restar.
    cantidad: Math.abs(a.cantidad ?? 0),
    fecha: a.fecha?.toDate ? a.fecha.toDate().toISOString().slice(0, 10) : hoyISO(),
  };
}

export function AjusteStockForm({ ajuste, onSubmit, onCancel, cargando }) {
  const { data: perfumes } = usePerfumesAdmin();
  const [modo, setModo] = useState(() => ((ajuste?.cantidad ?? 1) < 0 ? 'restar' : 'sumar'));

  const {
    register, handleSubmit, watch, setValue, reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(ajusteStockSchema),
    defaultValues: toFormValues(ajuste) ?? {
      perfumeId: '', perfumeNombre: '', cantidad: 1, motivo: '', fecha: hoyISO(),
    },
  });

  useEffect(() => {
    if (!ajuste) return;
    reset(toFormValues(ajuste));
    setModo((ajuste.cantidad ?? 1) < 0 ? 'restar' : 'sumar');
  }, [ajuste, reset]);

  function handlePerfumeChange(id, p) {
    setValue('perfumeId', id, { shouldValidate: true });
    setValue('perfumeNombre', p?.nombre ?? '');
  }

  // El signo se aplica recién al enviar: en pantalla siempre se ve un número
  // positivo y el modo dice si suma o resta.
  function procesar(datos) {
    const cantidad = Math.abs(datos.cantidad) * (modo === 'restar' ? -1 : 1);
    onSubmit({ ...datos, cantidad });
  }

  return (
    <form onSubmit={handleSubmit(procesar)} className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'sumar', label: 'Sumar stock' },
          { id: 'restar', label: 'Descontar stock' },
        ].map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setModo(m.id)}
            className={`rounded-xl border px-3 py-1.5 text-sm transition-base ${
              modo === m.id
                ? 'border-violet bg-violet/20 text-text'
                : 'border-border text-text-secondary hover:text-text'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="Perfume" error={errors.perfumeId?.message}>
          <PerfumeSearchSelect
            perfumes={perfumes}
            value={watch('perfumeId')}
            onChange={handlePerfumeChange}
          />
        </Campo>
        <Campo label="Cantidad" error={errors.cantidad?.message}>
          <input type="number" min="1" className={INPUT} {...register('cantidad')} />
        </Campo>
        <Campo label="Fecha" error={errors.fecha?.message}>
          <input type="date" className={INPUT} {...register('fecha')} />
        </Campo>
        <Campo label="Motivo" error={errors.motivo?.message}>
          <input
            className={INPUT}
            placeholder={modo === 'sumar' ? 'ej. compra vieja sin registrar' : 'ej. frasco roto'}
            {...register('motivo')}
          />
        </Campo>
      </div>

      <p className="text-xs text-text-secondary">
        {modo === 'sumar'
          ? 'Este stock entra sin costo conocido, así que no se le puede calcular ganancia: cuando se venda, esa venta queda fuera del margen y se informa aparte.'
          : 'Descuenta unidades sin registrar una venta. No genera ingreso ni afecta el saldo entre socios.'}
      </p>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={cargando}>
          {cargando ? 'Guardando…' : ajuste ? 'Guardar cambios' : 'Registrar ajuste'}
        </Button>
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>}
      </div>
    </form>
  );
}
