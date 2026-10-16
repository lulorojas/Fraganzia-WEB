import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Sparkles, Tag as TagIcon, ArrowLeftRight, Search, X } from 'lucide-react';
import { perfumeSchema } from '../../../schemas/perfumeSchema';
import { crearPerfume, editarPerfume } from '../../../services/perfumesService';
import { notificarNuevoPerfume, notificarNuevaPromocion } from '../../../services/emailService';
import { useCrearPromocion, useEditarPromocion } from '../../../hooks/usePromociones';
import { usePerfumesAdmin } from '../../../hooks/usePerfumesAdmin';
import { normalizarTexto } from '../../../utils/texto';
import { GENEROS, FAMILIAS_OLFATIVAS, MARCAS } from '../../../constants';
import { Field, Seg, Thumb } from '../ui/kit';
import { ModalShell } from './shared';
import { PasajeForm } from '../PasajeForm';

// En la base hay marcas cargadas en mayúsculas ("LATTAFA") por importaciones viejas: se llevan
// a la forma de la lista para que el <select> las muestre y no se cambien en silencio al guardar.
const marcaDeLista = (marca) => MARCAS.find((m) => normalizarTexto(m) === normalizarTexto(marca)) ?? marca;

const arr = (v, sep = ', ') => (!v ? '' : Array.isArray(v) ? v.join(sep) : String(v));

