import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const AuthContext = createContext(null);

// Marca de que en este navegador hubo una sesión iniciada. Auth es de lo más
// pesado de Firebase y casi ningún visitante inicia sesión, así que solo se
// descarga si hay marca, o cuando una ruta lo pide (panel admin, login).
const MARCA_SESION = 'fz-sesion';

const hayMarcaDeSesion = () => {
  try {
    return localStorage.getItem(MARCA_SESION) === '1';
  } catch {
    return false;
  }
};

const guardarMarca = (hayUsuario) => {
  try {
    if (hayUsuario) localStorage.setItem(MARCA_SESION, '1');
    else localStorage.removeItem(MARCA_SESION);
  } catch {
    // sin storage: se pierde solo la optimización
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  // `authIniciada`: ya se pidió el SDK de Auth. Sin iniciar, nadie está logueado
  // para la tienda pública, y `loading` es false para no frenar nada.
  const [authIniciada, setAuthIniciada] = useState(false);
  // Con marca de sesión se arranca "cargando": así una visita del propio admin
  // no se cuenta como visita mientras se confirma quién es.
  const [loading, setLoading] = useState(hayMarcaDeSesion);
  const arranque = useRef(null);
  const desuscribir = useRef(null);

  const iniciarAuth = useCallback(() => {
    if (arranque.current) return arranque.current;
    setAuthIniciada(true);
    setLoading(true);
    arranque.current = Promise.all([import('../firebase/auth'), import('../firebase/esAdmin')])
      .then(([{ auth, onAuthStateChanged }, { esAdmin }]) => {
        desuscribir.current = onAuthStateChanged(auth, async (firebaseUser) => {
          setUser(firebaseUser);
          guardarMarca(Boolean(firebaseUser));

          try {
            if (firebaseUser) {
              setIsAdmin(await esAdmin(firebaseUser.uid));
            } else {
              setIsAdmin(false);
            }
          } catch {
            // Sin red o sin permiso: tratarlo como no-admin en vez de dejar la
            // app colgada en "cargando" para siempre.
            setIsAdmin(false);
          } finally {
            setLoading(false);
          }
        });
      })
      .catch(() => setLoading(false));
    return arranque.current;
  }, []);

  // Con una sesión guardada en este navegador, se restaura apenas el navegador
  // quede libre (no compite con el primer pintado).
  useEffect(() => {
    if (!hayMarcaDeSesion()) return undefined;
    const pedir = () => iniciarAuth();
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(pedir, { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(pedir, 500);
    return () => clearTimeout(id);
  }, [iniciarAuth]);

  useEffect(() => () => desuscribir.current?.(), []);

  const value = useMemo(
    () => ({ user, isAdmin, loading, authIniciada, iniciarAuth }),
    [user, isAdmin, loading, authIniciada, iniciarAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
