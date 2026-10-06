import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { usePerfumes } from '../../hooks/usePerfumes';
import { Button } from '../ui/Button';
import { PerfumeSearchSelect } from '../ui/PerfumeSearchSelect';

const INPUT = 'w-full rounded-xl border border-border bg-white/[0.03] px-3 py-2 font-body text-sm text-text placeholder:text-text-secondary/50 focus:border-violet focus:outline-none transition-colors';
const SELECT = 'w-full rounded-xl border border-border bg-bg px-3 py-2 font-body text-sm text-text focus:border-violet focus:outline-none transition-colors';

const TIPOS = [
  { value: 'descuento', label: 'Descuento (%)' },
  { value: '2x1', label: '2×1 — Llevás 2, pagás 1' },
  { value: 'otro', label: 'Otro (solo informativa)' },
];

export function PromocionForm({ promocion, onSubmit, onCancel, cargando }) {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: promocion ?? { titulo: '', descripcion: '', imagen: '', activa: true, orden: 1, tipo: 'descuento', descuentoPorcentaje: 0 },
  });
  const tipoActual = watch('tipo');

  // perfumeIds vacío = la promo vale para todo el catálogo.
  const { data: catalogo } = usePerfumes();
  const [soloElegidos, setSoloElegidos] = useState(Boolean(promocion?.perfumeIds?.length));
  const [perfumeIds, setPerfumeIds] = useState(promocion?.perfumeIds ?? []);
  const [errorPerfumes, setErrorPerfumes] = useState(null);
  const nombrePorId = useMemo(() => new Map((catalogo ?? []).map((p) => [p.id, p.nombre])), [catalogo]);

  useEffect(() => {
    if (!promocion) return;
    reset(promocion);
    setSoloElegidos(Boolean(promocion.perfumeIds?.length));
    setPerfumeIds(promocion.perfumeIds ?? []);
  }, [promocion, reset]);

  function agregarPerfume(id) {
    if (id && !perfumeIds.includes(id)) setPerfumeIds((actuales) => [...actuales, id]);
    setErrorPerfumes(null);
  }

  function guardar(datos) {
    if (soloElegidos && perfumeIds.length === 0) {
      setErrorPerfumes('Elegí al menos un perfume o volvé a "Todos los perfumes".');
      return;
    }
    return onSubmit({ ...datos, perfumeIds: soloElegidos ? perfumeIds : [] });
  }

  return (
    <form onSubmit={handleSubmit(guardar)} className="flex flex-col gap-4">
      <div>
        <label className="font-body text-sm text-text-secondary">Título</label>
        <input className={INPUT} {...register('titulo', { required: 'Requerido' })} />
        {errors.titulo && <p className="text-xs text-error">{errors.titulo.message}</p>}
      </div>
      <div>
        <label className="font-body text-sm text-text-secondary">Tipo de promoción</label>
        <select className={SELECT} {...register('tipo')}>
          {TIPOS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>
      {tipoActual === 'descuento' && (
        <div>
          <label className="font-body text-sm text-text-secondary">Descuento (%)</label>
          <input
            type="number" min="1" max="100" step="1"
            className={INPUT}
            {...register('descuentoPorcentaje', { valueAsNumber: true })}
          />
        </div>
      )}
      {tipoActual !== 'otro' && (
        <fieldset className="flex flex-col gap-2">
          <legend className="font-body text-sm text-text-secondary">Aplica a</legend>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-text">
            <input type="radio" checked={!soloElegidos} onChange={() => setSoloElegidos(false)} />
            Todos los perfumes
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-text">
            <input type="radio" checked={soloElegidos} onChange={() => setSoloElegidos(true)} />
            Solo perfumes específicos
          </label>
          {soloElegidos && (
            <div className="flex flex-col gap-2 pl-6">
              <PerfumeSearchSelect
                perfumes={catalogo}
                value=""
                onChange={agregarPerfume}
                placeholder="Buscar perfume para agregar…"
              />
              {perfumeIds.length > 0 && (
                <ul className="flex flex-wrap gap-2" aria-label="Perfumes de la promoción">
                  {perfumeIds.map((id) => (
                    <li key={id} className="flex items-center gap-1 rounded-full border border-border bg-white/[0.04] py-1 pl-3 pr-1 text-xs text-text">
                      <span className="max-w-[220px] truncate">{nombrePorId.get(id) ?? 'Perfume que ya no está en el catálogo'}</span>
                      <button
                        type="button"
                        onClick={() => setPerfumeIds((actuales) => actuales.filter((x) => x !== id))}
                        aria-label={`Quitar ${nombrePorId.get(id) ?? 'perfume'} de la promoción`}
                        className="flex h-6 w-6 items-center justify-center rounded-full text-text-secondary hover:text-error"
                      >
                        <X size={14} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {errorPerfumes && <p className="text-xs text-error">{errorPerfumes}</p>}
            </div>
          )}
        </fieldset>
      )}
      <div>
        <label className="font-body text-sm text-text-secondary">Descripción</label>
      <textarea rows={2} className={INPUT} {...register('descripcion')} />
      </div>
      <div>
        <label className="font-body text-sm text-text-secondary">URL de imagen</label>
        <input className={INPUT} {...register('imagen')} />
      </div>
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="font-body text-sm text-text-secondary">Orden</label>
          <input type="number" className={INPUT} {...register('orden', { valueAsNumber: true })} />
        </div>
        <label className="flex items-center gap-2 text-text-secondary cursor-pointer pb-2">
          <input type="checkbox" {...register('activa')} /> Activa
        </label>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={cargando}>
          {cargando ? 'Guardando…' : promocion ? 'Guardar cambios' : 'Crear promoción'}
        </Button>
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>}
      </div>
    </form>
  );
}
