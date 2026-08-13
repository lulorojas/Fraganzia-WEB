const ACCIONES = { create: 'Alta', update: 'Edición', void: 'Anulación' };

export function AuditoriaTable({ entradas, seleccionada, onSeleccionar }) {
  if (!entradas?.length) {
    return <p className="text-text-secondary">No hay entradas de auditoría para este filtro.</p>;
  }

  function fecha(e) {
    const d = e.modificadoAt?.toDate ? e.modificadoAt.toDate() : null;
    return d ? d.toLocaleString('es-AR') : '—';
  }

  return (
    <div className="overflow-x-auto">
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
              <td className="py-2 pr-4">{fecha(e)}</td>
              <td className="py-2 pr-4 font-body">{e.coleccion}</td>
              <td className="py-2 pr-4">{ACCIONES[e.accion] ?? e.accion}</td>
              <td className="py-2 pr-4">{e.modificadoPor}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
