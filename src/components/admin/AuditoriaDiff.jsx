import { GlassCard } from '../ui/GlassCard';

function serializar(v) {
  if (v == null) return '—';
  if (typeof v === 'object') {
    if (v.toDate) return v.toDate().toLocaleString('es-AR');
    return JSON.stringify(v);
  }
  return String(v);
}

export function AuditoriaDiff({ entrada }) {
  if (!entrada) {
    return <p className="text-text-secondary">Elegí una entrada del historial para ver el detalle.</p>;
  }

  const campos = Array.from(
    new Set([
      ...Object.keys(entrada.valorAnterior ?? {}),
      ...Object.keys(entrada.valorNuevo ?? {}),
    ])
  );

  return (
    <GlassCard>
      <h3 className="mb-3 break-all font-display text-lg text-text">
        {entrada.coleccion} · {entrada.documentoId}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-text">
          <thead>
            <tr className="border-b border-border text-text-secondary">
              <th className="pb-2 pr-4">Campo</th>
              <th className="pb-2 pr-4">Valor anterior</th>
              <th className="pb-2 pr-4">Valor nuevo</th>
            </tr>
          </thead>
          <tbody>
            {campos.map((campo) => (
              <tr key={campo} className="border-b border-border">
                <td className="py-1 pr-4 text-text-secondary">{campo}</td>
                <td className="py-1 pr-4">{serializar(entrada.valorAnterior?.[campo])}</td>
                <td className="py-1 pr-4">{serializar(entrada.valorNuevo?.[campo])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
