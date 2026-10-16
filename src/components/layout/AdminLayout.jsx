import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import {
  Home, ShoppingBag, Sparkles, Package, Tag, TrendingUp, ShoppingCart, ArrowLeftRight, BarChart3,
  History, Settings, Search, Plus, LogOut, Droplet, Receipt, MoreHorizontal, Wallet, Lock, X,
} from 'lucide-react';
import { auth } from '../../firebase/config';
import { usePedidosList } from '../../hooks/usePedidos';
import { useDolarBlue } from '../../hooks/useDolarBlue';
import { useSocioActual } from '../../hooks/useSocioActual';
import { AdminActionsProvider, AdminModalHost, useAdminActions } from '../../context/AdminActionsContext';
import '../../styles/admin.css';

const GRUPOS = [
  { items: [{ to: '/admin', end: true, label: 'Inicio', Icon: Home }] },
  { label: 'Operación', items: [{ to: '/admin/pedidos', label: 'Pedidos', Icon: ShoppingBag, badge: true }] },
  {
    label: 'Catálogo',
    items: [
      { to: '/admin/perfumes', label: 'Perfumes', Icon: Sparkles },
      { to: '/admin/stock', label: 'Stock', Icon: Package },
      { to: '/admin/promociones', label: 'Promociones', Icon: Tag },
    ],
  },
  {
    label: 'Finanzas',
    items: [
      { to: '/admin/ventas', label: 'Ventas', Icon: TrendingUp },
      { to: '/admin/compras', label: 'Compras y gastos', Icon: ShoppingCart },
      { to: '/admin/movimientos', label: 'Movimientos', Icon: ArrowLeftRight },
    ],
  },
  { label: 'Análisis', items: [{ to: '/admin/analytics', label: 'Analytics', Icon: BarChart3 }] },
  {
    label: 'Sistema',
    items: [
      { to: '/admin/auditoria', label: 'Auditoría', Icon: History },
      { to: '/admin/config', label: 'Configuración', Icon: Settings },
    ],
  },
];

const PANTALLAS = GRUPOS.flatMap((g) => g.items);

const META = {
  '/admin': { crumb: 'Resumen', title: 'Inicio', sub: 'Tu plata, la de los dos y lo que hay para hacer hoy.' },
  '/admin/pedidos': { crumb: 'Operación', title: 'Pedidos', sub: 'Lo que piden los clientes desde la tienda.' },
  '/admin/perfumes': { crumb: 'Catálogo', title: 'Perfumes', sub: 'Lo que se publica en la tienda.' },
  '/admin/stock': { crumb: 'Catálogo', title: 'Stock', sub: 'Lo que tenemos para vender hoy.' },
  '/admin/promociones': { crumb: 'Catálogo', title: 'Promociones', sub: 'Ofertas que se muestran en el sitio.' },
  '/admin/ventas': { crumb: 'Finanzas', title: 'Ventas', sub: 'Perfumes y decants vendidos por los dos.' },
  '/admin/compras': { crumb: 'Finanzas', title: 'Compras y gastos', sub: 'Lo que entra de mercadería y lo que sale de la caja.' },
  '/admin/movimientos': { crumb: 'Finanzas', title: 'Movimientos', sub: 'Tus retiros, los pagos entre socios y el pasaje de dinero.' },
  '/admin/analytics': { crumb: 'Análisis', title: 'Analytics', sub: 'Cuánto ganamos, qué se vende y quién compra.' },
  '/admin/auditoria': { crumb: 'Sistema', title: 'Auditoría', sub: 'Quién cargó, editó o anuló cada movimiento.' },
  '/admin/config': { crumb: 'Sistema', title: 'Configuración', sub: 'Dólar y número de WhatsApp.' },
};

