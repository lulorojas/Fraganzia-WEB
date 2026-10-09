import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { leerCarrito, guardarCarrito } from '../utils/cartStorage';
import { incrementarAgregadoCarrito } from '../services/estadisticasService';
import { estaHidratando } from '../utils/hidratacion';

// Tope por producto: coincide con el schema del pedido y evita pedidos
// absurdos por un click de más.
export const CANTIDAD_MAX = 10;
const acotar = (n) => Math.min(CANTIDAD_MAX, Math.max(1, Math.floor(Number(n) || 1)));

const initialState = {
  items: [],
  metodoPago: 'Transferencia',
};

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find((item) => item.perfumeId === action.payload.perfumeId);
      if (existing) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.perfumeId === action.payload.perfumeId
              ? { ...item, cantidad: acotar(item.cantidad + action.payload.cantidad) }
              : item
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, cantidad: acotar(action.payload.cantidad) }],
      };
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((item) => item.perfumeId !== action.payload.perfumeId),
      };
    case 'UPDATE_CANTIDAD':
      return {
        ...state,
        items: state.items.map((item) =>
          item.perfumeId === action.payload.perfumeId
            ? { ...item, cantidad: acotar(action.payload.cantidad) }
            : item
        ),
      };
    case 'SET_METODO_PAGO':
      return { ...state, metodoPago: action.payload };
    case 'CLEAR_CART':
      return initialState;
    case 'HYDRATE':
      return action.payload;
    default:
      return state;
  }
}

const CartContext = createContext(null);

export function CartProvider({ children }) {
  // Al hidratar el HTML pre-generado se arranca con el carrito vacío (igual que
  // el servidor) y recién al montar se carga el guardado; si no, React descarta
  // el HTML y tira errores de hidratación a quien ya tiene productos.
  const [hidratando] = useState(estaHidratando);
  const [state, dispatch] = useReducer(cartReducer, initialState, (init) => {
    if (hidratando) return init;
    const guardado = leerCarrito();
    return guardado ?? init;
  });
  // El primer guardado (mismo commit que la carga) se saltea: sería el carrito vacío.
  const saltarPrimerGuardado = useRef(hidratando);

  useEffect(() => {
    if (!hidratando) return;
    const guardado = leerCarrito();
    if (guardado) dispatch({ type: 'HYDRATE', payload: guardado });
  }, [hidratando]);

  // Último producto agregado: lo usa el mini-carrito para abrirse. No va al
  // estado persistido (no tiene sentido reabrirlo al recargar la página).
  const [ultimoAgregado, setUltimoAgregado] = useState(null);

  useEffect(() => {
    if (saltarPrimerGuardado.current) {
      saltarPrimerGuardado.current = false;
      return;
    }
    guardarCarrito(state);
  }, [state]);

  /**
   * Agrega un perfume (objeto del catálogo) y registra la estadística.
   * Para decants, `perfume.id` ya viene como id compuesto (ver Decants.jsx)
   * para que 5ml y 10ml del mismo perfume sean líneas separadas del carrito;
   * `perfumeIdBase` es el id real en Firestore, para la estadística y para
   * revalidar disponibilidad en el checkout (Carrito.jsx).
   */
  const agregar = useCallback((perfume, cantidad = 1) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        perfumeId: perfume.id,
        nombre: perfume.nombre,
        marca: perfume.marca,
        precioUSD: perfume.precioUSD,
        imagenes: perfume.imagenes,
        esDecant: perfume.esDecant ?? false,
        ml: perfume.ml ?? null,
        perfumeIdBase: perfume.perfumeIdBase ?? perfume.id,
        cantidad,
      },
    });
    incrementarAgregadoCarrito(perfume.perfumeIdBase ?? perfume.id);
    setUltimoAgregado({ perfumeId: perfume.id, cantidad, momento: Date.now() });
  }, []);

  const olvidarUltimoAgregado = useCallback(() => setUltimoAgregado(null), []);

  const value = useMemo(
    () => ({ state, dispatch, agregar, ultimoAgregado, olvidarUltimoAgregado }),
    [state, agregar, ultimoAgregado, olvidarUltimoAgregado]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}
