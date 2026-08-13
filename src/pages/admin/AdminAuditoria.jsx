import { useState } from 'react';
import { useAuditoria } from '../../hooks/useAuditoria';
import { useSocios } from '../../hooks/useSocios';
import { AuditoriaTable } from '../../components/admin/AuditoriaTable';
import { AuditoriaDiff } from '../../components/admin/AuditoriaDiff';
import { Spinner } from '../../components/ui/Spinner';
import { GlassCard } from '../../components/ui/GlassCard';

const COLECCIONES = [
  'ventasSocios', 'ventasDecants', 'compras', 'gastos', 'movimientosPersonales', 'transferenciasSocios',
];

const SELECT = 'w-full rounded-xl border border-border bg-bg px-3 py-2 text-text';

export default function AdminAuditoria() {
  const { data: socios } = useSocios();
  const [filtros, setFiltros] = useState({ coleccion: '', socioId: '', desde: '', hasta: '' });
  const { data: entradas, isLoading } = useAuditoria(filtros);
  const [seleccionada, setSeleccionada] = useState(null);

  function actualizarFiltro(campo, valor) {
    setFiltros((f) => ({ ...f, [campo]: valor }));
  }

  return (
    <div>
      <p className="mb-4 text-xs text-text-secondary">
        Incluye todos los movimientos compartidos (ventas, decants, compras, gastos y
        transferencias) más tus propios movimientos personales. Los movimientos personales
        del otro socio son privados y no aparecen acá.
      </p>

      <GlassCard className="mb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-sm text-text-secondary">Tipo de movimiento</label>
            <select className={SELECT} value={filtros.coleccion} onChange={(e) => actualizarFiltro('coleccion', e.target.value)}>
              <option value="">Todos</option>
              {COLECCIONES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-text-secondary">Socio</label>
            <select className={SELECT} value={filtros.socioId} onChange={(e) => actualizarFiltro('socioId', e.target.value)}>
              <option value="">Todos</option>
              {socios?.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-text-secondary">Desde</label>
            <input type="date" className={SELECT} value={filtros.desde} onChange={(e) => actualizarFiltro('desde', e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-text-secondary">Hasta</label>
            <input type="date" className={SELECT} value={filtros.hasta} onChange={(e) => actualizarFiltro('hasta', e.target.value)} />
          </div>
        </div>
      </GlassCard>

      {isLoading ? <Spinner /> : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AuditoriaTable entradas={entradas} seleccionada={seleccionada} onSeleccionar={setSeleccionada} />
          <AuditoriaDiff entrada={seleccionada} />
        </div>
      )}
    </div>
  );
}