const ACCIONES = [
  { tipo: 'venta', label: 'Venta', desc: 'Uno o más perfumes en stock', Icon: TrendingUp, tecla: 'V' },
  { tipo: 'decant', label: 'Decant', desc: 'Fraccionado 2 · 5 · 10 ml', Icon: Droplet, tecla: 'D' },
  { tipo: 'compra', label: 'Compra', desc: 'Varios perfumes, un precio total', Icon: ShoppingCart, tecla: 'C' },
  { tipo: 'gasto', label: 'Gasto', desc: 'Envíos, insumos, marketing…', Icon: Receipt, tecla: 'G' },
  { tipo: 'ajuste', label: 'Ajuste de stock', desc: 'Sumar o descontar unidades', Icon: Package, tecla: 'S' },
  { tipo: 'pasaje', label: 'Pasaje de dinero', desc: 'Efectivo ⇄ Mercado Pago, privado', Icon: ArrowLeftRight, tecla: 'M' },
  { tipo: 'perfume', label: 'Perfume', desc: 'Nuevo producto en el catálogo', Icon: Sparkles, tecla: 'P' },
];

const OTRAS_ACCIONES = [
  { tipo: 'movimiento', label: 'Retiro o aporte', Icon: Lock },
  { tipo: 'transferencia', label: 'Transferencia entre socios', Icon: Wallet },
  { tipo: 'promocion', label: 'Promoción', Icon: Tag },
];

function enCampoDeTexto(e) {
  const tag = e.target?.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable;
}

