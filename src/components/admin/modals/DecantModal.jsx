import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Droplet } from 'lucide-react';
import { ventaDecantSchema } from '../../../schemas/ventaDecantSchema';
import { usePerfumesAdmin } from '../../../hooks/usePerfumesAdmin';
import { useStock } from '../../../hooks/useStock';
import { useSocioActual } from '../../../hooks/useSocioActual';
import { useCrearVentaDecant, useEditarVentaDecant } from '../../../hooks/useVentasDecants';
import { DECANT_TAMANOS } from '../../../constants';
import { normalizarTamano } from '../../../services/analyticsCalculos';
import { fechaInput } from '../../../utils/format';
import { Field, Seg } from '../ui/kit';
import { ModalShell, PerfumePicker, SocioSeg, MetodoSeg, TotalBar, Stepper } from './shared';

const precioDe = (tamano) => DECANT_TAMANOS.find((t) => `${t.ml} ml` === tamano)?.precio ?? '';

export function DecantModal({ editando, onClose, onGuardado }) {
  const { data: perfumes } = usePerfumesAdmin();
  const { stock } = useStock();
  const socioActualId = useSocioActual();
  const crear = useCrearVentaDecant();
  const editar = useEditarVentaDecant();
  const [precioTocado, setPrecioTocado] = useState(Boolean(editando));

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(ventaDecantSchema),
    defaultValues: editando
      ? { ...editando, tamano: normalizarTamano(editando.tamano), fecha: fechaInput(editando.fecha) }
      : {
        perfumeId: '', perfumeNombre: '', tamano: '5 ml', cantidad: 1, precioUnitario: precioDe('5 ml'),
        vendidoPor: socioActualId, metodoPago: 'efectivo', fecha: fechaInput(),
      },
  });

  const perfumeId = watch('perfumeId');
  const tamano = watch('tamano');
  const cantidad = Number(watch('cantidad')) || 1;
  const precio = Number(watch('precioUnitario')) || 0;

  const conStock = useMemo(
    () => (perfumes ?? []).filter((p) => (stock[p.id] ?? 0) > 0 || p.id === editando?.perfumeId),
    [perfumes, stock, editando]
  );

  const guardando = crear.isPending || editar.isPending;

  async function guardar(datos) {
    if (editando) {
      await editar.mutateAsync({ id: editando.id, datosNuevos: datos, valorAnterior: editando, socioId: socioActualId });
    } else {
      await crear.mutateAsync({ datos, socioId: socioActualId });
    }
    onGuardado(editando ? 'Decant actualizado' : 'Decant guardado');
  }

  return (
    <ModalShell Icon={Droplet} title={editando ? 'Editar decant' : 'Nuevo decant'} sub="Fraccionado de un perfume que tengamos en stock." onClose={onClose}>
      <form onSubmit={handleSubmit(guardar)} className="flex flex-col gap-4">
        <Field label="Perfume" error={errors.perfumeId?.message}>
          <PerfumePicker
            perfumes={conStock}
            multi={false}
            stock={stock}
            items={perfumeId ? [{ perfumeId, perfumeNombre: watch('perfumeNombre'), cantidad: 1 }] : []}
            hint="Solo aparecen los perfumes con stock. El decant no descuenta frascos."
            vacio="No hay perfumes con stock."
            onChange={(v) => {
              setValue('perfumeId', v[0]?.perfumeId ?? '', { shouldValidate: true });
              setValue('perfumeNombre', v[0]?.perfumeNombre ?? '');
            }}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Tamaño">
            <Seg full value={tamano} onChange={(v) => {
              setValue('tamano', v);
              if (!precioTocado) setValue('precioUnitario', precioDe(v));
            }} options={DECANT_TAMANOS.map((t) => ({ value: `${t.ml} ml`, label: `${t.ml} ml` }))} />
          </Field>
          <Field label="Cantidad">
            <div><Stepper value={cantidad} onChange={(n) => setValue('cantidad', n)} /></div>
          </Field>
          <Field label="Precio por decant ($)" error={errors.precioUnitario?.message} hint="Precio sugerido según el tamaño; podés cambiarlo.">
            <input className="input" inputMode="numeric" {...register('precioUnitario', { onChange: () => setPrecioTocado(true) })} />
          </Field>
          <Field label="Vendido por"><SocioSeg value={watch('vendidoPor')} onChange={(v) => setValue('vendidoPor', v)} /></Field>
          <Field label="Cobro"><MetodoSeg value={watch('metodoPago')} onChange={(v) => setValue('metodoPago', v)} /></Field>
          <Field label="Fecha" error={errors.fecha?.message}><input type="date" className="input" {...register('fecha')} /></Field>
        </div>

        <TotalBar label="Total del decant" monto={cantidad * precio} />

        <div className="adm-modal-foot">
          <button type="submit" className="btn btn-primary" disabled={guardando || !perfumeId}>
            {guardando ? 'Guardando…' : 'Guardar decant'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        </div>
      </form>
    </ModalShell>
  );
}
