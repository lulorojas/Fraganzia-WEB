import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ventaSocioSchema } from '../../schemas/ventaSocioSchema';
import { calcularStockPorProducto } from '../../services/panelFinancieroCalculos';
import { useSocios } from '../../hooks/useSocios';
import { useAjustesStock } from '../../hooks/useAjustesStock';
import { usePerfumesAdmin } from '../../hooks/usePerfumesAdmin';
import { useCompras } from '../../hooks/useCompras';
import { useVentasSocios } from '../../hooks/useVentasSocios';
import { useDolarBlue } from '../../hooks/useDolarBlue';
import { usdAArs } from '../../utils/precios';
import { METODOS_PAGO_SOCIOS, ESTADOS_VENTA_SOCIO } from '../../constants';
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

function toFormValues(v) {
  if (!v) return null;
  return { ...v, fecha: v.fecha?.toDate ? v.fecha.toDate().toISOString().slice(0, 10) : hoyISO() };
}

export function VentaSocioForm({ venta, onSubmit, onCancel, cargando }) {
  const { data: perfumes } = usePerfumesAdmin();
  const { data: socios } = useSocios();
  const { dolarMedio } = useDolarBlue();
  const { data: compras } = useCompras();
  const { data: ventasSocios } = useVentasSocios();
  const { data: ajustesStock } = useAjustesStock();

  const stockPorProducto = useMemo(
    () => calcularStockPorProducto(compras || [], ventasSocios || [], ajustesStock || []),
    [compras, ventasSocios, ajustesStock]
  );

  // Solo se puede vender lo que hay en stock. Al editar, el perfume ya elegido
  // se mantiene disponible aunque su stock haya llegado a 0 con esta misma venta.
  const perfumesVendibles = useMemo(() => {
    const idEditando = venta?.perfumeId;
    return (perfumes ?? []).filter(
      (p) => (stockPorProducto[p.id] ?? 0) > 0 || p.id === idEditando
    );
  }, [perfumes, stockPorProducto, venta]);

  const {
    register, handleSubmit, watch, setValue, reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(ventaSocioSchema),
    defaultValues: toFormValues(venta) ?? {
      perfumeId: '', perfumeNombre: '', cantidad: 1, precioUnitario: '',
      vendidoPor: '', metodoPago: METODOS_PAGO_SOCIOS[0], estado: 'pendiente',
      fecha: hoyISO(),
    },
  });

  useEffect(() => { if (venta) reset(toFormValues(venta)); }, [venta, reset]);

  const perfumeId = watch('perfumeId');
  const cantidad = Number(watch('cantidad')) || 0;
  const estado = watch('estado');

  function handlePerfumeChange(id, p) {
    setValue('perfumeId', id, { shouldValidate: true });
    setValue('perfumeNombre', p?.nombre ?? '');
    if (p && dolarMedio) {
      setValue('precioUnitario', Math.round(usdAArs(p.precioUSD, dolarMedio)));
    }
  }

  const stockActual = perfumeId ? (stockPorProducto[perfumeId] ?? 0) : null;
  const excedeStock = estado === 'cobrada' && stockActual !== null && cantidad > stockActual;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="Perfume" error={errors.perfumeId?.message}>
          <PerfumeSearchSelect
            perfumes={perfumesVendibles}
            value={perfumeId}
            onChange={handlePerfumeChange}
            stockPorProducto={stockPorProducto}
            mensajeVacio="No hay perfumes en stock. Cargá una compra primero."
          />
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
        <Campo label="Estado" error={errors.estado?.message}>
          <select className={SELECT} {...register('estado')}>
            {ESTADOS_VENTA_SOCIO.map((e) => (
              <option key={e} value={e}>{e === 'pendiente' ? 'Pendiente de cobro' : 'Cobrada'}</option>
            ))}
          </select>
        </Campo>
        <Campo label="Fecha" error={errors.fecha?.message}>
          <input type="date" className={INPUT} {...register('fecha')} />
        </Campo>
      </div>

      {perfumeId && (
        <p className="text-sm text-text-secondary">Stock disponible: {stockActual}</p>
      )}

      {excedeStock && (
        <p className="text-sm text-error">
          Atención: estás cobrando {cantidad} unidades pero el stock de este perfume es
          {' '}{stockActual}. Podés guardar igual si el negocio real lo permite.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={cargando}>
          {cargando ? 'Guardando…' : venta ? 'Guardar cambios' : 'Cargar venta'}
        </Button>
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>}
      </div>
    </form>
  );
}
