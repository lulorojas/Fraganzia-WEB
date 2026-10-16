import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShoppingCart } from 'lucide-react';
import { compraSchema } from '../../../schemas/compraSchema';
import { usePerfumesAdmin } from '../../../hooks/usePerfumesAdmin';
import { useSocioActual } from '../../../hooks/useSocioActual';
import { useCrearCompra, useEditarCompra } from '../../../hooks/useCompras';
import { pagosDeCompra, totalDeCompra } from '../../../services/panelFinancieroCalculos';
import { fechaInput } from '../../../utils/format';
import { Field, Seg } from '../ui/kit';
import { ModalShell, PerfumePicker, MetodoSeg } from './shared';

// Mismo schema de la compra sin `pagos`: el reparto se arma al guardar y recién
// ahí se valida completo con compraSchema.
const schemaForm = compraSchema.innerType().omit({ pagos: true });

// Cómo se pagó: un socio solo, mitad y mitad, o (al editar una compra vieja) un
// reparto distinto que se conserva tal cual.
function modoInicial(compra) {
  if (!compra) return 'luciano';
  const pagos = pagosDeCompra(compra);
  const total = totalDeCompra(compra);
  if (pagos.length === 1) return pagos[0].socioId;
  const mitad = pagos.length === 2 && pagos.every((p) => Math.abs((p.monto ?? 0) - total / 2) <= 0.5);
  return mitad ? 'mitad' : 'otro';
}

function armarPagos(modo, total, metodo, original) {
  if (modo === 'mitad') {
    return [{ socioId: 'luciano', monto: total / 2, metodo }, { socioId: 'benja', monto: total / 2, metodo }];
  }
  if (modo === 'otro') {
    // Se conserva la proporción original aunque cambie el total.
    const base = pagosDeCompra(original);
    const suma = base.reduce((a, p) => a + (p.monto ?? 0), 0) || 1;
    return base.map((p) => ({ ...p, monto: (total * (p.monto ?? 0)) / suma }));
  }
  return [{ socioId: modo, monto: total, metodo }];
}

export function CompraModal({ editando, onClose, onGuardado }) {
  const { data: perfumes } = usePerfumesAdmin();
  const socioActualId = useSocioActual();
  const crear = useCrearCompra();
  const editar = useEditarCompra();
  const [modo, setModo] = useState(() => modoInicial(editando));
  const [metodo, setMetodo] = useState(() => pagosDeCompra(editando)[0]?.metodo ?? 'efectivo');

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    // El reparto se arma al guardar a partir del modo elegido, no se tipea.
    resolver: zodResolver(schemaForm),
    defaultValues: editando
      ? {
        proveedor: editando.proveedor, items: editando.items.map((i) => ({ ...i })),
        montoTotal: totalDeCompra(editando), fecha: fechaInput(editando.fecha),
      }
      : { proveedor: '', items: [], montoTotal: '', fecha: fechaInput() },
  });

  const items = watch('items');
  const guardando = crear.isPending || editar.isPending;

  async function guardar(datos) {
    const total = Number(datos.montoTotal);
    const completo = { ...datos, pagos: armarPagos(modo, total, metodo, editando) };
    const validado = compraSchema.parse(completo);
    if (editando) {
      await editar.mutateAsync({ id: editando.id, datosNuevos: validado, valorAnterior: editando, socioId: socioActualId });
    } else {
      await crear.mutateAsync({ datos: validado, socioId: socioActualId });
    }
    onGuardado(editando ? 'Compra actualizada' : 'Compra guardada');
  }

  const opciones = [
    { value: 'luciano', label: 'Luciano' },
    { value: 'benja', label: 'Benja' },
    { value: 'mitad', label: 'Mitad y mitad' },
    ...(modo === 'otro' ? [{ value: 'otro', label: 'Reparto actual' }] : []),
  ];

  return (
    <ModalShell Icon={ShoppingCart} title={editando ? 'Editar compra' : 'Nueva compra'} sub="Cargá todos los perfumes que vinieron y cuánto se pagó en total." onClose={onClose}>
      <form onSubmit={handleSubmit(guardar)} className="flex flex-col gap-4">
        <Field label="Proveedor" error={errors.proveedor?.message}>
          <input className="input" placeholder="Ej. Distribuidora Arabian Scents" {...register('proveedor')} />
        </Field>

        <Field label="Perfumes de la compra" error={errors.items?.message}>
          <PerfumePicker
            perfumes={perfumes}
            items={items}
            onChange={(v) => setValue('items', v, { shouldValidate: true })}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Precio total de la compra ($)" error={errors.montoTotal?.message} hint="No hace falta el costo de cada perfume.">
            <input className="input" inputMode="decimal" placeholder="0" {...register('montoTotal')} />
          </Field>
          <Field label="Fecha" error={errors.fecha?.message}><input type="date" className="input" {...register('fecha')} /></Field>
          <Field label="Pagado por"><Seg full value={modo} onChange={setModo} options={opciones} /></Field>
          {modo !== 'otro' && <Field label="Método de pago"><MetodoSeg value={metodo} onChange={setMetodo} /></Field>}
        </div>

        <div className="adm-modal-foot">
          <button type="submit" className="btn btn-primary" disabled={guardando || !items?.length}>
            {guardando ? 'Guardando…' : 'Guardar compra'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        </div>
      </form>
    </ModalShell>
  );
}
