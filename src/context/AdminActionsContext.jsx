import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { VentaModal } from '../components/admin/modals/VentaModal';
import { DecantModal } from '../components/admin/modals/DecantModal';
import { CompraModal } from '../components/admin/modals/CompraModal';
import { GastoModal, AjusteModal, MovimientoModal, TransferenciaModal } from '../components/admin/modals/SimpleModals';
import { PerfumeModal, PromocionModal, PasajeModal } from '../components/admin/modals/CatalogoModals';

const Ctx = createContext(null);

const MODALES = {
  venta: VentaModal,
  decant: DecantModal,
  compra: CompraModal,
  gasto: GastoModal,
  ajuste: AjusteModal,
  perfume: PerfumeModal,
  promocion: PromocionModal,
  movimiento: MovimientoModal,
  transferencia: TransferenciaModal,
  pasaje: PasajeModal,
};

/**
 * Los formularios del panel viven acá, en un solo lugar, para poder abrirlos
 * desde cualquier pantalla (botón "Nueva", atajos, ⌘K) y desde las tablas para
 * editar. `abrir('venta', { editando })`.
 */
export function AdminActionsProvider({ children }) {
  const [modal, setModal] = useState(null);
  const [aviso, setAviso] = useState(null);

  const abrir = useCallback((tipo, props = {}) => setModal({ tipo, props }), []);
  const cerrar = useCallback(() => setModal(null), []);
  const avisar = useCallback((mensaje, tono = 'ok') => {
    setAviso({ mensaje, tono, id: Date.now() });
    setTimeout(() => setAviso((a) => (a && Date.now() - a.id >= 2500 ? null : a)), 2600);
  }, []);

  const valor = useMemo(
    () => ({ abrir, cerrar, avisar, modal, aviso, hayModal: Boolean(modal) }),
    [abrir, cerrar, avisar, modal, aviso]
  );

  return (
    <Ctx.Provider value={valor}>
      {children}
    </Ctx.Provider>
  );
}

export function useAdminActions() {
  return useContext(Ctx);
}

/** Se monta dentro del contenedor .adm, así los formularios heredan sus estilos. */
export function AdminModalHost() {
  const { modal, aviso, cerrar, avisar } = useContext(Ctx);
  const Modal = modal ? MODALES[modal.tipo] : null;
  return (
    <>
      {Modal && (
        <Modal
          key={modal.tipo + (modal.props.editando?.id ?? '')}
          {...modal.props}
          onClose={cerrar}
          onGuardado={(mensaje) => { cerrar(); avisar(mensaje); }}
        />
      )}
      {aviso && (
        <div className={`adm-toast ${aviso.tono === 'bad' ? 'bad' : ''}`} role="status">
          {aviso.tono === 'bad' ? <AlertCircle size={16} color="#FCA5A5" /> : <Check size={16} color="#10B981" />}
          {aviso.mensaje}
        </div>
      )}
    </>
  );
}
