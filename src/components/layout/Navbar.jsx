import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, Menu, X, Heart, Sparkles } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useFavoritos } from '../../context/FavoritosContext';
import { useDolarBlue } from '../../hooks/useDolarBlue';
import { usePromocionesActivas } from '../../hooks/usePromociones';
import { calcularCarritoConPromos } from '../../utils/precios';
import { formatARS } from '../../utils/format';
import { LogoFraganzia } from '../ui/LogoFraganzia';
import { abrirAsistente } from '../asistente/BotonAsistente';

// Categorías: llevan al catálogo ya filtrado (el catálogo lee ?genero=, ?ofertas=1, ?buscar=).
const CATEGORIAS = [
  { to: '/catalogo?genero=Masculino', label: 'Para él' },
  { to: '/catalogo?genero=Femenino', label: 'Para ella' },
  { to: '/catalogo?genero=Unisex', label: 'Unisex' },
  { to: '/decants', label: 'Decants' },
];

const MENU_MOVIL = [
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/decants', label: 'Decants' },
  { to: '/favoritos', label: 'Favoritos' },
  { to: '/mis-pedidos', label: 'Seguí tu pedido' },
  { to: '/sobre-nosotros', label: 'Nosotros' },
  { to: '/contacto', label: 'Contacto' },
];

