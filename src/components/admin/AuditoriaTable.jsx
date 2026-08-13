const ACCIONES = { create: 'Alta', update: 'Edición', void: 'Anulación' };

function fechaDe(e) {
  const d = e.modificadoAt?.toDate ? e.modificadoAt.toDate() : null;
  return d ? d.toLocaleString('es-AR') : '—';
}

export function AuditoriaTable({ entradas, seleccionada, onSeleccionar }) {
  if (!entradas?.length) {
    return <p className="text-text-secondary">No hay entradas de auditoría para este filtro.</p>;
  }

  return (
    <>
      {/* Mobile: tarjetas */}
      <div className="flex flex-col gap-2 md:hidden">
        {entradas.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => onSeleccionar(e)}
            className={`glass p-3 text-left transition-base ${seleccionada?.id === e.id ? 'glow' : ''}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-body text-sm text-text">{e.coleccion}</span>
              <span className="text-xs text-lila">{ACCIONES[e.accion] ?? e.accion}</span>
            </div>
            <p className="mt-1 text-xs text-text-secondary">{fechaDe(e)} · {e.modificadoPor}</p>
          </button>
        ))}
      </div>

      {/* Desktop: tabla */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm text-text">
          <thead>
            <tr className="border-b border-border text-text-secondary">
              <th className="pb-2 pr-4">Fecha</th>
              <th className="pb-2 pr-4">Colección</th>
              <th className="pb-2 pr-4">Acción</th>
              <th className="pb-2 pr-4">Modificado por</th>
            </tr>
          </thead>
          <tbody>
            {entradas.map((e) => (
              <tr
                key={e.id}
                className={`cursor-pointer border-b border-border hover:bg-white/5 ${seleccionada?.id === e.id ? 'bg-white/5' : ''}`}
                onClick={() => onSeleccionar(e)}
              >
                <td className="py-2 pr-4">{fechaDe(e)}</td>
                <td className="py-2 pr-4 font-body">{e.coleccion}</td>
                <td className="py-2 pr-4">{ACCIONES[e.accion] ?? e.accion}</td>
                <td className="py-2 pr-4">{e.modificadoPor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
