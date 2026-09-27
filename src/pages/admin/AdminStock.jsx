import { useMemo, useState } from 'react';
import { Package } from 'lucide-react';
import { useSocioActual } from '../../hooks/useSocioActual';
import { usePerfumesAdmin } from '../../hooks/usePerfumesAdmin';
import { useCompras } from '../../hooks/useCompras';
import { useVentasSocios } from '../../hooks/useVentasSocios';
import {
  useAjustesStock, useCrearAjusteStock, useEditarAjusteStock, useAnularAjusteStock,
} from '../../hooks/useAjustesStock';
import { calcularStockPorProducto } from '../../services/panelFinancieroCalculos';
import { AjusteStockForm } from '../../components/admin/AjusteStockForm';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { GlassCard } from '../../components/ui/GlassCard';

const VACIO = [];

export default function AdminStock() {
  const socioActualId = useSocioActual();
  const { data: perfumes } = usePerfumesAdmin();
  const { data: compras } = useCompras();
  const { data: ventasSocios } = useVentasSocios();
  const { data: ajustes, isLoading } = useAjustesStock();

  const crear = useCrearAjusteStock();
  const editar = useEditarAjusteStock();
  const anular = useAnularAjusteStock();

  const [modo, setModo] = useState(null);
  const [editando, setEditando] = useState(null);
  const [error, setError] = useState(null);

  const stock = useMemo(
    () => calcularStockPorProducto(compras ?? VACIO, ventasSocios ?? VACIO, ajustes ?? VACIO),
    [compras, ventasSocios, ajustes]
  );

  const conStock = Object.entries(stock)
    .filter(([, cant]) => cant > 0)
    .map(([perfumeId, cantidad]) => ({
      perfumeId,
      cantidad,
      nombre: perfumes?.find((p) => p.id === perfumeId)?.nombre ?? perfumeId,
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const totalUnidades = conStock.reduce((acc, p) => acc + p.cantidad, 0);

  function abrirNuevo() { setEditando(null); setModo('nuevo'); setError(null); }
  function abrirEditar(a) { setEditando(a); setModo('editar'); setError(null); }
  function cerrar() { setModo(null); setEditando(null); setError(null); }

  async function handleSubmit(datos) {
    setError(null);
    try {
      if (modo === 'nuevo') {
        await crear.mutateAsync({ datos, socioId: socioActualId });
      } else {
        await editar.mutateAsync({
          id: editando.id, datosNuevos: datos, valorAnterior: editando, socioId: socioActualId,
        });
      }
      cerrar();
    } catch (e) { setError(e.message); }
  }

  async function handleAnular(a) {
    if (window.confirm('¿Anular este ajuste? El stock vuelve a como estaba antes.')) {
      await anular.mutateAsync({ id: a.id, valorAnterior: a, socioId: socioActualId });
    }
  }

  function fechaCorta(f) {
    const d = f?.toDate ? f.toDate() : new Date(f);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-AR');
  }

  const guardando = crear.isPending || editar.isPending;

  return (
    <div className="flex flex-col gap-6">
      {modo ? (
        <GlassCard>
          <h2 className="mb-4 font-display text-xl text-text">
            {modo === 'nuevo' ? 'Ajuste de stock' : `Editando: ${editando?.perfumeNombre}`}
          </h2>
          {error && <p className="mb-3 text-sm text-error">{error}</p>}
          <AjusteStockForm ajuste={editando} onSubmit={handleSubmit} onCancel={cerrar} cargando={guardando} />
        </GlassCard>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-text-secondary">
            {totalUnidades} {totalUnidades === 1 ? 'unidad' : 'unidades'} en stock
          </p>
          <Button onClick={abrirNuevo}>+ Ajustar stock</Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlassCard>
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded-xl bg-lila/10 p-2">
              <Package className="h-5 w-5 text-lila" />
            </div>
            <h3 className="font-display text-lg text-text">Stock actual</h3>
          </div>
          {!conStock.length ? (
            <p className="text-sm text-text-secondary">No hay stock cargado todavía.</p>
          ) : (
            <div className="flex flex-col gap-1 text-sm">
              {conStock.map((p) => (
                <div key={p.perfumeId} className="flex items-center justify-between gap-2 border-b border-border py-1">
                  <span className="min-w-0 truncate text-text-secondary">{p.nombre}</span>
                  <span className="shrink-0 text-text">{p.cantidad}</span>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-text-secondary">
            Sale de las compras cargadas más los ajustes manuales, menos las ventas cobradas.
          </p>
        </GlassCard>

        <GlassCard>
          <h3 className="mb-3 font-display text-lg text-text">Ajustes manuales</h3>
          {isLoading ? <Spinner /> : !ajustes?.length ? (
            <p className="text-sm text-text-secondary">
              Todavía no hay ajustes. Sirven para cargar mercadería vieja sin compra registrada, o
              descontar unidades perdidas.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {ajustes.map((a) => (
                <div key={a.id} className="border-b border-border pb-2 last:border-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate text-sm text-text">{a.perfumeNombre}</span>
                    <span className={`shrink-0 text-sm ${a.cantidad >= 0 ? 'text-success' : 'text-error'}`}>
                      {a.cantidad >= 0 ? '+' : ''}{a.cantidad}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    {fechaCorta(a.fecha)} · {a.motivo}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => abrirEditar(a)}>
                      Editar
                    </Button>
                    <Button variant="ghost" className="px-2 py-1 text-xs text-error" onClick={() => handleAnular(a)}>
                      Anular
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
