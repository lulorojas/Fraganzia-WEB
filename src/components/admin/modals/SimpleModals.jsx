import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Receipt, Package, Lock, ArrowLeftRight } from 'lucide-react';
import { gastoSchema } from '../../../schemas/gastoSchema';
import { ajusteStockSchema } from '../../../schemas/ajusteStockSchema';
import { movimientoPersonalSchema } from '../../../schemas/movimientoPersonalSchema';
import { transferenciaSchema } from '../../../schemas/transferenciaSchema';
import { usePerfumesAdmin } from '../../../hooks/usePerfumesAdmin';
import { useSocioActual } from '../../../hooks/useSocioActual';
import { usePanelFinanciero } from '../../../hooks/usePanelFinanciero';
import { useCrearGasto, useEditarGasto } from '../../../hooks/useGastos';
import { useCrearAjusteStock, useEditarAjusteStock } from '../../../hooks/useAjustesStock';
import { useCrearMovimientoPersonal } from '../../../hooks/useMovimientosPersonales';
import { useCrearTransferencia } from '../../../hooks/useTransferenciasSocios';
import { GASTO_CATEGORIAS, SOCIOS } from '../../../constants';
import { fechaInput, formatARS } from '../../../utils/format';
import { Field, Seg } from '../ui/kit';
import { ModalShell, PerfumePicker, SocioSeg, MetodoSeg, Stepper } from './shared';

function Pie({ guardando, deshabilitado, ok, onClose }) {
  return (
    <div className="adm-modal-foot">
      <button type="submit" className="btn btn-primary" disabled={guardando || deshabilitado}>
        {guardando ? 'Guardando…' : ok}
      </button>
      <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
    </div>
  );
}

export function GastoModal({ editando, onClose, onGuardado }) {
  const socioActualId = useSocioActual();
  const crear = useCrearGasto();
  const editar = useEditarGasto();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(gastoSchema),
    defaultValues: editando
      ? { ...editando, fecha: fechaInput(editando.fecha) }
      : { categoria: GASTO_CATEGORIAS[0], descripcion: '', monto: '', pagadoPor: socioActualId, metodoPago: 'efectivo', fecha: fechaInput() },
  });

  async function guardar(datos) {
    if (editando) {
      await editar.mutateAsync({ id: editando.id, datosNuevos: datos, valorAnterior: editando, socioId: socioActualId });
    } else {
      await crear.mutateAsync({ datos, socioId: socioActualId });
    }
    onGuardado(editando ? 'Gasto actualizado' : 'Gasto guardado');
  }

  return (
    <ModalShell Icon={Receipt} title={editando ? 'Editar gasto' : 'Nuevo gasto'} sub="Lo que sale de la caja y no es mercadería." onClose={onClose}>
      <form onSubmit={handleSubmit(guardar)} className="flex flex-col gap-4">
        <Field label="Categoría" error={errors.categoria?.message}>
          <Seg value={watch('categoria')} onChange={(v) => setValue('categoria', v)} options={GASTO_CATEGORIAS.map((c) => ({ value: c, label: c }))} />
        </Field>
        <Field label="Descripción" error={errors.descripcion?.message}>
          <input className="input" placeholder="Ej. Andreani · 6 envíos" {...register('descripcion')} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Monto ($)" error={errors.monto?.message}><input className="input" inputMode="decimal" placeholder="0" {...register('monto')} /></Field>
          <Field label="Fecha" error={errors.fecha?.message}><input type="date" className="input" {...register('fecha')} /></Field>
          <Field label="Pagado por"><SocioSeg value={watch('pagadoPor')} onChange={(v) => setValue('pagadoPor', v)} /></Field>
          <Field label="Método"><MetodoSeg value={watch('metodoPago')} onChange={(v) => setValue('metodoPago', v)} /></Field>
        </div>
        <Pie guardando={crear.isPending || editar.isPending} ok="Guardar gasto" onClose={onClose} />
      </form>
    </ModalShell>
  );
}

export function AjusteModal({ editando, onClose, onGuardado }) {
  const { data: perfumes } = usePerfumesAdmin();
  const socioActualId = useSocioActual();
  const crear = useCrearAjusteStock();
  const editar = useEditarAjusteStock();
  const [modo, setModo] = useState((editando?.cantidad ?? 1) < 0 ? 'restar' : 'sumar');

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(ajusteStockSchema),
    defaultValues: editando
      ? { ...editando, cantidad: Math.abs(editando.cantidad ?? 1), fecha: fechaInput(editando.fecha) }
      : { perfumeId: '', perfumeNombre: '', cantidad: 1, motivo: '', fecha: fechaInput() },
  });

  const perfumeId = watch('perfumeId');
  const cantidad = Number(watch('cantidad')) || 1;

  async function guardar(datos) {
    // El signo lo pone el selector: en pantalla la cantidad siempre es positiva.
    const final = { ...datos, cantidad: Math.abs(datos.cantidad) * (modo === 'restar' ? -1 : 1) };
    if (editando) {
      await editar.mutateAsync({ id: editando.id, datosNuevos: final, valorAnterior: editando, socioId: socioActualId });
    } else {
      await crear.mutateAsync({ datos: final, socioId: socioActualId });
    }
    onGuardado('Ajuste guardado');
  }

  return (
    <ModalShell Icon={Package} title={editando ? 'Editar ajuste' : 'Ajuste de stock'} sub="Mercadería sin compra, unidades perdidas o testers." onClose={onClose}>
      <form onSubmit={handleSubmit(guardar)} className="flex flex-col gap-4">
        <Seg full value={modo} onChange={setModo} options={[{ value: 'sumar', label: 'Sumar stock' }, { value: 'restar', label: 'Descontar stock' }]} />
        <Field label="Perfume" error={errors.perfumeId?.message}>
          <PerfumePicker
            perfumes={perfumes}
            multi={false}
            items={perfumeId ? [{ perfumeId, perfumeNombre: watch('perfumeNombre'), cantidad: 1 }] : []}
            onChange={(v) => {
              setValue('perfumeId', v[0]?.perfumeId ?? '', { shouldValidate: true });
              setValue('perfumeNombre', v[0]?.perfumeNombre ?? '');
            }}
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Cantidad"><div><Stepper value={cantidad} onChange={(n) => setValue('cantidad', n)} /></div></Field>
          <Field label="Fecha" error={errors.fecha?.message}><input type="date" className="input" {...register('fecha')} /></Field>
        </div>
        <Field label="Motivo" error={errors.motivo?.message}>
          <input className="input" placeholder={modo === 'sumar' ? 'Ej. Mercadería vieja sin compra registrada' : 'Ej. Frasco roto en envío'} {...register('motivo')} />
        </Field>
        <div className="notice info">
          {modo === 'sumar'
            ? 'Este stock entra sin costo conocido: cuando se venda, esa venta queda fuera del margen y se informa aparte.'
            : 'Descuenta unidades sin registrar una venta. No genera ingreso ni afecta el saldo entre socios.'}
        </div>
        <Pie guardando={crear.isPending || editar.isPending} deshabilitado={!perfumeId} ok="Guardar ajuste" onClose={onClose} />
      </form>
    </ModalShell>
  );
}

