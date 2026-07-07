import { usePerfumes } from '../hooks/usePerfumes';
import { useDolarBlue } from '../hooks/useDolarBlue';
import { useCart } from '../context/CartContext';
import { usePromocionesActivas } from '../hooks/usePromociones';
import { PerfumeGrid } from '../components/perfumes/PerfumeGrid';
import { Spinner } from '../components/ui/Spinner';

export default function Home() {
  const { data: destacados, isLoading } = usePerfumes({ destacado: true });
  const { dolarMedio } = useDolarBlue();
  const { dispatch } = useCart();
  const { data: promociones } = usePromocionesActivas();

  function handleAgregar(perfume) {
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        perfumeId: perfume.id,
        nombre: perfume.nombre,
        marca: perfume.marca,
        precioUSD: perfume.precioUSD,
        cantidad: 1,
      },
    });
  }

  return (
    <div className="p-6">
      <section className="py-12 text-center">
        <h1 className="font-display text-4xl text-text">Fraganzia</h1>
        <p className="mt-2 font-luxury text-lg text-text-secondary">
          Perfumes árabes y de nicho
        </p>
      </section>

      <section>
        <h2 className="mb-4 font-display text-2xl text-text">Destacados</h2>
        {isLoading ? (
          <Spinner />
        ) : (
          <PerfumeGrid perfumes={destacados} dolarMedio={dolarMedio} onAgregar={handleAgregar} />
        )}
      </section>

      {promociones?.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 font-display text-2xl text-text">Promociones</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {promociones.map((promo) => (
              <div key={promo.id} className="glass overflow-hidden rounded-2xl">
                {promo.imagen && (
                  <img src={promo.imagen} alt={promo.titulo} className="w-full h-40 object-cover" />
                )}
                <div className="p-4">
                  <h3 className="font-display text-lg text-text">{promo.titulo}</h3>
                  {promo.descripcion && (
                    <p className="mt-1 text-sm text-text-secondary">{promo.descripcion}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
