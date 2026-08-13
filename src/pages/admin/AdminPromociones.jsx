import { useState } from 'react';
import {
  useTodasLasPromociones, useCrearPromocion,
  useEditarPromocion, useEliminarPromocion,
} from '../../hooks/usePromociones';
import { PromocionesTable } from '../../components/admin/PromocionesTable';
import { PromocionForm } from '../../components/admin/PromocionForm';
import { Button } from '../../components/ui/Button';
import { GlassCard } from '../../components/ui/GlassCard';
import { Spinner } from '../../components/ui/Spinner';

export default function AdminPromociones() {
  const { data: promociones, isLoading } = useTodasLasPromociones();
  const { mutateAsync: crear, isPending: creando } = useCrearPromocion();
  const { mutateAsync: editar, isPending: editando } = useEditarPromocion();
  const { mutateAsync: eliminar } = useEliminarPromocion();

  const [modo, setModo] = useState(null);
  const [promoEditando, setPromoEditando] = useState(null);

  function abrirNuevo() { setPromoEditando(null); setModo('nuevo'); }
  function abrirEditar(p) { setPromoEditando(p); setModo('editar'); }
  function cerrar() { setModo(null); setPromoEditando(null); }

  async function handleSubmit(datos) {
    if (modo === 'nuevo') await crear(datos);
    else await editar({ id: promoEditando.id, datos });
    cerrar();
  }

  async function handleToggleActiva(p) {
    await editar({ id: p.id, datos: { activa: !p.activa } });
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl text-text sm:text-2xl">Promociones</h1>
        {!modo && <Button onClick={abrirNuevo}>+ Nueva promoción</Button>}
      </div>
      {modo ? (
        <GlassCard>
          <h2 className="mb-4 font-display text-xl text-text">
            {modo === 'nuevo' ? 'Nueva promoción' : `Editando: ${promoEditando?.titulo}`}
          </h2>
          <PromocionForm
            promocion={promoEditando}
            onSubmit={handleSubmit}
            onCancel={cerrar}
            cargando={creando || editando}
          />
        </GlassCard>
      ) : isLoading ? <Spinner /> : (
        <PromocionesTable
          promociones={promociones}
          onEditar={abrirEditar}
          onEliminar={eliminar}
          onToggleActiva={handleToggleActiva}
        />
      )}
    </div>
  );
}
