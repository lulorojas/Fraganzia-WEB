import { useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { GENEROS, FAMILIAS_OLFATIVAS } from '../../constants';
import { usePerfumes } from '../../hooks/usePerfumes';
import { marcasDelCatalogo, sugerencias } from '../../utils/busqueda';
import { ImagenProducto } from './ImagenProducto';

const SELECT =
  'flex-1 rounded-xl border border-border bg-bg px-3 py-2.5 text-text focus:border-violet focus:outline-none sm:flex-none';

/**
 * Buscador con autocompletado (patrón "combobox" accesible): mientras se
 * escribe sugiere marcas y perfumes. Flechas para moverse, Enter para elegir,
 * Escape para cerrar. Elegir un perfume abre su ficha; elegir una marca la
 * aplica como filtro.
 */
function Buscador({ valor, onBuscar, onMarca, catalogo }) {
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const [activa, setActiva] = useState(-1);
  const listaId = useId();
  const contenedorRef = useRef(null);

  const { marcas, perfumes } = useMemo(
    () => (valor.trim().length >= 2 ? sugerencias(catalogo, valor) : { marcas: [], perfumes: [] }),
    [catalogo, valor]
  );
  const opciones = [
    ...marcas.map((m) => ({ tipo: 'marca', id: `m-${m.marca}`, ...m })),
    ...perfumes.map((p) => ({ tipo: 'perfume', id: `p-${p.id}`, perfume: p })),
  ];
  const mostrar = abierto && opciones.length > 0;

  function elegir(opcion) {
    setAbierto(false);
    setActiva(-1);
    if (opcion.tipo === 'marca') onMarca(opcion.marca);
    else navigate(`/perfume/${opcion.perfume.id}`);
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAbierto(true);
      setActiva((i) => Math.min(opciones.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiva((i) => Math.max(-1, i - 1));
    } else if (e.key === 'Enter' && mostrar && activa >= 0) {
      e.preventDefault();
      elegir(opciones[activa]);
    } else if (e.key === 'Escape' && mostrar) {
      // Con sugerencias abiertas, Escape solo las cierra (un input type=search
      // borra el texto con Escape por defecto). Con la lista cerrada, sí borra.
      e.preventDefault();
      setAbierto(false);
      setActiva(-1);
    }
  }

  return (
    <div
      ref={contenedorRef}
      className="relative min-w-0 flex-1 basis-full sm:basis-64"
      onBlur={(e) => {
        if (!contenedorRef.current?.contains(e.relatedTarget)) setAbierto(false);
      }}
    >
      <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
      <input
        type="search"
        role="combobox"
        aria-expanded={mostrar}
        aria-controls={listaId}
        aria-autocomplete="list"
        aria-activedescendant={mostrar && activa >= 0 ? `${listaId}-${activa}` : undefined}
        aria-label="Buscar perfume por nombre o marca"
        placeholder="Buscar por nombre o marca…"
        autoComplete="off"
        value={valor}
        maxLength={80}
        onChange={(e) => {
          onBuscar(e.target.value);
          setAbierto(true);
          setActiva(-1);
        }}
        onFocus={() => setAbierto(true)}
        onKeyDown={onKeyDown}
        className="w-full rounded-xl border border-border bg-white/[0.03] py-2.5 pl-10 pr-10 text-text placeholder:text-text-secondary focus:border-violet focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {valor && (
        <button
          type="button"
          onClick={() => onBuscar('')}
          aria-label="Borrar búsqueda"
          className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-text-secondary hover:text-text"
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}

      {mostrar && (
        <ul
          id={listaId}
          role="listbox"
          aria-label="Sugerencias"
          className="glass-frosted absolute inset-x-0 top-full z-30 mt-2 max-h-[60vh] overflow-y-auto rounded-2xl p-1.5"
        >
          {opciones.map((opcion, i) => (
            <li
              key={opcion.id}
              id={`${listaId}-${i}`}
              role="option"
              aria-selected={i === activa}
              // mousedown en vez de click: se dispara antes del blur del input.
              onMouseDown={(e) => {
                e.preventDefault();
                elegir(opcion);
              }}
              onMouseEnter={() => setActiva(i)}
              className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 ${i === activa ? 'bg-violet/25' : ''}`}
            >
              {opcion.tipo === 'marca' ? (
                <>
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-violet/15 font-display text-sm font-semibold text-lila">
                    {opcion.marca.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1 font-body text-sm text-text">
                    Marca <strong className="font-semibold">{opcion.marca}</strong>
                  </span>
                  <span className="font-body text-xs text-text-secondary">{opcion.cantidad} perfumes</span>
                </>
              ) : (
                <>
                  <span className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-white">
                    <ImagenProducto url={opcion.perfume.imagenes?.[0]} sizes="40px" width="40" height="40" className="h-full w-full object-contain p-0.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-body text-sm text-text">{opcion.perfume.nombre}</span>
                    <span className="block text-xs text-text-secondary">{opcion.perfume.familiaOlfativa}</span>
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Filtros({ filtros, onChange }) {
  const { data: catalogo } = usePerfumes();
  const marcas = useMemo(() => marcasDelCatalogo(catalogo), [catalogo]);

  function actualizar(campo, valor) {
    onChange({ ...filtros, [campo]: valor || undefined });
  }

  return (
    <div className="flex flex-wrap gap-3" role="search">
      <Buscador
        valor={filtros.busqueda ?? ''}
        catalogo={catalogo}
        onBuscar={(v) => actualizar('busqueda', v)}
        onMarca={(marca) => onChange({ ...filtros, marca, busqueda: undefined })}
      />
      <select
        value={filtros.genero ?? ''}
        onChange={(e) => actualizar('genero', e.target.value)}
        aria-label="Filtrar por género"
        className={SELECT}
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
        className={SELECT}
      >
        <option value="">Marca</option>
        {marcas.map(({ marca, cantidad }) => (
          <option key={marca} value={marca}>{marca} ({cantidad})</option>
        ))}
      </select>
      <select
        value={filtros.familiaOlfativa ?? ''}
        onChange={(e) => actualizar('familiaOlfativa', e.target.value)}
        aria-label="Filtrar por familia olfativa"
        className={SELECT}
      >
        <option value="">Familia olfativa</option>
        {FAMILIAS_OLFATIVAS.map((f) => (
          <option key={f} value={f}>{f}</option>
        ))}
      </select>
    </div>
  );
}