export function MovimientoModal({ onClose, onGuardado }) {
  const socioActualId = useSocioActual();
  const crear = useCrearMovimientoPersonal();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(movimientoPersonalSchema),
    defaultValues: { socioId: socioActualId, tipo: 'retiro', monto: '', metodo: 'efectivo', fecha: fechaInput() },
  });

  async function guardar(datos) {
    await crear.mutateAsync({ datos: { ...datos, socioId: socioActualId }, socioId: socioActualId });
    onGuardado('Movimiento guardado');
  }

  return (
    <ModalShell Icon={Lock} title="Retiro o aporte" sub="Movimiento personal: solo lo ves vos." onClose={onClose}>
      <form onSubmit={handleSubmit(guardar)} className="flex flex-col gap-4">
        <Field label="Tipo">
          <Seg full value={watch('tipo')} onChange={(v) => setValue('tipo', v)} options={[{ value: 'retiro', label: 'Retiro' }, { value: 'aporte', label: 'Aporte' }]} />
        </Field>
        <Field label="Método"><MetodoSeg value={watch('metodo')} onChange={(v) => setValue('metodo', v)} /></Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Monto ($)" error={errors.monto?.message}><input className="input" inputMode="decimal" placeholder="0" {...register('monto')} /></Field>
          <Field label="Fecha" error={errors.fecha?.message}><input type="date" className="input" {...register('fecha')} /></Field>
        </div>
        <Pie guardando={crear.isPending} ok="Guardar" onClose={onClose} />
      </form>
    </ModalShell>
  );
}

export function TransferenciaModal({ onClose, onGuardado }) {
  const socioActualId = useSocioActual();
  const { data: panel } = usePanelFinanciero();
  const crear = useCrearTransferencia();
  const saldo = panel?.saldoNeto ?? 0;
  // Por defecto salda la deuda actual: quien debe le transfiere a quien tiene a favor.
  const [dir, setDir] = useState(saldo < 0 ? 'luciano>benja' : 'benja>luciano');
  const [de, a] = dir.split('>');

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(transferenciaSchema),
    defaultValues: { de, a, monto: Math.abs(saldo) > 0 ? Math.round(Math.abs(saldo)) : '', metodo: 'efectivo', fecha: fechaInput() },
  });

  const nombre = (id) => SOCIOS.find((s) => s.id === id)?.nombre ?? id;

  async function guardar(datos) {
    await crear.mutateAsync({ datos: { ...datos, de, a }, socioId: socioActualId });
    onGuardado('Transferencia registrada');
  }

  return (
    <ModalShell Icon={ArrowLeftRight} title="Transferencia entre socios" sub="Para saldar el saldo entre socios. Deja constancia de un pago ya hecho." onClose={onClose}>
      <form onSubmit={handleSubmit(guardar)} className="flex flex-col gap-4">
        <Field label="Dirección">
          <Seg full value={dir} onChange={(v) => { setDir(v); const [d, h] = v.split('>'); setValue('de', d); setValue('a', h); }}
            options={[{ value: 'benja>luciano', label: 'Benja → Luciano' }, { value: 'luciano>benja', label: 'Luciano → Benja' }]} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Monto ($)" error={errors.monto?.message}><input className="input" inputMode="decimal" {...register('monto')} /></Field>
          <Field label="Fecha" error={errors.fecha?.message}><input type="date" className="input" {...register('fecha')} /></Field>
        </div>
        <Field label="Método"><MetodoSeg value={watch('metodo')} onChange={(v) => setValue('metodo', v)} /></Field>
        {Math.abs(saldo) > 0.5 && (
          <div className="notice info">
            Hoy {nombre(saldo > 0 ? 'benja' : 'luciano')} le debe {formatARS(Math.abs(saldo))} a {nombre(saldo > 0 ? 'luciano' : 'benja')}.
          </div>
        )}
        <Pie guardando={crear.isPending} ok="Registrar" onClose={onClose} />
      </form>
    </ModalShell>
  );
}
