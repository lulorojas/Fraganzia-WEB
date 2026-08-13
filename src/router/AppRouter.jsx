import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

import Home from '../pages/Home';
import Catalogo from '../pages/Catalogo';
import PerfumeDetalle from '../pages/PerfumeDetalle';
import Carrito from '../pages/Carrito';
import Login from '../pages/Login';
import SobreNosotros from '../pages/SobreNosotros';
import Contacto from '../pages/Contacto';
import Dashboard from '../pages/admin/Dashboard';
import AdminPerfumes from '../pages/admin/AdminPerfumes';
import AdminPedidos from '../pages/admin/AdminPedidos';
import AdminPromociones from '../pages/admin/AdminPromociones';
import AdminConfig from '../pages/admin/AdminConfig';
import AdminVentasSocios from '../pages/admin/AdminVentasSocios';
import AdminCompras from '../pages/admin/AdminCompras';
import AdminVentasDecants from '../pages/admin/AdminVentasDecants';
import AdminGastos from '../pages/admin/AdminGastos';
import AdminMovimientos from '../pages/admin/AdminMovimientos';
import AdminAuditoria from '../pages/admin/AdminAuditoria';
import AdminAnalytics from '../pages/admin/AdminAnalytics';

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

        <Route path="/login" element={<Login />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="perfumes" element={<AdminPerfumes />} />
          <Route path="pedidos" element={<AdminPedidos />} />
          <Route path="promociones" element={<AdminPromociones />} />
          <Route path="config" element={<AdminConfig />} />
          <Route path="ventas" element={<AdminVentasSocios />} />
          <Route path="compras" element={<AdminCompras />} />
          <Route path="decants" element={<AdminVentasDecants />} />
          <Route path="gastos" element={<AdminGastos />} />
          <Route path="movimientos" element={<AdminMovimientos />} />
          <Route path="auditoria" element={<AdminAuditoria />} />
          <Route path="analytics" element={<AdminAnalytics />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
