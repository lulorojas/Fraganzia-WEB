import { useState } from 'react';
import { useSocios } from '../../hooks/useSocios';
import { useSocioActual } from '../../hooks/useSocioActual';
import { useGastos, useCrearGasto, useEditarGasto, useAnularGasto } from '../../hooks/useGastos';
import { GastoForm } from '../../components/admin/GastoForm';
import { GastosTable } from '../../components/admin/GastosTable';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { GlassCard } from '../../components/ui/GlassCard';

export default function AdminGastos() {
  const { data: gastos, isLoading } = useGastos();
  const { data: socios } = useSocios();
  const socioActualId = useSocioActual();

  const crear = useCrearGasto();
  const editar = useEditarGasto();
  const anular = useAnularGasto();

  const [modo, setModo] = useState(null);
  const [gastoEditando, setGastoEditando] = useState(null);
  const [error, setError] = useState(null);

  function abrirNuevo() { setGastoEditando(null); setModo('nuevo'); setError(null); }
  function abrirEditar(g) { setGastoEditando(g); setModo('editar'); setError(null); }
  function cerrar() { setModo(null); setGastoEditando(null); setError(null); }

  async function handleSubmit(datos) {
    setError(null);
    try {
      if (modo === 'nuevo') {
        await crear.mutateAsync({ datos, socioId: socioActualId });
      } else {
        await editar.mutateAsync({
          id: gastoEditando.id, datosNuevos: datos, valorAnterior: gastoEditando, socioId: socioActualId,
        });
      }
      cerrar();
    } catch (e) { setError(e.message); }
  }

  async function handleAnular(g) {
    await anular.mutateAsync({ id: g.id, valorAnterior: g, socioId: socioActualId });
  }

  const guardando = crear.isPending || editar.isPending;

  return (
    <div>
      <div className="mb-6 flex justify-end">
        {!modo && <Button onClick={abrirNuevo}>+ Nuevo gasto</Button>}
      </div>
      {modo ? (
        <GlassCard>
          <h2 className="mb-4 font-display text-xl text-text">
            {modo === 'nuevo' ? 'Nuevo gasto' : `Editando: ${gastoEditando?.descripcion}`}
          </h2>
          {error && <p className="mb-3 text-sm text-error">{error}</p>}
          <GastoForm gasto={gastoEditando} onSubmit={handleSubmit} onCancel={cerrar} cargando={guardando} />
        </GlassCard>
      ) : isLoading ? <Spinner /> : (
        <GastosTable gastos={gastos} socios={socios} onEditar={abrirEditar} onAnular={handleAnular} />
      )}
    </div>
  );
}