function Shell() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { abrir, hayModal } = useAdminActions();
  const [rapido, setRapido] = useState(false);
  const [paleta, setPaleta] = useState(false);
  const [mas, setMas] = useState(false);
  const rapidoRef = useRef(null);

  const { data: pedidos } = usePedidosList();
  const { dolarMedio } = useDolarBlue();
  const socioActualId = useSocioActual();
  const enProceso = (pedidos ?? []).filter((p) => p.estado === 'en_proceso').length;

  const meta = META[pathname.replace(/\/$/, '')] ?? META['/admin'];
  const nombreSocio = socioActualId === 'benja' ? 'Benja' : 'Luciano';

  // Cierra los menús al cambiar de pantalla.
  useEffect(() => { setRapido(false); setPaleta(false); setMas(false); }, [pathname]);

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaleta((v) => !v);
        setRapido(false);
        return;
      }
      if (e.key === 'Escape') { setRapido(false); setPaleta(false); setMas(false); return; }
      if (enCampoDeTexto(e) || e.metaKey || e.ctrlKey || e.altKey || hayModal || paleta) return;
      const k = e.key.toUpperCase();
      if (k === 'N') { setRapido((v) => !v); return; }
      if (rapido) {
        const hit = ACCIONES.find((a) => a.tecla === k);
        if (hit) { setRapido(false); abrir(hit.tipo); }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rapido, paleta, hayModal, abrir]);

  // Spotlight: el brillo de cada tarjeta sigue al mouse.
  const ultima = useRef(null);
  function onMove(e) {
    const c = e.target.closest?.('.card, .hero-in');
    if (ultima.current && ultima.current !== c) ultima.current.style.setProperty('--o', '0');
    if (c) {
      const b = c.getBoundingClientRect();
      c.style.setProperty('--mx', `${e.clientX - b.left}px`);
      c.style.setProperty('--my', `${e.clientY - b.top}px`);
      c.style.setProperty('--o', '1');
    }
    ultima.current = c;
  }

  async function cerrarSesion() {
    await signOut(auth);
    navigate('/login');
  }

  function elegirAccion(tipo) {
    setRapido(false);
    setPaleta(false);
    setMas(false);
    abrir(tipo);
  }

  const menuRapido = (mob) => (
    <div className={`quick ${mob ? 'mob' : ''}`} ref={rapidoRef} role="menu">
      {ACCIONES.map(({ tipo, label, desc, Icon, tecla }) => (
        <button key={tipo} className="palette-opt" onClick={() => elegirAccion(tipo)} role="menuitem">
          <Icon />
          <span style={{ flex: 1 }}>
            <span style={{ fontWeight: 500 }}>{label}</span>
            <span className="card-note" style={{ display: 'block', fontSize: 11.5 }}>{desc}</span>
          </span>
          <span className="kbd">{tecla}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="adm" onMouseMove={onMove}>
      <div className="adm-bg" aria-hidden="true">
        <div className="adm-orb o1" /><div className="adm-orb o2" /><div className="adm-orb o3" /><div className="adm-grid" />
      </div>

      {/* Sidebar (desktop) */}
      <aside className="adm-side desk-only">
        <Link to="/admin" className="adm-brand">
          <img src="/logo-fraganzia-crop.png" alt="" />
          <span><b>FRAGANZIA</b><small>PANEL DE SOCIOS</small></span>
        </Link>
        <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', margin: '0 2px', color: 'var(--a-dim)' }} onClick={() => setPaleta(true)}>
          <Search /><span style={{ flex: 1, textAlign: 'left' }}>Buscar o crear</span><span className="faint" style={{ fontSize: 11 }}>⌘K</span>
        </button>
        <nav className="adm-nav">
          {GRUPOS.map((g, i) => (
            <div className="adm-group" key={i}>
              {g.label && <span className="adm-group-label">{g.label}</span>}
              {g.items.map(({ to, end, label, Icon, badge }) => (
                <NavLink key={to} to={to} end={end} className={({ isActive }) => `adm-item ${isActive ? 'on' : ''}`}>
                  <Icon /><span>{label}</span>
                  {badge && enProceso > 0 && <span className="adm-badge">{enProceso}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="adm-user">
          <span className="adm-avatar">{nombreSocio[0]}</span>
          <div style={{ flex: 1, minWidth: 0, lineHeight: 1.25 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{nombreSocio}</div>
            <div className="faint" style={{ fontSize: 11.5 }}>Socio · 50%</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={cerrarSesion} aria-label="Cerrar sesión"><LogOut /></button>
        </div>
      </aside>

      <div className="adm-col">
        {/* Header (mobile) */}
        <header className="adm-mobhead mob-only">
          <img src="/logo-fraganzia-crop.png" alt="" width="28" height="28" style={{ borderRadius: '50%' }} />
          <span style={{ flex: 1, fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700, letterSpacing: '.13em' }}>FRAGANZIA</span>
          <button className="btn btn-secondary btn-icon" style={{ width: 44, height: 44 }} onClick={() => setPaleta(true)} aria-label="Buscar"><Search /></button>
        </header>

        <main className="adm-main">
          <div className="adm-page">
            <div className="adm-head">
              <div className="flex min-w-0 flex-col gap-1">
                <span className="adm-crumb">{meta.crumb}</span>
                <h1 className="adm-h1">{meta.title}</h1>
                <span className="adm-sub">{meta.sub}</span>
              </div>
              <div className="desk-only" style={{ alignItems: 'center', gap: 10 }}>
                {dolarMedio && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 12, border: '1px solid rgba(16,185,129,.25)', background: 'rgba(16,185,129,.06)', fontSize: 12.5, color: 'var(--a-dim)' }}>
                    <span className="pulse" style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 10px #10B981' }} />
                    Dólar blue <b style={{ fontWeight: 500, color: 'var(--a-text)' }}>$ {new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(dolarMedio)}</b>
                  </span>
                )}
                <div style={{ position: 'relative' }}>
                  <button className="btn btn-primary" style={{ position: 'relative', overflow: 'hidden', padding: '9px 16px' }} onClick={() => setRapido((v) => !v)} aria-haspopup="menu" aria-expanded={rapido}>
                    <span className="sweep" />
                    <Plus style={{ position: 'relative' }} /><span style={{ position: 'relative' }}>Nueva</span><span className="kbd" style={{ position: 'relative' }}>N</span>
                  </button>
                  {rapido && menuRapido(false)}
                </div>
              </div>
            </div>

            <Outlet />
          </div>
        </main>
      </div>

      {/* Barra inferior (mobile) */}
      <nav className="adm-bottom mob-only" aria-label="Navegación">
        <NavLink to="/admin" end className={({ isActive }) => (isActive ? 'on' : '')}><Home />Inicio</NavLink>
        <NavLink to="/admin/pedidos" className={({ isActive }) => (isActive ? 'on' : '')}>
          <ShoppingBag />Pedidos
          {enProceso > 0 && <span className="adm-badge" style={{ position: 'absolute', top: 0, right: '22%', minWidth: 16, height: 16, fontSize: 9.5 }}>{enProceso}</span>}
        </NavLink>
        <button className="plus" onClick={() => setRapido((v) => !v)} aria-label="Nueva carga"><Plus /></button>
        <NavLink to="/admin/ventas" className={() => (/^\/admin\/(ventas|compras|movimientos)/.test(pathname) ? 'on' : '')}><TrendingUp />Finanzas</NavLink>
        <button className="tab" onClick={() => setMas(true)}><MoreHorizontal />Más</button>
      </nav>
      {rapido && (
        <div className="mob-only">
          <div className="adm-overlay" style={{ background: 'transparent' }} onMouseDown={() => setRapido(false)} />
          {menuRapido(true)}
        </div>
      )}

      {mas && (
        <div className="adm-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setMas(false); }}>
          <div className="adm-modal">
            <div className="adm-modal-head">
              <div style={{ flex: 1 }}><h2>Todas las secciones</h2></div>
              <button className="btn btn-ghost btn-icon" onClick={() => setMas(false)} aria-label="Cerrar"><X /></button>
            </div>
            <div className="adm-modal-body">
              <div className="grid-auto" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                {PANTALLAS.map(({ to, label, Icon }) => (
                  <Link key={to} to={to} className="btn btn-secondary" style={{ justifyContent: 'flex-start', minHeight: 48 }}><Icon />{label}</Link>
                ))}
              </div>
              <button className="btn btn-ghost" onClick={cerrarSesion}><LogOut />Cerrar sesión</button>
            </div>
          </div>
        </div>
      )}

      <AdminModalHost />

      {paleta && <Paleta onClose={() => setPaleta(false)} onIr={(to) => { setPaleta(false); navigate(to); }} onAccion={elegirAccion} />}
    </div>
  );
}

function Paleta({ onClose, onIr, onAccion }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);

  const opciones = useMemo(() => {
    const todas = [
      ...ACCIONES.map((a) => ({ ...a, seccion: 'Crear', run: () => onAccion(a.tipo) })),
      ...OTRAS_ACCIONES.map((a) => ({ ...a, seccion: 'Crear', run: () => onAccion(a.tipo) })),
      ...PANTALLAS.map((p) => ({ ...p, seccion: 'Ir a', run: () => onIr(p.to) })),
    ];
    const t = q.trim().toLowerCase();
    return t ? todas.filter((o) => o.label.toLowerCase().includes(t)) : todas;
  }, [q, onAccion, onIr]);

  function onKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, opciones.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    else if (e.key === 'Enter') { opciones[sel]?.run(); }
  }

  let seccionAnterior = null;
  return (
    <div className="adm-overlay top" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="palette" role="dialog" aria-label="Buscar o crear">
        <input autoFocus placeholder="Buscar una pantalla o crear algo…" value={q} onChange={(e) => { setQ(e.target.value); setSel(0); }} onKeyDown={onKey} />
        <div className="palette-list">
          {opciones.length === 0 && <div className="adm-empty">Nada coincide con “{q}”.</div>}
          {opciones.map((o, i) => {
            const cabecera = o.seccion !== seccionAnterior;
            seccionAnterior = o.seccion;
            return (
              <div key={`${o.seccion}-${o.label}`}>
                {cabecera && <div className="palette-sec">{o.seccion}</div>}
                <button className={`palette-opt ${i === sel ? 'on' : ''}`} onMouseEnter={() => setSel(i)} onClick={o.run}>
                  <o.Icon /><span style={{ flex: 1 }}>{o.label}</span>{o.tecla && <span className="kbd">{o.tecla}</span>}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function AdminLayout() {
  return (
    <AdminActionsProvider>
      <Shell />
    </AdminActionsProvider>
  );
}
