import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, Heart, Sparkles } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useFavoritos } from '../../context/FavoritosContext';
import { useDolarBlue } from '../../hooks/useDolarBlue';
import { usePromocionesActivas } from '../../hooks/usePromociones';
import { calcularCarritoConPromos } from '../../utils/precios';
import { formatARS } from '../../utils/format';
import { LogoFraganzia } from '../ui/LogoFraganzia';
import { abrirAsistente } from '../asistente/BotonAsistente';

// Cada enlace lleva a una sección distinta: nada de atajos de filtros repetidos (eso vive en el catálogo).
const SECCIONES = [
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/decants', label: 'Decants' },
  { to: '/mis-pedidos', label: 'Seguí tu pedido' },
  { to: '/sobre-nosotros', label: 'Nosotros' },
  { to: '/contacto', label: 'Contacto' },
];

/**
 * Encabezado de dos niveles: franja fina de anuncio y, debajo, el logo, el buscador (el único
 * elemento con color lleno), Favoritos y Carrito (con texto, no solo ícono) y una fila con las
 * secciones del sitio y el asistente "Encontrá tu perfume".
 */
export function Navbar() {
  const { state } = useCart();
  const { ids: favoritos } = useFavoritos();
  const { dolarMedio } = useDolarBlue();
  const { data: promociones } = usePromocionesActivas();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const [consulta, setConsulta] = useState('');
  // El HTML prerenderizado no trae parámetros de URL: lo que depende de ?ofertas=1 se calcula después de montar.
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);

  const cantidadItems = state.items.reduce((acc, item) => acc + item.cantidad, 0);
  const importe =
    cantidadItems > 0 && dolarMedio
      ? calcularCarritoConPromos(state.items, promociones, state.metodoPago === 'Efectivo', dolarMedio).totalARS
      : null;
  const hayOfertas = Boolean(promociones?.length);

  function buscar(e) {
    e.preventDefault();
    const q = consulta.trim();
    navigate(q ? `/catalogo?buscar=${encodeURIComponent(q)}` : '/catalogo');
  }

  // "Catálogo" y "Ofertas" comparten ruta: se distinguen por el parámetro ?ofertas=1.
  const enOfertas = montado && pathname === '/catalogo' && search.includes('ofertas=1');
  const estaActiva = (to) => (to === '/catalogo' ? pathname === '/catalogo' && !enOfertas : pathname === to);

  const claseLink = (activa) =>
    `shrink-0 rounded-full border px-4 py-2 font-body text-[13.5px] transition-colors hover:border-border hover:text-text ${
      activa ? 'border-border bg-white/[0.06] font-semibold text-text' : 'border-transparent text-[#cfc3ea]'
    }`;

  const claseAccion =
    'relative flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-xl px-2 font-body text-[11px] font-medium text-[#d9ccf2] transition-colors hover:text-text lg:flex-row lg:gap-2 lg:px-3 lg:text-[13.5px]';

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-gradient-to-r from-[#150d2e] via-[#2a1658] to-[#150d2e] px-3 py-1.5 text-center font-body text-[10.5px] font-medium uppercase tracking-[0.16em] text-[#dcc6ff]">
        Envíos a todo el AMBA · Transferencia o efectivo
      </div>

      <div className="border-b border-border bg-[rgba(12,9,26,0.97)] shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
        <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-x-2 gap-y-2.5 px-3.5 pb-2 pt-2.5 [grid-template-areas:'logo_acc'_'busq_busq'_'nav_nav'] lg:grid-cols-[auto_minmax(340px,1fr)_auto] lg:gap-x-7 lg:gap-y-3 lg:px-6 lg:pt-3.5 lg:[grid-template-areas:'logo_busq_acc'_'nav_nav_nav']">
          <Link to="/" aria-label="Fraganzia Perfumes árabes, ir al inicio" className="justify-self-start [grid-area:logo] transition-opacity hover:opacity-85">
            <LogoFraganzia subtitulo="sm" className="[--logo-scale:0.95] lg:[--logo-scale:1.05]" />
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
              title="Los perfumes que guardaste con el corazón"
              className={claseAccion}
            >
              <Heart size={22} aria-hidden="true" />
              <span>Favoritos</span>
              {favoritos.length > 0 && (
                <span aria-hidden="true" className="absolute right-0.5 top-0 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#E11D74] px-1 text-[10px] font-bold text-white lg:right-auto lg:left-6">
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
              title="Ver lo que vas a comprar"
              className={claseAccion}
            >
              <ShoppingBag size={22} aria-hidden="true" />
              <span>Carrito</span>
              {importe != null && <b className="hidden font-semibold text-text tabular-nums lg:inline">{formatARS(importe)}</b>}
              {cantidadItems > 0 && (
                <span
                  // La key cambia con la cantidad: React recrea el badge y la animación "bump" corre en cada agregado.
                  key={cantidadItems}
                  aria-hidden="true"
                  className="absolute right-0.5 top-0 flex h-[17px] min-w-[17px] animate-bump items-center justify-center rounded-full bg-[#E11D74] px-1 text-[10px] font-bold text-white lg:right-auto lg:left-6"
                >
                  {cantidadItems}
                </span>
              )}
            </Link>
          </div>

          <nav aria-label="Secciones del sitio" className="hide-scrollbar -mx-3.5 flex items-center gap-1.5 overflow-x-auto px-3.5 py-0.5 [grid-area:nav] lg:mx-0 lg:px-0">
            <button
              type="button"
              onClick={abrirAsistente}
              className="order-first flex shrink-0 items-center gap-2 rounded-full border border-lila/45 px-4 py-2 font-body text-[13.5px] font-semibold text-lila transition-colors hover:bg-violet/20 hover:text-text lg:order-last lg:ml-auto"
            >
              <Sparkles size={16} aria-hidden="true" />
              Encontrá tu perfume
            </button>
            {SECCIONES.slice(0, 2).map(({ to, label }) => (
              <Link key={to} to={to} aria-current={estaActiva(to) ? 'page' : undefined} className={claseLink(estaActiva(to))}>
                {label}
              </Link>
            ))}
            {hayOfertas && (
              <Link to="/catalogo?ofertas=1" aria-current={enOfertas ? 'page' : undefined} className={claseLink(enOfertas)}>
                Ofertas
              </Link>
            )}
            {SECCIONES.slice(2).map(({ to, label }) => (
              <Link key={to} to={to} aria-current={estaActiva(to) ? 'page' : undefined} className={claseLink(estaActiva(to))}>
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
