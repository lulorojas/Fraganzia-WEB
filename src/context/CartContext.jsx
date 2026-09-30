import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { leerCarrito, guardarCarrito } from '../utils/cartStorage';

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
    default:
      return state;
  }
}

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState, (init) => {
    const guardado = leerCarrito();
    return guardado ?? init;
  });

  useEffect(() => {
    guardarCarrito(state);
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}