export function PerfumeModal({ editando, onClose, onGuardado }) {
  const qc = useQueryClient();
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(perfumeSchema),
    defaultValues: editando
      ? {
        ...editando,
        marca: marcaDeLista(editando.marca),
        notasSalida: arr(editando.notasSalida), notasCorazon: arr(editando.notasCorazon),
        notasFondo: arr(editando.notasFondo), imagenes: arr(editando.imagenes, '\n'),
      }
      : {
        nombre: '', marca: MARCAS[0], genero: GENEROS[0], familiaOlfativa: FAMILIAS_OLFATIVAS[0], descripcion: '',
        notasSalida: '', notasCorazon: '', notasFondo: '', precioUSD: '', volumenML: 100, imagenes: '',
        destacado: false, decant: false, disponible: true, activo: true,
      },
  });

  async function guardar(datos) {
    setGuardando(true);
    setError(null);
    try {
      if (editando) {
        // La disponibilidad ya no se maneja desde el panel: se respeta lo que tenía.
        const { disponible, ...resto } = datos; // eslint-disable-line no-unused-vars
        await editarPerfume(editando.id, resto);
      } else {
        await crearPerfume(datos);
        notificarNuevoPerfume(datos).catch((err) => console.warn('No se pudo notificar nuevo perfume:', err));
      }
      qc.invalidateQueries({ queryKey: ['perfumes'] });
      onGuardado(editando ? 'Perfume actualizado' : 'Perfume creado');
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ModalShell Icon={Sparkles} title={editando ? `Editar ${editando.nombre}` : 'Nuevo perfume'} sub="Se publica en el catálogo con el precio en USD." onClose={onClose}>
      <form onSubmit={handleSubmit(guardar)} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nombre" error={errors.nombre?.message}><input className="input" placeholder="Ej. Khamrah Qahwa" {...register('nombre')} /></Field>
          <Field label="Marca" error={errors.marca?.message}>
            <select className="select" {...register('marca')}>
              {editando?.marca && !MARCAS.includes(marcaDeLista(editando.marca)) && <option>{editando.marca}</option>}
              {MARCAS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Género" error={errors.genero?.message}>
            <select className="select" {...register('genero')}>{GENEROS.map((g) => <option key={g}>{g}</option>)}</select>
          </Field>
          <Field label="Familia olfativa" error={errors.familiaOlfativa?.message}>
            <select className="select" {...register('familiaOlfativa')}>{FAMILIAS_OLFATIVAS.map((f) => <option key={f}>{f}</option>)}</select>
          </Field>
          <Field label="Precio USD" error={errors.precioUSD?.message}><input className="input" inputMode="decimal" {...register('precioUSD')} /></Field>
          <Field label="Volumen (ml)" error={errors.volumenML?.message}><input className="input" inputMode="numeric" {...register('volumenML')} /></Field>
        </div>
        <Field label="Descripción" error={errors.descripcion?.message}><textarea rows={3} className="input" {...register('descripcion')} /></Field>
        <Field label="Notas de salida (separadas por coma)" error={errors.notasSalida?.message}><input className="input" {...register('notasSalida')} /></Field>
        <Field label="Notas de corazón (separadas por coma)" error={errors.notasCorazon?.message}><input className="input" {...register('notasCorazon')} /></Field>
        <Field label="Notas de fondo (separadas por coma)" error={errors.notasFondo?.message}><input className="input" {...register('notasFondo')} /></Field>
        <Field label="Imágenes (una URL por línea)" error={errors.imagenes?.message}><textarea rows={2} className="input" {...register('imagenes')} /></Field>
        <div className="flex gap-6">
          <label className="flex cursor-pointer items-center gap-2 dim"><input type="checkbox" {...register('destacado')} /> Destacado</label>
          <label className="flex cursor-pointer items-center gap-2 dim"><input type="checkbox" {...register('decant')} /> En catálogo de decants</label>
          <label className="flex cursor-pointer items-center gap-2 dim"><input type="checkbox" {...register('activo')} /> Publicado</label>
        </div>
        {error && <div className="notice bad">{error}</div>}
        <div className="adm-modal-foot">
          <button type="submit" className="btn btn-primary" disabled={guardando}>{guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear perfume'}</button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        </div>
      </form>
    </ModalShell>
  );
}

const TIPOS = [
  { value: 'descuento', label: 'Descuento (%)' },
  { value: '2x1', label: '2×1 — Llevás 2, pagás 1' },
  { value: 'otro', label: 'Otro (solo informativa)' },
];

export function PromocionModal({ editando, onClose, onGuardado }) {
  const crear = useCrearPromocion();
  const editar = useEditarPromocion();
  const { data: catalogo } = usePerfumesAdmin();
  // perfumeIds vacío = la promoción vale para todo el catálogo.
  const [soloElegidos, setSoloElegidos] = useState(Boolean(editando?.perfumeIds?.length));
  const [perfumeIds, setPerfumeIds] = useState(editando?.perfumeIds ?? []);
  const [busqueda, setBusqueda] = useState('');
  const [errorPerfumes, setErrorPerfumes] = useState(null);
  const porId = new Map((catalogo ?? []).map((x) => [x.id, x]));
  const sugeridos = busqueda.trim()
    ? (catalogo ?? []).filter((x) => !perfumeIds.includes(x.id) && x.nombre?.toLowerCase().includes(busqueda.trim().toLowerCase())).slice(0, 8)
    : [];
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: editando ?? { titulo: '', descripcion: '', imagen: '', activa: true, orden: 1, tipo: 'descuento', descuentoPorcentaje: 0 },
  });

  async function guardar(base) {
    if (soloElegidos && perfumeIds.length === 0) {
      setErrorPerfumes('Elegí al menos un perfume o volvé a "Todos los perfumes".');
      return;
    }
    const datos = { ...base, perfumeIds: soloElegidos && base.tipo !== 'otro' ? perfumeIds : [] };
    if (editando) {
      await editar.mutateAsync({ id: editando.id, datos });
    } else {
      await crear.mutateAsync(datos);
      notificarNuevaPromocion(datos).catch((err) => console.warn('No se pudo notificar nueva promoción:', err));
    }
    onGuardado(editando ? 'Promoción actualizada' : 'Promoción creada');
  }

  return (
    <ModalShell Icon={TagIcon} title={editando ? 'Editar promoción' : 'Nueva promoción'} sub="Aparece en el sitio mientras esté activa." onClose={onClose}>
      <form onSubmit={handleSubmit(guardar)} className="flex flex-col gap-4">
        <Field label="Título" error={errors.titulo?.message}><input className="input" {...register('titulo', { required: 'Requerido' })} /></Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Tipo de promoción">
            <select className="select" {...register('tipo')}>{TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
          </Field>
          {watch('tipo') === 'descuento' && (
            <Field label="Descuento (%)"><input type="number" min="1" max="100" className="input" {...register('descuentoPorcentaje', { valueAsNumber: true })} /></Field>
          )}
          <Field label="Orden"><input type="number" className="input" {...register('orden', { valueAsNumber: true })} /></Field>
        </div>
        {watch('tipo') !== 'otro' && (
          <Field label="Aplica a" error={errorPerfumes}>
            <Seg full value={soloElegidos ? 'algunos' : 'todos'} onChange={(v) => { setSoloElegidos(v === 'algunos'); setErrorPerfumes(null); }}
              options={[{ value: 'todos', label: 'Todos los perfumes' }, { value: 'algunos', label: 'Solo algunos' }]} />
            {soloElegidos && (
              <div className="flex flex-col gap-2" style={{ marginTop: 6 }}>
                <div className="input-wrap"><Search /><input className="input" placeholder="Buscar perfume para agregar…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></div>
                {sugeridos.length > 0 && (
                  <div className="pick-results">
                    {sugeridos.map((x) => (
                      <button key={x.id} type="button" className="pick-opt" onClick={() => { setPerfumeIds((a) => [...a, x.id]); setBusqueda(''); setErrorPerfumes(null); }}>
                        <Thumb perfume={x} size={30} /><span className="ell" style={{ flex: 1 }}>{x.nombre} <span className="card-note">· {x.marca}</span></span>
                      </button>
                    ))}
                  </div>
                )}
                {perfumeIds.length > 0 && (
                  <ul className="flex flex-wrap gap-2" style={{ margin: 0, padding: 0, listStyle: 'none' }} aria-label="Perfumes de la promoción">
                    {perfumeIds.map((id) => (
                      <li key={id} className="chip on" style={{ paddingRight: 4 }}>
                        <span className="ell" style={{ maxWidth: 220 }}>{porId.get(id)?.nombre ?? 'Perfume que ya no está en el catálogo'}</span>
                        <button type="button" className="btn btn-ghost btn-icon" style={{ width: 22, minHeight: 22, height: 22 }} aria-label="Quitar perfume" onClick={() => setPerfumeIds((a) => a.filter((x) => x !== id))}><X size={13} /></button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </Field>
        )}
        <Field label="Descripción"><textarea rows={2} className="input" {...register('descripcion')} /></Field>
        <Field label="URL de imagen"><input className="input" {...register('imagen')} /></Field>
        <label className="flex cursor-pointer items-center gap-2 dim"><input type="checkbox" {...register('activa')} /> Activa</label>
        <div className="adm-modal-foot">
          <button type="submit" className="btn btn-primary" disabled={crear.isPending || editar.isPending}>
            {crear.isPending || editar.isPending ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear promoción'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        </div>
      </form>
    </ModalShell>
  );
}

export function PasajeModal({ onClose, onGuardado }) {
  return (
    <ModalShell Icon={ArrowLeftRight} title="Pasaje de dinero" sub="Privado: pasar plata tuya entre efectivo y Mercado Pago." onClose={onClose}>
      <PasajeForm onGuardado={onGuardado} />
    </ModalShell>
  );
}
