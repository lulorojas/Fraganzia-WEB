import { createContext, useContext, useEffect, useReducer } from 'react';
import { leerCarrito, guardarCarrito } from '../utils/cartStorage';

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
              ? { ...item, cantidad: item.cantidad + action.payload.cantidad }
              : item
          ),
        };
      }
      return { ...state, items: [...state.items, action.payload] };
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
            ? { ...item, cantidad: action.payload.cantidad }
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

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
