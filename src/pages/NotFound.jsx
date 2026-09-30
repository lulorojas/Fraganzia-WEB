import { Link } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl items-center px-4 py-12">
      <GlassCard className="w-full p-8 text-center">
        <p className="font-display text-6xl text-lila mb-2">404</p>
        <h1 className="font-display text-2xl text-text mb-3">Página no encontrada</h1>
        <p className="font-body text-text-secondary mb-6">
          La página que buscás no existe o fue movida.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/catalogo"
            className="gradient-violet rounded-xl px-5 py-2.5 font-body font-medium text-text shadow-lg shadow-violet/20 transition-base hover:shadow-violet/40"
          >
            Ver catálogo
          </Link>
          <Link
            to="/"
            className="glass rounded-xl px-5 py-2.5 font-body font-medium text-text transition-base hover:border-lila/40"
          >
            Ir al inicio
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
