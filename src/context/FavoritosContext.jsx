import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { incrementarFavorito } from '../services/estadisticasService';

const STORAGE_KEY = 'fraganzia_favoritos';

function leer() {
  try {
    const guardado = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(guardado) ? guardado.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

const FavoritosContext = createContext(null);

/**
 * Perfumes guardados por el visitante. Viven en su navegador (localStorage),
 * sin cuenta ni lecturas a Firestore: solo se guardan los ids y los datos
 * salen del catálogo ya cargado.
 */
export function FavoritosProvider({ children }) {
  const [ids, setIds] = useState(leer);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // Sin storage (modo privado): los favoritos duran lo que dura la pestaña.
    }
  }, [ids]);

  // Copia en ref para saber, fuera del setState, si se está agregando o sacando
  // (los efectos como la estadística no van dentro del actualizador de estado).
  const idsRef = useRef(ids);
  idsRef.current = ids;

  const alternar = useCallback((perfumeId) => {
    const yaEsta = idsRef.current.includes(perfumeId);
    setIds((actuales) =>
      actuales.includes(perfumeId) ? actuales.filter((id) => id !== perfumeId) : [perfumeId, ...actuales]
    );
    if (!yaEsta) incrementarFavorito(perfumeId);
  }, []);

  const quitar = useCallback((perfumeIds) => {
    setIds((actuales) => actuales.filter((id) => !perfumeIds.includes(id)));
  }, []);

  const value = useMemo(() => {
    const set = new Set(ids);
    return { ids, esFavorito: (id) => set.has(id), alternar, quitar };
  }, [ids, alternar, quitar]);

  return <FavoritosContext.Provider value={value}>{children}</FavoritosContext.Provider>;
}

export function useFavoritos() {
  const ctx = useContext(FavoritosContext);
  if (!ctx) throw new Error('useFavoritos debe usarse dentro de <FavoritosProvider>');
  return ctx;
}
