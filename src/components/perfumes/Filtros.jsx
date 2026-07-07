import { GENEROS, FAMILIAS_OLFATIVAS, MARCAS } from '../../constants';

export function Filtros({ filtros, onChange }) {
  function actualizar(campo, valor) {
    onChange({ ...filtros, [campo]: valor || undefined });
  }

  return (
    <div className="flex flex-wrap gap-3">
      <input
        type="text"
        placeholder="Buscar..."
        value={filtros.busqueda ?? ''}
        onChange={(e) => actualizar('busqueda', e.target.value)}
        className="rounded-xl border border-border bg-transparent px-3 py-2 text-text"
      />
      <select
        value={filtros.genero ?? ''}
        onChange={(e) => actualizar('genero', e.target.value)}
        className="rounded-xl border border-border bg-bg px-3 py-2 text-text"
      >
        <option value="">Género</option>
        {GENEROS.map((g) => (
          <option key={g} value={g}>{g}</option>
        ))}
      </select>
      <select
        value={filtros.marca ?? ''}
        onChange={(e) => actualizar('marca', e.target.value)}
        className="rounded-xl border border-border bg-bg px-3 py-2 text-text"
      >
        <option value="">Marca</option>
        {MARCAS.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      <select
        value={filtros.familiaOlfativa ?? ''}
        onChange={(e) => actualizar('familiaOlfativa', e.target.value)}
        className="rounded-xl border border-border bg-bg px-3 py-2 text-text"
      >
        <option value="">Familia olfativa</option>
        {FAMILIAS_OLFATIVAS.map((f) => (
          <option key={f} value={f}>{f}</option>
        ))}
      </select>
    </div>
  );
}
