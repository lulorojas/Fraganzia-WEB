import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { AdminLayout } from '../components/layout/AdminLayout';
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
const Dashboard = lazy(() => import('../pages/admin/Dashboard'));
const AdminPerfumes = lazy(() => import('../pages/admin/AdminPerfumes'));
const AdminPedidos = lazy(() => import('../pages/admin/AdminPedidos'));
const AdminPromociones = lazy(() => import('../pages/admin/AdminPromociones'));
const AdminConfig = lazy(() => import('../pages/admin/AdminConfig'));
const AdminUsuarios = lazy(() => import('../pages/admin/AdminUsuarios'));
const AdminFinanzasLayout = lazy(() => import('../pages/admin/AdminFinanzasLayout'));
const AdminFinanzasResumen = lazy(() => import('../pages/admin/AdminFinanzasResumen'));
const AdminVentasSocios = lazy(() => import('../pages/admin/AdminVentasSocios'));
const AdminCompras = lazy(() => import('../pages/admin/AdminCompras'));
const AdminVentasDecants = lazy(() => import('../pages/admin/AdminVentasDecants'));
const AdminGastos = lazy(() => import('../pages/admin/AdminGastos'));
const AdminMovimientos = lazy(() => import('../pages/admin/AdminMovimientos'));
const AdminAuditoria = lazy(() => import('../pages/admin/AdminAuditoria'));
const AdminAnalytics = lazy(() => import('../pages/admin/AdminAnalytics'));

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
          <Route path="perfumes" element={<AdminSuspense><AdminPerfumes /></AdminSuspense>} />
          <Route path="pedidos" element={<AdminSuspense><AdminPedidos /></AdminSuspense>} />
          <Route path="promociones" element={<AdminSuspense><AdminPromociones /></AdminSuspense>} />
          <Route path="usuarios" element={<AdminSuspense><AdminUsuarios /></AdminSuspense>} />
          <Route path="config" element={<AdminSuspense><AdminConfig /></AdminSuspense>} />
          <Route path="finanzas" element={<AdminSuspense><AdminFinanzasLayout /></AdminSuspense>}>
            <Route index element={<AdminSuspense><AdminFinanzasResumen /></AdminSuspense>} />
            <Route path="ventas" element={<AdminSuspense><AdminVentasSocios /></AdminSuspense>} />
            <Route path="decants" element={<AdminSuspense><AdminVentasDecants /></AdminSuspense>} />
            <Route path="compras" element={<AdminSuspense><AdminCompras /></AdminSuspense>} />
            <Route path="gastos" element={<AdminSuspense><AdminGastos /></AdminSuspense>} />
            <Route path="movimientos" element={<AdminSuspense><AdminMovimientos /></AdminSuspense>} />
            <Route path="analytics" element={<AdminSuspense><AdminAnalytics /></AdminSuspense>} />
            <Route path="auditoria" element={<AdminSuspense><AdminAuditoria /></AdminSuspense>} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
