import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';

const INPUT = 'w-full rounded-xl border border-border bg-transparent px-3 py-2 pl-9 text-text';

/**
 * Buscador de perfume: input de texto + lista desplegable filtrada en vivo.
 * No hay librería de combobox en el proyecto — se implementa a mano, sin
 * dependencias nuevas.
 *
 * `stockPorProducto` es opcional: si se pasa, muestra las unidades disponibles
 * al lado de cada nombre (para elegir qué vender).
 */
export function PerfumeSearchSelect({
  perfumes, value, onChange, placeholder = 'Buscar perfume…', stockPorProducto, mensajeVacio = 'Sin resultados.',
}) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const ref = useRef(null);

  const seleccionado = useMemo(() => perfumes?.find((p) => p.id === value) ?? null, [perfumes, value]);

  useEffect(() => {
    if (!abierto) setTexto(seleccionado?.nombre ?? '');
  }, [seleccionado, abierto]);

  useEffect(() => {
    function handleClickAfuera(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setAbierto(false);
        setTexto(seleccionado?.nombre ?? '');
      }
    }
    document.addEventListener('mousedown', handleClickAfuera);
    return () => document.removeEventListener('mousedown', handleClickAfuera);
  }, [seleccionado]);

  const filtrados = useMemo(() => {
    const termino = texto.trim().toLowerCase();
    if (!termino) return perfumes ?? [];
    return (perfumes ?? []).filter((p) => p.nombre?.toLowerCase().includes(termino));
  }, [perfumes, texto]);

  function elegir(p) {
    onChange(p.id, p);
    setTexto(p.nombre);
    setAbierto(false);
  }

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
        <input
          className={INPUT}
          placeholder={placeholder}
          value={texto}
          onFocus={() => setAbierto(true)}
          onChange={(e) => { setTexto(e.target.value); setAbierto(true); }}
        />
      </div>
      {abierto && (
        <div className="glass absolute z-20 mt-1 max-h-56 w-full overflow-y-auto py-1">
          {filtrados.length === 0 ? (
            <p className="px-3 py-2 text-sm text-text-secondary">{mensajeVacio}</p>
          ) : (
            filtrados.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => elegir(p)}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-base hover:bg-white/5 ${
                  p.id === value ? 'text-lila' : 'text-text'
                }`}
              >
                <span className="truncate">{p.nombre}</span>
                {stockPorProducto && (
                  <span className="shrink-0 text-xs text-text-secondary">
                    {stockPorProducto[p.id] ?? 0} en stock
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
