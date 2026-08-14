import { useState } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import {
  listarTodosLosPerfumes, crearPerfume, editarPerfume,
  actualizarDisponibilidad, actualizarActivo, eliminarPerfume,
} from '../../services/perfumesService';
import { notificarNuevoPerfume } from '../../services/emailService';
import { PerfumesTable } from '../../components/admin/PerfumesTable';
import { PerfumeForm } from '../../components/admin/PerfumeForm';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { GlassCard } from '../../components/ui/GlassCard';

export default function AdminPerfumes() {
  const qc = useQueryClient();
  const { data: perfumes, isLoading } = useQuery({
    queryKey: ['perfumes', 'admin'],
    queryFn: listarTodosLosPerfumes,
  });

  const [modo, setModo] = useState(null);
  const [perfumeEditando, setPerfumeEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  function abrirNuevo() { setPerfumeEditando(null); setModo('nuevo'); setError(null); }
  function abrirEditar(p) { setPerfumeEditando(p); setModo('editar'); setError(null); }
  function cerrar() { setModo(null); setPerfumeEditando(null); setError(null); }

  async function handleSubmit(datos) {
    setGuardando(true); setError(null);
    try {
      if (modo === 'nuevo') {
        await crearPerfume(datos);
        // Notificar al admin del nuevo perfume (no bloqueante)
        notificarNuevoPerfume(datos).catch(err => {
          console.warn('No se pudo notificar nuevo perfume:', err);
        });
      } else {
        await editarPerfume(perfumeEditando.id, datos);
      }
      qc.invalidateQueries({ queryKey: ['perfumes'] });
      cerrar();
    } catch (e) { setError(e.message); }
    finally { setGuardando(false); }
  }

  async function handleToggleDisponible(p) {
    await actualizarDisponibilidad(p.id, !p.disponible);
    qc.invalidateQueries({ queryKey: ['perfumes'] });
  }

  async function handleToggleActivo(p) {
    await actualizarActivo(p.id, !p.activo);
    qc.invalidateQueries({ queryKey: ['perfumes'] });
  }

  async function handleEliminar(id) {
    await eliminarPerfume(id);
    qc.invalidateQueries({ queryKey: ['perfumes'] });
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl text-text sm:text-2xl">Perfumes</h1>
        {!modo && <Button onClick={abrirNuevo}>+ Nuevo perfume</Button>}
      </div>
      {modo ? (
        <GlassCard>
          <h2 className="mb-4 font-display text-xl text-text">
            {modo === 'nuevo' ? 'Nuevo perfume' : `Editando: ${perfumeEditando?.nombre}`}
          </h2>
          {error && <p className="mb-3 text-sm text-error">{error}</p>}
          <PerfumeForm perfume={perfumeEditando} onSubmit={handleSubmit} onCancel={cerrar} cargando={guardando} />
        </GlassCard>
      ) : isLoading ? <Spinner /> : (
        <PerfumesTable
          perfumes={perfumes}
          onEditar={abrirEditar}
          onToggleDisponible={handleToggleDisponible}
          onToggleActivo={handleToggleActivo}
          onEliminar={handleEliminar}
        />
      )}
    </div>
  );
}
