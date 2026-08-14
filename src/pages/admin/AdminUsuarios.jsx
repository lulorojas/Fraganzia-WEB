import { User, ShoppingBag, DollarSign, Calendar } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Spinner } from '../../components/ui/Spinner';
import { useUsuarios } from '../../hooks/useUsuarios';
import { formatARS } from '../../utils/format';

function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function UsuarioCard({ usuario }) {
  const esNuevo = usuario.totalPedidos === 1;
  
  return (
    <GlassCard className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="rounded-full bg-violet/10 p-2.5 flex-shrink-0">
            <User size={20} className="text-violet" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-body text-sm text-text font-medium truncate">
                {usuario.nombre}
              </p>
              {esNuevo && (
                <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-semibold uppercase">
                  Nuevo
                </span>
              )}
            </div>
            <p className="text-xs text-text-secondary truncate mb-2">{usuario.email}</p>
            
            <div className="flex flex-wrap gap-3 text-[11px] text-text-secondary">
              <div className="flex items-center gap-1">
                <Calendar size={12} />
                <span>Registro: {formatDate(usuario.primerPedido)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-2 text-right flex-shrink-0">
          <div className="flex items-center gap-1.5 justify-end">
            <ShoppingBag size={14} className="text-lila" />
            <span className="text-sm font-medium text-text">{usuario.totalPedidos}</span>
          </div>
          <div className="flex items-center gap-1.5 justify-end">
            <DollarSign size={14} className="text-green-400" />
            <span className="text-xs font-medium text-text">{formatARS(usuario.totalGastado)}</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

export default function AdminUsuarios() {
  const { usuarios, isLoading, error } = useUsuarios();

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-12">
        <p className="text-error">Error al cargar usuarios: {error}</p>
      </div>
    );
  }

  const usuariosNuevos = usuarios.filter(u => u.totalPedidos === 1);
  const usuariosRecurrentes = usuarios.filter(u => u.totalPedidos > 1);
  const totalRecaudado = usuarios.reduce((sum, u) => sum + u.totalGastado, 0);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-text">Usuarios registrados</h1>

      {/* Estadísticas */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-violet/10 p-2">
              <User className="h-5 w-5 text-violet" />
            </div>
            <div>
              <p className="text-xs text-text-secondary uppercase tracking-wide">Total usuarios</p>
              <p className="font-display text-xl text-text">{usuarios.length}</p>
            </div>
          </div>
        </GlassCard>
        
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2">
              <User className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-text-secondary uppercase tracking-wide">Nuevos (1 pedido)</p>
              <p className="font-display text-xl text-text">{usuariosNuevos.length}</p>
            </div>
          </div>
        </GlassCard>
        
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-lila/10 p-2">
              <DollarSign className="h-5 w-5 text-lila" />
            </div>
            <div>
              <p className="text-xs text-text-secondary uppercase tracking-wide">Facturación total</p>
              <p className="font-display text-xl text-text">{formatARS(totalRecaudado)}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {usuarios.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-text-secondary">No hay usuarios registrados aún</p>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {/* Usuarios nuevos */}
          {usuariosNuevos.length > 0 && (
            <div>
              <h2 className="mb-3 font-body text-sm uppercase tracking-wide text-green-400">
                Nuevos usuarios ({usuariosNuevos.length})
              </h2>
              <div className="space-y-3">
                {usuariosNuevos.map((usuario) => (
                  <UsuarioCard key={usuario.email} usuario={usuario} />
                ))}
              </div>
            </div>
          )}

          {/* Usuarios recurrentes */}
          {usuariosRecurrentes.length > 0 && (
            <div>
              <h2 className="mb-3 font-body text-sm uppercase tracking-wide text-lila">
                Clientes recurrentes ({usuariosRecurrentes.length})
              </h2>
              <div className="space-y-3">
                {usuariosRecurrentes.map((usuario) => (
                  <UsuarioCard key={usuario.email} usuario={usuario} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