// Cierra un menú desplegable al hacer click afuera o apretar Escape.
function useCerrarAlSalir(ref, abierto, cerrar) {
  useEffect(() => {
    if (!abierto) return undefined;
    function onPointer(e) {
      if (ref.current && !ref.current.contains(e.target)) cerrar();
    }
    function onKey(e) {
      if (e.key === 'Escape') cerrar();
    }
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [ref, abierto, cerrar]);
}

/**
 * Encabezado de dos niveles: franja fina de anuncio y, debajo, el logo, el buscador (el único
 * elemento con color lleno), favoritos, el carrito con su importe, y una fila de categorías con
 * el asistente "Encontrá tu perfume".
 */
export function Navbar() {
  const { state } = useCart();
  const { ids: favoritos } = useFavoritos();
  const { dolarMedio } = useDolarBlue();
  const { data: promociones } = usePromocionesActivas();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [consulta, setConsulta] = useState('');
  const [menuAbierto, setMenuAbierto] = useState(false);
  const cabeceraRef = useRef(null);

  const cantidadItems = state.items.reduce((acc, item) => acc + item.cantidad, 0);
  const importe =
    cantidadItems > 0 && dolarMedio
      ? calcularCarritoConPromos(state.items, promociones, state.metodoPago === 'Efectivo', dolarMedio).totalARS
      : null;
  const hayOfertas = Boolean(promociones?.length);

  useCerrarAlSalir(cabeceraRef, menuAbierto, () => setMenuAbierto(false));
  // Al navegar se cierra el menú.
  useEffect(() => setMenuAbierto(false), [pathname]);

  function buscar(e) {
    e.preventDefault();
    const q = consulta.trim();
    navigate(q ? `/catalogo?buscar=${encodeURIComponent(q)}` : '/catalogo');
  }

  const claseCat =
    'shrink-0 rounded-full border border-transparent px-4 py-2 font-body text-[13.5px] text-[#cfc3ea] transition-colors hover:border-border hover:text-text';

  return (
    <header ref={cabeceraRef} className="sticky top-0 z-40">
      <div className="bg-gradient-to-r from-[#150d2e] via-[#2a1658] to-[#150d2e] px-3 py-1.5 text-center font-body text-[10.5px] font-medium uppercase tracking-[0.16em] text-[#dcc6ff]">
        Envíos a todo el AMBA · Transferencia o efectivo
      </div>

      <div className="border-b border-border bg-[rgba(12,9,26,0.97)] shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
        <div className="mx-auto grid max-w-7xl grid-cols-[44px_1fr_auto] items-center gap-x-2 gap-y-2.5 px-3.5 pb-2 pt-2.5 [grid-template-areas:'menu_logo_acc'_'busq_busq_busq'_'cats_cats_cats'] lg:grid-cols-[auto_minmax(340px,1fr)_auto] lg:gap-x-7 lg:gap-y-3 lg:px-6 lg:pt-3.5 lg:[grid-template-areas:'logo_busq_acc'_'cats_cats_cats']">
          <button
            type="button"
            onClick={() => setMenuAbierto((a) => !a)}
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuAbierto}
            aria-controls="menu-movil"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-[#d9ccf2] [grid-area:menu] lg:hidden"
          >
            {menuAbierto ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
          </button>

          <Link to="/" aria-label="Fraganzia, ir al inicio" className="justify-self-start [grid-area:logo] transition-opacity hover:opacity-85">
            <LogoFraganzia className="[--logo-scale:0.9] lg:[--logo-scale:1.05]" />
          </Link>

          <form role="search" onSubmit={buscar} className="flex items-stretch overflow-hidden rounded-full border-[1.5px] border-lila bg-white/[0.05] shadow-[0_0_0_4px_rgba(155,89,208,0.12)] [grid-area:busq]">
            <label htmlFor="buscar-cabecera" className="sr-only">Buscar perfumes por nombre, marca o aroma</label>
            <input
              id="buscar-cabecera"
              type="search"
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
              placeholder="Buscá por nombre, marca o aroma"
              autoComplete="off"
              maxLength={80}
              className="min-w-0 flex-1 bg-transparent px-4 py-3 font-body text-[15px] text-text placeholder:text-[#a99fc7] focus:outline-none"
            />
            <button type="submit" className="gradient-violet flex items-center gap-2 px-5 font-body text-sm font-bold text-white">
              <Search size={20} aria-hidden="true" />
              <span className="hidden sm:inline">Buscar</span>
              <span className="sr-only sm:hidden">Buscar</span>
            </button>
          </form>

          <div className="flex items-center gap-0.5 [grid-area:acc]">
            <Link
              to="/favoritos"
              aria-label={favoritos.length ? `Favoritos, ${favoritos.length} guardados` : 'Favoritos'}
              className="relative flex h-11 w-11 items-center justify-center rounded-xl text-[#d9ccf2] transition-colors hover:text-text"
            >
              <Heart size={22} aria-hidden="true" />
              {favoritos.length > 0 && (
                <span aria-hidden="true" className="absolute left-5 top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#E11D74] px-1 text-[10px] font-bold text-white">
                  {favoritos.length}
                </span>
              )}
            </Link>
            <Link
              to="/carrito"
              aria-label={
                cantidadItems > 0
                  ? `Carrito, ${cantidadItems} ${cantidadItems === 1 ? 'producto' : 'productos'}${importe ? `, ${formatARS(importe)}` : ''}`
                  : 'Carrito'
              }
              className="relative flex h-11 items-center gap-2 rounded-xl px-2.5 text-[#d9ccf2] transition-colors hover:text-text"
            >
              <ShoppingBag size={22} aria-hidden="true" />
              {importe != null && <b className="hidden font-body text-[13px] font-semibold text-text tabular-nums sm:inline">{formatARS(importe)}</b>}
              {cantidadItems > 0 && (
                <span
                  // La key cambia con la cantidad: React recrea el badge y la animación "bump" corre en cada agregado.
                  key={cantidadItems}
                  aria-hidden="true"
                  className="absolute left-5 top-0.5 flex h-[17px] min-w-[17px] animate-bump items-center justify-center rounded-full bg-[#E11D74] px-1 text-[10px] font-bold text-white"
                >
                  {cantidadItems}
                </span>
              )}
            </Link>
          </div>

          <nav aria-label="Categorías" className="hide-scrollbar -mx-3.5 flex items-center gap-2 overflow-x-auto px-3.5 py-0.5 [grid-area:cats] lg:mx-0 lg:px-0">
            <button
              type="button"
              onClick={abrirAsistente}
              className="order-first flex shrink-0 items-center gap-2 rounded-full border border-lila/45 px-4 py-2 font-body text-[13.5px] font-semibold text-lila transition-colors hover:bg-violet/20 hover:text-text lg:order-last lg:ml-auto"
            >
              <Sparkles size={16} aria-hidden="true" />
              Encontrá tu perfume
            </button>
            {CATEGORIAS.map(({ to, label }) => (
              <Link key={to} to={to} className={claseCat}>{label}</Link>
            ))}
            {hayOfertas && <Link to="/catalogo?ofertas=1" className={claseCat}>Ofertas</Link>}
          </nav>
        </div>

        {menuAbierto && (
          <nav id="menu-movil" aria-label="Menú" className="border-t border-border px-3.5 pb-4 pt-2 lg:hidden">
            <ul className="flex flex-col font-body">
              {MENU_MOVIL.map(({ to, label }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      `block rounded-lg px-3 py-3 text-base transition-colors hover:bg-violet/10 hover:text-text ${isActive ? 'text-text' : 'text-text-secondary'}`
                    }
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}
