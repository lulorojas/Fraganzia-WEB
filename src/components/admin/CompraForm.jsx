import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { compraSchema } from '../../schemas/compraSchema';
import { useSocios } from '../../hooks/useSocios';
import { usePerfumesAdmin } from '../../hooks/usePerfumesAdmin';
import { pagosDeCompra } from '../../services/panelFinancieroCalculos';
import { SOCIOS, METODOS_PAGO_SOCIOS } from '../../constants';
import { Button } from '../ui/Button';
import { PerfumeSearchSelect } from '../ui/PerfumeSearchSelect';
import { CompraPagos } from './CompraPagos';

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

// Normaliza compras viejas (un solo pagador en `pagadoPor`) a `pagos[]`, así
// una compra cargada antes del reparto se puede editar sin romperse.
function toFormValues(c) {
  if (!c) return null;
  return {
    ...c,
    pagos: pagosDeCompra(c),
    fecha: c.fecha?.toDate ? c.fecha.toDate().toISOString().slice(0, 10) : hoyISO(),
  };
}

function modoDePagos(pagos, montoTotal) {
  if (!pagos || pagos.length <= 1) return 'uno';
  const mitad = (Number(montoTotal) || 0) / 2;
  const esMitad = pagos.every((p) => Math.abs((Number(p.monto) || 0) - mitad) <= 0.5);
  return esMitad ? 'mitad' : 'personalizado';
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
      pagos: [{ socioId: '', monto: 0, metodo: METODOS_PAGO_SOCIOS[0] }],
      fecha: hoyISO(),
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const montoTotal = watch('montoTotal');
  const pagos = watch('pagos');
  const [modo, setModo] = useState(() => modoDePagos(compra?.pagos, compra?.montoTotal));

  useEffect(() => {
    if (!compra) return;
    const valores = toFormValues(compra);
    reset(valores);
    setModo(modoDePagos(valores.pagos, valores.montoTotal));
  }, [compra, reset]);

  // Al cambiar el total hay que redistribuir: si no, los montos quedarían con
  // el reparto del total anterior y la suma dejaría de cerrar.
  useEffect(() => {
    const total = Number(montoTotal) || 0;
    if (modo === 'uno') {
      setValue('pagos', [{ socioId: pagos?.[0]?.socioId ?? '', monto: total, metodo: pagos?.[0]?.metodo ?? METODOS_PAGO_SOCIOS[0] }]);
    } else if (modo === 'mitad') {
      setValue('pagos', SOCIOS.map((s, i) => ({
        socioId: s.id, monto: total / 2, metodo: pagos?.[i]?.metodo ?? METODOS_PAGO_SOCIOS[0],
      })));
    } else {
      // Reparto libre: se conserva lo del primero y el resto va al segundo.
      const primero = Math.min(Number(pagos?.[0]?.monto) || 0, total);
      setValue('pagos', SOCIOS.map((s, i) => ({
        socioId: s.id,
        monto: i === 0 ? primero : total - primero,
        metodo: pagos?.[i]?.metodo ?? METODOS_PAGO_SOCIOS[0],
      })));
    }
    // `pagos` no va en las dependencias a propósito: se escribe acá adentro y
    // volvería a dispararse en loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [montoTotal, modo, setValue]);

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="Monto total de la compra (ARS)" error={errors.montoTotal?.message}>
          <input type="number" step="0.01" className={`${INPUT} font-luxury text-lg`} {...register('montoTotal')} />
        </Campo>
      </div>

      <CompraPagos
        modo={modo}
        onModoChange={setModo}
        montoTotal={montoTotal}
        pagos={pagos}
        onPagosChange={(nuevos) => setValue('pagos', nuevos, { shouldValidate: true })}
        socios={socios}
        error={errors.pagos?.message ?? errors.pagos?.[0]?.socioId?.message}
      />

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={cargando}>
          {cargando ? 'Guardando…' : compra ? 'Guardar cambios' : 'Cargar compra'}
        </Button>
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>}
      </div>
    </form>
  );
}
