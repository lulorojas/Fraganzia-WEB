import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { perfumeSchema } from '../../schemas/perfumeSchema';
import { GENEROS, FAMILIAS_OLFATIVAS, MARCAS } from '../../constants';
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

// Convierte un array a string para mostrar en el input
function arr(v, sep = ', ') {
  if (!v) return '';
  return Array.isArray(v) ? v.join(sep) : String(v);
}

// Serializa un perfume existente para que los inputs muestren strings
function toFormValues(p) {
  if (!p) return null;
  return {
    ...p,
    notasSalida: arr(p.notasSalida),
    notasCorazon: arr(p.notasCorazon),
    notasFondo: arr(p.notasFondo),
    imagenes: arr(p.imagenes, '\n'),
  };
}

export function PerfumeForm({ perfume, onSubmit, onCancel, cargando }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(perfumeSchema),
    defaultValues: toFormValues(perfume) ?? {
      nombre: '', marca: MARCAS[0], genero: GENEROS[0],
      familiaOlfativa: FAMILIAS_OLFATIVAS[0], descripcion: '',
      notasSalida: '', notasCorazon: '', notasFondo: '',
      precioUSD: '', volumenML: 100, imagenes: '',
      destacado: false, disponible: true, activo: true,
    },
  });

  useEffect(() => { if (perfume) reset(toFormValues(perfume)); }, [perfume, reset]);

  // El schema (preprocess) ya convierte strings → arrays antes de validar
  function procesar(data) { onSubmit(data); }

  return (
    <form onSubmit={handleSubmit(procesar)} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="Nombre" error={errors.nombre?.message}>
          <input className={INPUT} {...register('nombre')} />
        </Campo>
        <Campo label="Marca" error={errors.marca?.message}>
          <select className={SELECT} {...register('marca')}>
            {MARCAS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </Campo>
        <Campo label="Género" error={errors.genero?.message}>
          <select className={SELECT} {...register('genero')}>
            {GENEROS.map((g) => <option key={g}>{g}</option>)}
          </select>
        </Campo>
        <Campo label="Familia olfativa" error={errors.familiaOlfativa?.message}>
          <select className={SELECT} {...register('familiaOlfativa')}>
            {FAMILIAS_OLFATIVAS.map((f) => <option key={f}>{f}</option>)}
          </select>
        </Campo>
        <Campo label="Precio USD" error={errors.precioUSD?.message}>
          <input type="number" step="0.01" className={INPUT} {...register('precioUSD')} />
        </Campo>
        <Campo label="Volumen (ml)" error={errors.volumenML?.message}>
          <input type="number" className={INPUT} {...register('volumenML')} />
        </Campo>
      </div>

      <Campo label="Descripción" error={errors.descripcion?.message}>
        <textarea rows={3} className={INPUT} {...register('descripcion')} />
      </Campo>

      <Campo label="Notas de salida (separadas por coma)" error={errors.notasSalida?.message}>
        <input className={INPUT} {...register('notasSalida')} />
      </Campo>
      <Campo label="Notas de corazón (separadas por coma)" error={errors.notasCorazon?.message}>
        <input className={INPUT} {...register('notasCorazon')} />
      </Campo>
      <Campo label="Notas de fondo (separadas por coma)" error={errors.notasFondo?.message}>
        <input className={INPUT} {...register('notasFondo')} />
      </Campo>

      <Campo label="Imágenes (una URL por línea)" error={errors.imagenes?.message}>
        <textarea rows={2} className={INPUT} {...register('imagenes')} />
      </Campo>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-text-secondary cursor-pointer">
          <input type="checkbox" {...register('destacado')} /> Destacado
        </label>
        <label className="flex items-center gap-2 text-text-secondary cursor-pointer">
          <input type="checkbox" {...register('disponible')} /> Disponible
        </label>
        <label className="flex items-center gap-2 text-text-secondary cursor-pointer">
          <input type="checkbox" {...register('activo')} /> Activo (visible)
        </label>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={cargando}>
          {cargando ? 'Guardando…' : perfume ? 'Guardar cambios' : 'Crear perfume'}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        )}
      </div>
    </form>
  );
}
