import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocios } from '../../hooks/useSocios';
import { useVentasSocios, useCrearVenta, useEditarVenta, useAnularVenta } from '../../hooks/useVentasSocios';
import { VentaSocioForm } from '../../components/admin/VentaSocioForm';
import { VentasSociosTable } from '../../components/admin/VentasSociosTable';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { GlassCard } from '../../components/ui/GlassCard';

function useSocioActualId() {
  const { user } = useAuth();
  const { data: socios } = useSocios();
  return socios?.find((s) => s.authUid === user?.uid)?.id ?? socios?.[0]?.id ?? 'luciano';
}

export default function AdminVentasSocios() {
  const { data: ventas, isLoading } = useVentasSocios();
  const { data: socios } = useSocios();
  const socioActualId = useSocioActualId();

  const crear = useCrearVenta();
  const editar = useEditarVenta();
  const anular = useAnularVenta();

  const [modo, setModo] = useState(null);
  const [ventaEditando, setVentaEditando] = useState(null);
  const [error, setError] = useState(null);

  function abrirNuevo() { setVentaEditando(null); setModo('nuevo'); setError(null); }
  function abrirEditar(v) { setVentaEditando(v); setModo('editar'); setError(null); }
  function cerrar() { setModo(null); setVentaEditando(null); setError(null); }

  async function handleSubmit(datos) {
    setError(null);
    try {
      if (modo === 'nuevo') {
        await crear.mutateAsync({ datos, socioId: socioActualId });
      } else {
        await editar.mutateAsync({
          id: ventaEditando.id, datosNuevos: datos, valorAnterior: ventaEditando, socioId: socioActualId,
        });
      }
      cerrar();
    } catch (e) { setError(e.message); }
  }

  async function handleMarcarCobrada(v) {
    await editar.mutateAsync({
      id: v.id, datosNuevos: { ...v, estado: 'cobrada' }, valorAnterior: v, socioId: socioActualId,
    });
  }

  async function handleAnular(v) {
    await anular.mutateAsync({ id: v.id, valorAnterior: v, socioId: socioActualId });
  }

  const guardando = crear.isPending || editar.isPending;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-text">Ventas de perfumes</h1>
        {!modo && <Button onClick={abrirNuevo}>+ Nueva venta</Button>}
      </div>
      {modo ? (
        <GlassCard>
          <h2 className="mb-4 font-display text-xl text-text">
            {modo === 'nuevo' ? 'Nueva venta' : `Editando: ${ventaEditando?.perfumeNombre}`}
          </h2>
          {error && <p className="mb-3 text-sm text-error">{error}</p>}
          <VentaSocioForm venta={ventaEditando} onSubmit={handleSubmit} onCancel={cerrar} cargando={guardando} />
        </GlassCard>
      ) : isLoading ? <Spinner /> : (
        <VentasSociosTable
          ventas={ventas}
          socios={socios}
          onEditar={abrirEditar}
          onMarcarCobrada={handleMarcarCobrada}
          onAnular={handleAnular}
        />
      )}
    </div>
  );
}
