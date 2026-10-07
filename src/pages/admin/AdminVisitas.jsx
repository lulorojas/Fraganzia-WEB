import { useMemo } from 'react';
import { useVisitas } from '../../hooks/useVisitas';
import { GlassCard } from '../../components/ui/GlassCard';
import { Spinner } from '../../components/ui/Spinner';

const fecha = (ts) => {
  const d = ts?.toDate ? ts.toDate() : null;
  return d
    ? new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(d)
    : '—';
};

function contar(lista, campo) {
  const m = new Map();
  for (const v of lista) {
    const k = v[campo] ?? '—';
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
}

function Ranking({ titulo, items }) {
  return (
    <GlassCard className="p-4">
      <h3 className="mb-2 font-display text-sm text-text">{titulo}</h3>
      <ul className="space-y-1 text-sm text-text-secondary">
        {items.map(([k, n]) => (
          <li key={k} className="flex justify-between gap-3">
            <span className="truncate">{k}</span>
            <span className="tabular-nums text-text">{n}</span>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}

export default function AdminVisitas() {
  const { data: visitas, isLoading, error } = useVisitas();

  const resumen = useMemo(() => {
    const v = visitas ?? [];
    const ahora = Date.now();
    const desde = (ms) => v.filter((x) => x.createdAt?.toMillis && ahora - x.createdAt.toMillis() < ms).length;
    return {
      hoy: desde(24 * 3600e3),
      semana: desde(7 * 24 * 3600e3),
      fuentes: contar(v, 'fuente'),
      paginas: contar(v, 'ruta'),
      dispositivos: contar(v, 'dispositivo'),
    };
  }, [visitas]);

  if (isLoading) return <Spinner />;
  if (error) return <p className="p-6 text-error">No se pudieron cargar las visitas.</p>;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="font-display text-2xl text-text">Visitas</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Una visita = una sesión de navegador. Es anónima: se sabe desde dónde llegó y con qué dispositivo,
          no quién es. Se muestran las últimas 500 y no se cuentan las del panel admin.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <GlassCard className="p-4">
          <p className="text-xs text-text-secondary">Últimas 24 h</p>
          <p className="font-display text-3xl text-text">{resumen.hoy}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-xs text-text-secondary">Últimos 7 días</p>
          <p className="font-display text-3xl text-text">{resumen.semana}</p>
        </GlassCard>
        <GlassCard className="col-span-2 p-4">
          <p className="text-xs text-text-secondary">Registradas</p>
          <p className="font-display text-3xl text-text">{visitas?.length ?? 0}</p>
        </GlassCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Ranking titulo="De dónde llegan" items={resumen.fuentes} />
        <Ranking titulo="Página de entrada" items={resumen.paginas} />
        <Ranking titulo="Dispositivo" items={resumen.dispositivos} />
      </div>

      <GlassCard className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-text-secondary">
            <tr>
              {['Fecha', 'Entró por', 'Desde', 'Dispositivo', 'Navegador', 'Sistema', 'Idioma'].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="text-text-secondary">
            {(visitas ?? []).map((v) => (
              <tr key={v.id} className="border-t border-border">
                <td className="whitespace-nowrap px-4 py-2 tabular-nums">{fecha(v.createdAt)}</td>
                <td className="px-4 py-2 text-text">{v.ruta}</td>
                <td className="px-4 py-2">{v.fuente}</td>
                <td className="px-4 py-2">{v.dispositivo}</td>
                <td className="px-4 py-2">{v.navegador}</td>
                <td className="px-4 py-2">{v.so}</td>
                <td className="px-4 py-2">{v.idioma}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
