import { createContext, useContext, useEffect, useReducer } from 'react';
import { leerCarrito, guardarCarrito } from '../utils/cartStorage';
import { obtenerPerfumePorId } from '../services/perfumesService';

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
    case 'MIGRATE_ITEMS':
      return { ...state, items: action.payload };
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

  // Migración: actualizar items sin imagenes desde Firestore
  useEffect(() => {
    async function migrateItems() {
      const itemsSinImagenes = state.items.filter(item => !item.imagenes || item.imagenes.length === 0);
      
      if (itemsSinImagenes.length > 0) {
        const itemsActualizados = await Promise.all(
          state.items.map(async (item) => {
            if (!item.imagenes || item.imagenes.length === 0) {
              try {
                const perfume = await obtenerPerfumePorId(item.perfumeId);
                if (perfume?.imagenes) {
                  return { ...item, imagenes: perfume.imagenes };
                }
              } catch (err) {
                console.warn('No se pudo cargar imagen para', item.perfumeId);
              }
            }
            return item;
          })
        );
        
        dispatch({ type: 'MIGRATE_ITEMS', payload: itemsActualizados });
      }
    }
    
    migrateItems();
  }, []); // Solo ejecutar una vez al montar

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
