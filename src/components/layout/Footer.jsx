import { Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LogoFraganzia } from '../ui/LogoFraganzia';

// El catálogo, el carrito y los favoritos ya están en el encabezado, y los
// envíos y el pago en la franja de la portada: acá solo lo que no se repite.
export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-gradient-to-t from-violet/5 to-transparent">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
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

          <nav aria-label="Ayuda" className="font-body text-sm">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-luxury text-lila">Ayuda</p>
            <ul className="space-y-2.5 text-text-secondary">
              <li><Link to="/mis-pedidos" className="transition-base hover:text-text">Seguí tu pedido</Link></li>
              <li><Link to="/contacto" className="transition-base hover:text-text">Contacto</Link></li>
              <li><Link to="/sobre-nosotros" className="transition-base hover:text-text">Quiénes somos</Link></li>
            </ul>
          </nav>
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
