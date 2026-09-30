import { lazy, Suspense, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

// El panel se descarga recién la primera vez que alguien agrega un producto.
const PanelMiniCarrito = lazy(() => import('./PanelMiniCarrito'));

/**
 * Al agregar un producto se abre un panel lateral (hoja inferior en mobile)
 * que confirma qué se agregó y ofrece seguir comprando o ir al carrito.
 */
export function MiniCarrito() {
  const { ultimoAgregado, olvidarUltimoAgregado } = useCart();
  const [cargado, setCargado] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    if (ultimoAgregado) setCargado(true);
  }, [ultimoAgregado]);

  // Al cambiar de página se cierra.
  useEffect(() => {
    olvidarUltimoAgregado();
  }, [pathname, olvidarUltimoAgregado]);

  if (!cargado) return null;

  return (
    <Suspense fallback={null}>
      <PanelMiniCarrito agregado={ultimoAgregado} onCerrar={olvidarUltimoAgregado} />
    </Suspense>
  );
}
