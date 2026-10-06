import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { incrementarFavorito } from '../services/estadisticasService';

const STORAGE_KEY = 'fraganzia_favoritos';

// Sin storage (modo privado): los favoritos duran lo que dura la pestaña.
let enMemoria = [];

function leer() {
  try {
    const guardado = JSON.parse(localStorage.getItem(STORAGE_KEY));
    enMemoria = Array.isArray(guardado) ? guardado.filter((id) => typeof id === 'string') : [];
  } catch {
    // Se usa la copia en memoria.
  }
  return enMemoria;
}

function guardar(ids) {
  enMemoria = ids;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Ya quedó en memoria.
  }
}

const FavoritosContext = createContext(null);

/**
 * Perfumes guardados por el visitante. Viven en su navegador (localStorage),
 * sin cuenta ni lecturas a Firestore: solo se guardan los ids y los datos
 * salen del catálogo ya cargado.
 *
 * El storage es la fuente de verdad: cada cambio parte de lo guardado y se
 * escribe en el momento, así otra pestaña abierta no pisa la lista con una
 * copia vieja.
 */
export function FavoritosProvider({ children }) {
  const [ids, setIds] = useState(leer);

  // Cambios hechos desde otra pestaña.
  useEffect(() => {
    const alCambiar = (e) => {
      if (e.key === null || e.key === STORAGE_KEY) setIds(leer());
    };
    window.addEventListener('storage', alCambiar);
    return () => window.removeEventListener('storage', alCambiar);
  }, []);

  const alternar = useCallback((perfumeId) => {
    const actuales = leer();
    const yaEsta = actuales.includes(perfumeId);
    const nuevos = yaEsta ? actuales.filter((id) => id !== perfumeId) : [perfumeId, ...actuales];
    guardar(nuevos);
    setIds(nuevos);
    if (!yaEsta) incrementarFavorito(perfumeId);
  }, []);

  const quitar = useCallback((perfumeIds) => {
    const nuevos = leer().filter((id) => !perfumeIds.includes(id));
    guardar(nuevos);
    setIds(nuevos);
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
