import { Trophy, Tags, PackageSearch, CalendarRange } from 'lucide-react';
import { GlassCard } from '../../ui/GlassCard';
import { formatARS } from '../../../utils/format';

function Titulo({ Icon, children, sub }) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2">
        <div className="rounded-xl bg-lila/10 p-2">
          <Icon className="h-5 w-5 text-lila" />
        </div>
        <h3 className="font-display text-lg text-text">{children}</h3>
      </div>
      {sub && <p className="mt-1 text-xs text-text-secondary">{sub}</p>}
    </div>
  );
}

function Vacio({ children }) {
  return <p className="text-sm text-text-secondary">{children}</p>;
}

export function PerfumesMasPedidos({ perfumes }) {
  return (
    <GlassCard>
      <Titulo Icon={Trophy} sub="Lo que más piden los clientes por la web">
        Perfumes más pedidos
      </Titulo>
      {!perfumes?.length ? (
        <Vacio>Todavía no hay pedidos cargados.</Vacio>
      ) : (
        <ol className="flex flex-col gap-2 text-sm">
          {perfumes.map((p, i) => (
            <li key={p.perfumeId ?? p.nombre} className="flex items-center justify-between gap-3 border-b border-border py-1">
              <span className="min-w-0 truncate text-text">
                <span className="text-text-secondary">{i + 1}.</span> {p.nombre}
              </span>
              <span className="shrink-0 text-right">
                <span className="text-text">{p.unidades} u.</span>
                <span className="ml-2 text-xs text-text-secondary">{formatARS(p.ingreso)}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </GlassCard>
  );
}

export function MarcasMasPedidas({ marcas }) {
  const max = Math.max(1, ...(marcas ?? []).map((m) => m.unidades));
  return (
    <GlassCard>
      <Titulo Icon={Tags} sub="Con qué marca conviene profundizar el catálogo">
        Marcas más pedidas
      </Titulo>
      {!marcas?.length ? (
        <Vacio>Todavía no hay pedidos cargados.</Vacio>
      ) : (
        <div className="flex flex-col gap-2">
          {marcas.map((m) => (
            <div key={m.marca} className="flex items-center gap-3 text-sm">
              <span className="w-28 shrink-0 truncate text-text-secondary">{m.marca}</span>
              <div className="h-2 flex-1 rounded-full bg-white/5">
                <div className="h-2 rounded-full gradient-violet" style={{ width: `${(m.unidades / max) * 100}%` }} />
              </div>
              <span className="w-12 shrink-0 text-right text-text">{m.unidades}</span>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

export function OportunidadesReposicion({ perfumes }) {
  return (
    <GlassCard>
      <Titulo Icon={PackageSearch} sub="Los pidieron pero no tenés stock cargado: son ventas que se pierden">
        Reponer con prioridad
      </Titulo>
      {!perfumes?.length ? (
        <Vacio>Sin faltantes: todo lo que se pidió tiene stock, o todavía no hay datos.</Vacio>
      ) : (
        <ul className="flex flex-col gap-2 text-sm">
          {perfumes.map((p) => (
            <li key={p.perfumeId} className="flex items-center justify-between gap-3 border-b border-border py-1">
              <span className="min-w-0 truncate text-text">{p.nombre}</span>
              <span className="shrink-0 text-xs text-error">{p.unidades} pedidas · sin stock</span>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}

export function EvolucionPedidos({ evolucion }) {
  const max = Math.max(1, ...(evolucion ?? []).map((m) => m.ingreso));
  return (
    <GlassCard>
      <Titulo Icon={CalendarRange} sub="Facturación de pedidos web por mes">
        Evolución de pedidos
      </Titulo>
      {!evolucion?.length ? (
        <Vacio>Todavía no hay pedidos cargados.</Vacio>
      ) : (
        <div className="flex flex-col gap-2">
          {evolucion.map((m) => (
            <div key={m.mes} className="flex items-center gap-3 text-sm">
              <span className="w-16 shrink-0 text-text-secondary">{m.mes}</span>
              <div className="h-2 flex-1 rounded-full bg-white/5">
                <div className="h-2 rounded-full gradient-violet" style={{ width: `${(m.ingreso / max) * 100}%` }} />
              </div>
              <span className="w-24 shrink-0 text-right text-xs text-text">{formatARS(m.ingreso)}</span>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
