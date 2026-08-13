import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocios } from '../../hooks/useSocios';
import { useCompras, useCrearCompra, useEditarCompra, useAnularCompra } from '../../hooks/useCompras';
import { CompraForm } from '../../components/admin/CompraForm';
import { ComprasTable } from '../../components/admin/ComprasTable';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { GlassCard } from '../../components/ui/GlassCard';

function useSocioActualId() {
  const { user } = useAuth();
  const { data: socios } = useSocios();
  return socios?.find((s) => s.authUid === user?.uid)?.id ?? socios?.[0]?.id ?? 'luciano';
}

export default function AdminCompras() {
  const { data: compras, isLoading } = useCompras();
  const { data: socios } = useSocios();
  const socioActualId = useSocioActualId();

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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-text">Compras</h1>
        {!modo && <Button onClick={abrirNuevo}>+ Nueva compra</Button>}
      </div>
      {modo ? (
        <GlassCard>
          <h2 className="mb-4 font-display text-xl text-text">
            {modo === 'nuevo' ? 'Nueva compra' : `Editando: ${compraEditando?.perfumeNombre}`}
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
