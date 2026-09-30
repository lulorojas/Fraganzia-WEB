import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { AppRouter } from './router/AppRouter';
import { ShaderBackground } from './components/ui/ShaderBackground';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
// Fondo animado 100% CSS (sin WebGL/canvas): evita bloqueo de main-thread
// continuo que disparaba el Total Blocking Time en Lighthouse.

const queryClient = new QueryClient();

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
