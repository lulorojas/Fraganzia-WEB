import { useState } from 'react';
import { useBotProveedorLog } from '../../hooks/useBotProveedorLog';
import { Spinner } from '../../components/ui/Spinner';
import { GlassCard } from '../../components/ui/GlassCard';
import { formatFechaHora } from '../../utils/format';

function Corrida({ corrida }) {
  const [abierta, setAbierta] = useState(false);
  const total = (corrida.cambios?.length ?? 0) + (corrida.nuevos?.length ?? 0);

  return (
    <GlassCard className="mb-3">
      <button
        type="button"
        onClick={() => setAbierta((v) => !v)}
        className="flex w-full flex-wrap items-center justify-between gap-2 text-left"
      >
        <span className="font-body text-sm text-text">
          {formatFechaHora(corrida.creadoEn)}
        </span>
        <span className="font-body text-xs text-text-secondary">
          {corrida.cambios?.length ?? 0} precios · {corrida.nuevos?.length ?? 0} nuevos
          {corrida.omitidos?.length ? ` · ${corrida.omitidos.length} omitidos` : ''}
          {!total && ' · sin cambios'}
        </span>
      </button>

      {abierta && (
        <div className="mt-4 flex flex-col gap-4 text-sm">
          {Boolean(corrida.nuevos?.length) && (
            <div>
              <h3 className="mb-1 font-body text-xs font-semibold text-text-secondary">
                Nuevos ingresos (ocultos, pedí "cargá los nuevos")
              </h3>
              <ul className="flex flex-col gap-0.5">
                {corrida.nuevos.map((n) => (
                  <li key={n.nombre} className="text-text">
                    {n.nombre} — {n.precioUSD} USD{n.genero ? ` (${n.genero})` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {Boolean(corrida.cambios?.length) && (
            <div>
              <h3 className="mb-1 font-body text-xs font-semibold text-text-secondary">Precios actualizados</h3>
              <ul className="flex flex-col gap-0.5">
                {corrida.cambios.map((c) => (
                  <li key={c.id} className="text-text">
                    {c.nombre}: {c.anterior ?? '-'} → {c.nuevo} USD
                  </li>
                ))}
              </ul>
            </div>
          )}
          {Boolean(corrida.omitidos?.length) && (
            <div>
              <h3 className="mb-1 font-body text-xs font-semibold text-text-secondary">Omitidos</h3>
              <ul className="flex flex-col gap-0.5">
                {corrida.omitidos.map((o, i) => (
                  <li key={i} className="text-text">{o.nombre} ({o.motivo})</li>
                ))}
              </ul>
            </div>
          )}
          {Boolean(corrida.ambiguos?.length) && (
            <p className="text-text-secondary">
              Ambiguos (más de un perfume con ese nombre): {corrida.ambiguos.join(', ')}
            </p>
          )}
        </div>
      )}
    </GlassCard>
  );
}

export default function AdminBotProveedor() {
  const { data: corridas, isLoading } = useBotProveedorLog();

  return (
    <div>
      <p className="mb-4 font-body text-xs text-text-secondary">
        Resumen de cada corrida del bot que lee el catálogo mayorista del proveedor y
        actualiza precios y perfumes nuevos. Corre solo, una vez por día.
      </p>

      {isLoading ? (
        <Spinner />
      ) : !corridas?.length ? (
        <GlassCard className="py-10 text-center">
          <p className="font-body text-text-secondary">Todavía no corrió ninguna vez.</p>
        </GlassCard>
      ) : (
        corridas.map((c) => <Corrida key={c.id} corrida={c} />)
      )}
    </div>
  );
}
