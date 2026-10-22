import { Heart } from 'lucide-react';
import { useFavoritos } from '../../context/FavoritosContext';
import { nombreCompleto } from '../../utils/format';

/**
 * Corazón para guardar un perfume en favoritos. `variante="flotante"` va sobre
 * la foto (fondo blanco), `"borde"` al lado de otros botones.
 */
export function BotonFavorito({ perfume, variante = 'flotante', className = '' }) {
  const { esFavorito, alternar } = useFavoritos();
  const activo = esFavorito(perfume.id);

  const estilos = {
    flotante: 'h-9 w-9 bg-white/90 text-violet shadow-md hover:bg-white',
    // Sobre el escenario oscuro de las cards.
    oscuro: 'h-10 w-10 bg-[#0a0616]/60 text-[#e3d7fb] hover:bg-[#0a0616]/85 hover:text-white',
    borde: 'h-11 w-11 border border-border text-text-secondary hover:border-lila/50 hover:text-lila',
  }[variante];

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        alternar(perfume.id);
      }}
      aria-pressed={activo}
      aria-label={`${activo ? 'Quitar de' : 'Guardar en'} favoritos: ${nombreCompleto(perfume)}`}
      title={activo ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      className={`flex flex-shrink-0 items-center justify-center rounded-full transition-colors ${estilos} ${className}`}
    >
      <Heart
        size={variante === 'borde' ? 19 : 17}
        aria-hidden="true"
        // key: al cambiar de estado se recrea el ícono y corre el "bump".
        key={String(activo)}
        className={activo ? 'animate-bump fill-current text-[#E11D74]' : ''}
      />
    </button>
  );
}
