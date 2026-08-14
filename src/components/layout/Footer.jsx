import { Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LogoFraganzia } from '../ui/LogoFraganzia';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-gradient-to-t from-violet/5 to-transparent">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <LogoFraganzia />
            <p className="mt-3 font-luxury text-sm italic text-text-secondary">
              Venta de perfumes árabes
            </p>
            <a
              href="https://www.instagram.com/fraganzia.ar/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs text-text-secondary transition-base hover:border-lila/40 hover:text-lila"
            >
              <Instagram size={13} />
              @fraganzia.ar
            </a>
          </div>

          {/* Links */}
          <div>
            <p className="tracking-luxury mb-3 text-xs uppercase text-lila">Navegación</p>
            <ul className="space-y-2 font-body text-sm text-text-secondary">
              <li><Link to="/catalogo" className="transition-base hover:text-text">Catálogo</Link></li>
              <li><Link to="/sobre-nosotros" className="transition-base hover:text-text">Nosotros</Link></li>
              <li><Link to="/contacto" className="transition-base hover:text-text">Contacto</Link></li>
              <li><Link to="/carrito" className="transition-base hover:text-text">Carrito</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="tracking-luxury mb-3 text-xs uppercase text-lila">Contacto</p>
            <p className="font-body text-sm text-text-secondary">Pedidos al MD vía Instagram</p>
            <p className="mt-1 font-body text-sm text-text-secondary">o por WhatsApp</p>
            <p className="mt-2 font-body text-xs text-lila">Envíos solo al AMBA</p>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center">
          <p className="font-body text-xs text-text-secondary/50">
            © {new Date().getFullYear()} Fraganzia. Todos los derechos reservados.
          </p>
          <Link 
            to="/login" 
            className="mt-2 inline-block font-body text-[10px] text-text-secondary/30 hover:text-text-secondary/60 transition-colors"
          >
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
