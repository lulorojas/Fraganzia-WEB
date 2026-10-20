import { Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LogoFraganzia } from '../ui/LogoFraganzia';

// Lo que ya está en el encabezado (carrito, favoritos) y en la franja de la
// portada (envíos, pago) no se repite acá: el pie suma atajos para comprar y ayuda.
const COMPRAR = [
  { to: '/catalogo?genero=Masculino', label: 'Para él' },
  { to: '/catalogo?genero=Femenino', label: 'Para ella' },
  { to: '/catalogo?genero=Unisex', label: 'Unisex' },
  { to: '/decants', label: 'Decants' },
];

const AYUDA = [
  { to: '/mis-pedidos', label: 'Seguí tu pedido' },
  { to: '/contacto', label: 'Contacto' },
  { to: '/sobre-nosotros', label: 'Quiénes somos' },
];

function Columna({ titulo, enlaces }) {
  return (
    <nav aria-label={titulo} className="font-body text-sm">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-luxury text-lila">{titulo}</p>
      <ul className="space-y-2.5 text-text-secondary">
        {enlaces.map(({ to, label }) => (
          <li key={to}><Link to={to} className="transition-base hover:text-text">{label}</Link></li>
        ))}
      </ul>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-gradient-to-t from-violet/5 to-transparent">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr] sm:items-start">
          <div className="flex flex-col items-start gap-5">
            <LogoFraganzia size={1.15} subtitulo />
            <a
              href="https://www.instagram.com/fraganzia.ar/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs text-text-secondary transition-base hover:border-lila/40 hover:text-lila"
            >
              <Instagram size={13} aria-hidden="true" />
              @fraganzia.ar
            </a>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:contents">
            <Columna titulo="Comprar" enlaces={COMPRAR} />
            <Columna titulo="Ayuda" enlaces={AYUDA} />
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 font-body text-xs text-text-secondary">
          <p>© {new Date().getFullYear()} Fraganzia. Todos los derechos reservados.</p>
          <Link to="/login" className="transition-colors hover:text-text">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
