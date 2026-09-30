import { useId, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

/**
 * Diálogo accesible: role="dialog", cierra con Escape o click afuera, mantiene
 * el foco adentro y lo devuelve al cerrarse (ver useFocusTrap).
 * `title` es opcional; si se pasa, se muestra y nombra al diálogo.
 */
export function Modal({ isOpen, onClose, title, children }) {
  const panelRef = useRef(null);
  const titleId = useId();
  useFocusTrap(panelRef, isOpen, onClose);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            tabIndex={-1}
            className="glass-frosted relative max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 focus:outline-none"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-white/5 hover:text-text"
            >
              <X size={18} aria-hidden="true" />
            </button>
            {title && (
              <h2 id={titleId} className="mb-4 pr-10 font-display text-xl text-text">
                {title}
              </h2>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
