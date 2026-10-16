import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Spinner } from '../components/ui/Spinner';

import Home from '../pages/Home';
import Catalogo from '../pages/Catalogo';
import PerfumeDetalle from '../pages/PerfumeDetalle';
import Carrito from '../pages/Carrito';
import Login from '../pages/Login';
import SobreNosotros from '../pages/SobreNosotros';
import Contacto from '../pages/Contacto';

// Todo lo de /admin se carga en un chunk aparte: un visitante del catálogo
// nunca debería descargar el código de finanzas/analytics/etc.
const AdminLayout = lazy(() => import('../components/layout/AdminLayout').then((m) => ({ default: m.AdminLayout })));
const Dashboard = lazy(() => import('../pages/admin/Dashboard'));
const AdminPedidos = lazy(() => import('../pages/admin/AdminPedidos'));
const AdminPerfumes = lazy(() => import('../pages/admin/AdminPerfumes'));
const AdminStock = lazy(() => import('../pages/admin/AdminStock'));
const AdminPromociones = lazy(() => import('../pages/admin/AdminPromociones'));
const AdminVentasSocios = lazy(() => import('../pages/admin/AdminVentasSocios'));
const AdminCompras = lazy(() => import('../pages/admin/AdminCompras'));
const AdminMovimientos = lazy(() => import('../pages/admin/AdminMovimientos'));
const AdminAnalytics = lazy(() => import('../pages/admin/AdminAnalytics'));
const AdminAuditoria = lazy(() => import('../pages/admin/AdminAuditoria'));
const AdminConfig = lazy(() => import('../pages/admin/AdminConfig'));

function AdminSuspense({ children }) {
  return (
    <Suspense fallback={<div className="flex justify-center p-12"><Spinner /></div>}>
      {children}
    </Suspense>
  );
}

function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/perfume/:id" element={<PerfumeDetalle />} />
          <Route path="/carrito" element={<Carrito />} />
          <Route path="/sobre-nosotros" element={<SobreNosotros />} />
          <Route path="/contacto" element={<Contacto />} />
        </Route>

        {/* Login solo para admin */}
        <Route path="/login" element={<Login />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminSuspense>
                <AdminLayout />
              </AdminSuspense>
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminSuspense><Dashboard /></AdminSuspense>} />
          <Route path="pedidos" element={<AdminSuspense><AdminPedidos /></AdminSuspense>} />
          <Route path="perfumes" element={<AdminSuspense><AdminPerfumes /></AdminSuspense>} />
          <Route path="stock" element={<AdminSuspense><AdminStock /></AdminSuspense>} />
          <Route path="promociones" element={<AdminSuspense><AdminPromociones /></AdminSuspense>} />
          <Route path="ventas" element={<AdminSuspense><AdminVentasSocios /></AdminSuspense>} />
          <Route path="compras" element={<AdminSuspense><AdminCompras /></AdminSuspense>} />
          <Route path="movimientos" element={<AdminSuspense><AdminMovimientos /></AdminSuspense>} />
          <Route path="analytics" element={<AdminSuspense><AdminAnalytics /></AdminSuspense>} />
          <Route path="auditoria" element={<AdminSuspense><AdminAuditoria /></AdminSuspense>} />
          <Route path="config" element={<AdminSuspense><AdminConfig /></AdminSuspense>} />

          {/* Rutas de la versión anterior del panel */}
          <Route path="usuarios" element={<Navigate to="/admin/analytics" replace />} />
          <Route path="finanzas" element={<Navigate to="/admin/ventas" replace />} />
          <Route path="finanzas/ventas" element={<Navigate to="/admin/ventas" replace />} />
          <Route path="finanzas/decants" element={<Navigate to="/admin/ventas" replace />} />
          <Route path="finanzas/compras" element={<Navigate to="/admin/compras" replace />} />
          <Route path="finanzas/gastos" element={<Navigate to="/admin/compras" replace />} />
          <Route path="finanzas/stock" element={<Navigate to="/admin/stock" replace />} />
          <Route path="finanzas/movimientos" element={<Navigate to="/admin/movimientos" replace />} />
          <Route path="finanzas/analytics" element={<Navigate to="/admin/analytics" replace />} />
          <Route path="finanzas/auditoria" element={<Navigate to="/admin/auditoria" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
