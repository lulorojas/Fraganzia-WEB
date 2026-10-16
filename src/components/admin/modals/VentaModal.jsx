import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TrendingUp } from 'lucide-react';
import { ventaSocioSchema } from '../../../schemas/ventaSocioSchema';
import { usePerfumesAdmin } from '../../../hooks/usePerfumesAdmin';
import { useStock } from '../../../hooks/useStock';
import { useDolarBlue } from '../../../hooks/useDolarBlue';
import { useSocioActual } from '../../../hooks/useSocioActual';
import { useCrearVenta, useEditarVenta } from '../../../hooks/useVentasSocios';
import { itemsDeVenta } from '../../../services/panelFinancieroCalculos';
import { precioListaARS } from '../../../utils/precios';
import { fechaInput } from '../../../utils/format';
import { Field, Seg } from '../ui/kit';
import { ModalShell, PerfumePicker, SocioSeg, MetodoSeg, TotalBar } from './shared';

export function VentaModal({ editando, onClose, onGuardado }) {
  const { data: perfumes } = usePerfumesAdmin();
  const { stock } = useStock();
  const { dolarMedio } = useDolarBlue();
  const socioActualId = useSocioActual();
  const crear = useCrearVenta();
  const editar = useEditarVenta();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(ventaSocioSchema),
    defaultValues: editando
      ? {
        items: itemsDeVenta(editando).map((i) => ({ ...i })),
        vendidoPor: editando.vendidoPor, metodoPago: editando.metodoPago, estado: editando.estado,
        fecha: fechaInput(editando.fecha),
      }
      : { items: [], vendidoPor: socioActualId, metodoPago: 'efectivo', estado: 'pendiente', fecha: fechaInput() },
  });

  const items = watch('items');

  // Solo se vende lo que hay. Al editar una venta ya cobrada, sus unidades ya
  // salieron del stock: se le devuelven para poder dejarla como estaba.
  const disponible = useMemo(() => {
    const d = { ...stock };
    if (editando?.estado === 'cobrada') {
      itemsDeVenta(editando).forEach((i) => { d[i.perfumeId] = (d[i.perfumeId] ?? 0) + (i.cantidad ?? 0); });
    }
    return d;
  }, [stock, editando]);

  const vendibles = useMemo(
    () => (perfumes ?? []).filter((p) => (disponible[p.id] ?? 0) > 0),
    [perfumes, disponible]
  );

  const total = (items ?? []).reduce((a, i) => a + (Number(i.cantidad) || 0) * (Number(i.precioUnitario) || 0), 0);
  const guardando = crear.isPending || editar.isPending;

  async function guardar(datos) {
    if (editando) {
      await editar.mutateAsync({ id: editando.id, datosNuevos: datos, valorAnterior: editando, socioId: socioActualId });
    } else {
      await crear.mutateAsync({ datos, socioId: socioActualId });
    }
    onGuardado(editando ? 'Venta actualizada' : 'Venta guardada');
  }

  return (
    <ModalShell Icon={TrendingUp} title={editando ? 'Editar venta' : 'Nueva venta'} sub="Podés cargar varios perfumes en la misma venta." onClose={onClose}>
      <form onSubmit={handleSubmit(guardar)} className="flex flex-col gap-4">
        <Field label="Perfumes de la venta" error={errors.items?.message ?? errors.items?.[0]?.precioUnitario?.message}>
          <PerfumePicker
            perfumes={vendibles}
            items={items}
            stock={disponible}
            priced
            precioInicial={(p) => precioListaARS(p, dolarMedio) || ''}
            hint="Solo aparecen los perfumes con stock."
            vacio="No hay perfumes con stock. Cargá una compra primero."
            onChange={(v) => setValue('items', v, { shouldValidate: true })}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Vendido por"><SocioSeg value={watch('vendidoPor')} onChange={(v) => setValue('vendidoPor', v)} /></Field>
          <Field label="Cobro"><MetodoSeg value={watch('metodoPago')} onChange={(v) => setValue('metodoPago', v)} /></Field>
          <Field label="Estado" hint="Al cobrarla se descuenta el stock.">
            <Seg full value={watch('estado')} onChange={(v) => setValue('estado', v)} options={[
              { value: 'pendiente', label: 'Pendiente' }, { value: 'cobrada', label: 'Cobrada' },
            ]} />
          </Field>
          <Field label="Fecha" error={errors.fecha?.message}><input type="date" className="input" {...register('fecha')} /></Field>
        </div>

        <TotalBar label="Total de la venta" monto={total} />

        <div className="adm-modal-foot">
          <button type="submit" className="btn btn-primary" disabled={guardando || !items?.length}>
            {guardando ? 'Guardando…' : 'Guardar venta'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        </div>
      </form>
    </ModalShell>
  );
}
