import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { AppRouter } from './router/AppRouter';
import { ShaderBackground } from './components/ui/ShaderBackground';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { sembrarDatosIniciales } from './utils/datosIniciales';

// Defaults pensados para un catálogo que cambia poco: no volver a leer de
// Firestore cada vez que el usuario vuelve a la pestaña, y mantener en memoria
// lo ya cargado mientras navega. Cada hook puede pisar estos valores.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

sembrarDatosIniciales(queryClient);

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <ShaderBackground opacity={0.5} />
              <div className="relative z-10">
                <AppRouter />
              </div>
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
