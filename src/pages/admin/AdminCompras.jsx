import { useState } from 'react';
import { useSocios } from '../../hooks/useSocios';
import { useSocioActual } from '../../hooks/useSocioActual';
import { useCompras, useCrearCompra, useEditarCompra, useAnularCompra } from '../../hooks/useCompras';
import { CompraForm } from '../../components/admin/CompraForm';
import { ComprasTable } from '../../components/admin/ComprasTable';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { GlassCard } from '../../components/ui/GlassCard';

export default function AdminCompras() {
  const { data: compras, isLoading } = useCompras();
  const { data: socios } = useSocios();
  const socioActualId = useSocioActual();

  const crear = useCrearCompra();
  const editar = useEditarCompra();
  const anular = useAnularCompra();

  const [modo, setModo] = useState(null);
  const [compraEditando, setCompraEditando] = useState(null);
  const [error, setError] = useState(null);

  function abrirNuevo() { setCompraEditando(null); setModo('nuevo'); setError(null); }
  function abrirEditar(c) { setCompraEditando(c); setModo('editar'); setError(null); }
  function cerrar() { setModo(null); setCompraEditando(null); setError(null); }

  async function handleSubmit(datos) {
    setError(null);
    try {
      if (modo === 'nuevo') {
        await crear.mutateAsync({ datos, socioId: socioActualId });
      } else {
        await editar.mutateAsync({
          id: compraEditando.id, datosNuevos: datos, valorAnterior: compraEditando, socioId: socioActualId,
        });
      }
      cerrar();
    } catch (e) { setError(e.message); }
  }

  async function handleAnular(c) {
    await anular.mutateAsync({ id: c.id, valorAnterior: c, socioId: socioActualId });
  }

  const guardando = crear.isPending || editar.isPending;

  return (
    <div>
      <div className="mb-6 flex justify-end">
        {!modo && <Button onClick={abrirNuevo}>+ Nueva compra</Button>}
      </div>
      {modo ? (
        <GlassCard>
          <h2 className="mb-4 font-display text-xl text-text">
            {modo === 'nuevo' ? 'Nueva compra' : `Editando: ${compraEditando?.proveedor}`}
          </h2>
          {error && <p className="mb-3 text-sm text-error">{error}</p>}
          <CompraForm compra={compraEditando} onSubmit={handleSubmit} onCancel={cerrar} cargando={guardando} />
        </GlassCard>
      ) : isLoading ? <Spinner /> : (
        <ComprasTable compras={compras} socios={socios} onEditar={abrirEditar} onAnular={handleAnular} />
      )}
    </div>
  );
}
