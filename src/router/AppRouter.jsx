import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Spinner } from '../components/ui/Spinner';
import { BotonAsistente } from '../components/asistente/BotonAsistente';
import { MiniCarrito } from '../components/cart/MiniCarrito';

// Las páginas públicas pre-renderizadas van en el bundle principal (son chicas). Así, al arrancar, React renderiza la página de una, igual al HTML
// pre-renderizado (tools/prerender.mjs), sin pasar por un spinner de carga.
import Home from '../pages/Home';
import Catalogo from '../pages/Catalogo';
import PerfumeDetalle from '../pages/PerfumeDetalle';
import SobreNosotros from '../pages/SobreNosotros';
import Contacto from '../pages/Contacto';
import NotFound from '../pages/NotFound';

// El carrito no se pre-renderiza (depende de lo que cada visitante guardó) y
// arrastra la validación del pedido (zod) y EmailJS: va en su propio chunk.
const Carrito = lazy(() => import('../pages/Carrito'));
const Login = lazy(() => import('../pages/Login'));

// Todo lo de /admin se carga en un chunk aparte: un visitante del catálogo
// nunca debería descargar el código de finanzas/analytics/etc.
const AdminLayout = lazy(() =>
  import('../components/layout/AdminLayout').then((m) => ({ default: m.AdminLayout }))
);
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
const AdminStock = lazy(() => import('../pages/admin/AdminStock'));
const AdminMovimientos = lazy(() => import('../pages/admin/AdminMovimientos'));
const AdminAuditoria = lazy(() => import('../pages/admin/AdminAuditoria'));
const AdminAnalytics = lazy(() => import('../pages/admin/AdminAnalytics'));

function PageSuspense({ children }) {
  return (
    <Suspense fallback={<div className="flex min-h-[50vh] justify-center p-12"><Spinner /></div>}>
      {children}
    </Suspense>
  );
}

// Envuelve cada ruta en su propio Suspense para que, al cargar una sección,
// el layout que la contiene (sidebar, pestañas de finanzas) siga visible.
const s = (el) => <PageSuspense>{el}</PageSuspense>;

function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      {/* Alto mínimo = pantalla completa: mientras carga una página el footer
          queda fuera de vista, y no "salta" cuando llega el contenido (CLS). */}
      <main id="main" className="min-h-screen flex-1">
        <Outlet />
      </main>
      <Footer />
      <BotonAsistente />
      <MiniCarrito />
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
          <Route path="/carrito" element={s(<Carrito />)} />
          <Route path="/sobre-nosotros" element={<SobreNosotros />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Login solo para admin */}
        <Route path="/login" element={s(<Login />)} />

        <Route path="/admin" element={<ProtectedRoute>{s(<AdminLayout />)}</ProtectedRoute>}>
          <Route index element={s(<Dashboard />)} />
          <Route path="perfumes" element={s(<AdminPerfumes />)} />
          <Route path="pedidos" element={s(<AdminPedidos />)} />
          <Route path="promociones" element={s(<AdminPromociones />)} />
          <Route path="usuarios" element={s(<AdminUsuarios />)} />
          <Route path="config" element={s(<AdminConfig />)} />
          <Route path="finanzas" element={s(<AdminFinanzasLayout />)}>
            <Route index element={s(<AdminFinanzasResumen />)} />
            <Route path="ventas" element={s(<AdminVentasSocios />)} />
            <Route path="decants" element={s(<AdminVentasDecants />)} />
            <Route path="compras" element={s(<AdminCompras />)} />
            <Route path="gastos" element={s(<AdminGastos />)} />
            <Route path="stock" element={s(<AdminStock />)} />
            <Route path="movimientos" element={s(<AdminMovimientos />)} />
            <Route path="analytics" element={s(<AdminAnalytics />)} />
            <Route path="auditoria" element={s(<AdminAuditoria />)} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
