import { GENEROS, FAMILIAS_OLFATIVAS, MARCAS } from '../../constants';

export function Filtros({ filtros, onChange }) {
  function actualizar(campo, valor) {
    onChange({ ...filtros, [campo]: valor || undefined });
  }

  return (
    <div className="flex flex-wrap gap-3" role="search">
      <input
        type="search"
        placeholder="Buscar por nombre o marca…"
        aria-label="Buscar perfume por nombre o marca"
        value={filtros.busqueda ?? ''}
        onChange={(e) => actualizar('busqueda', e.target.value)}
        maxLength={80}
        className="min-w-0 flex-1 basis-full rounded-xl border border-border bg-white/[0.03] px-4 py-2.5 text-text placeholder:text-text-secondary focus:border-violet focus:outline-none sm:basis-64"
      />
      <select
        value={filtros.genero ?? ''}
        onChange={(e) => actualizar('genero', e.target.value)}
        aria-label="Filtrar por género"
        className="flex-1 rounded-xl border border-border bg-bg px-3 py-2.5 text-text sm:flex-none"
      >
        <option value="">Género</option>
        {GENEROS.map((g) => (
          <option key={g} value={g}>{g}</option>
        ))}
      </select>
      <select
        value={filtros.marca ?? ''}
        onChange={(e) => actualizar('marca', e.target.value)}
        aria-label="Filtrar por marca"
        className="flex-1 rounded-xl border border-border bg-bg px-3 py-2.5 text-text sm:flex-none"
      >
        <option value="">Marca</option>
        {MARCAS.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      <select
        value={filtros.familiaOlfativa ?? ''}
        onChange={(e) => actualizar('familiaOlfativa', e.target.value)}
        aria-label="Filtrar por familia olfativa"
        className="flex-1 rounded-xl border border-border bg-bg px-3 py-2.5 text-text sm:flex-none"
      >
        <option value="">Familia olfativa</option>
        {FAMILIAS_OLFATIVAS.map((f) => (
          <option key={f} value={f}>{f}</option>
        ))}
      </select>
    </div>
  );
}
