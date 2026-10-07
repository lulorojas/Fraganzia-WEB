import { useMemo } from 'react';
import { usePerfumes } from '../hooks/usePerfumes';
import { useDolarBlue } from '../hooks/useDolarBlue';
import { useCart } from '../context/CartContext';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { preciosPorMetodo } from '../utils/precios';
import { ML_DECANT, precioDecantUSD, esDecant } from '../utils/decants';
import { formatARS, nombreCompleto } from '../utils/format';
import { ImagenProducto } from '../components/perfumes/ImagenProducto';
import { GlassCard } from '../components/ui/GlassCard';

/** Una fila 3/5/10ml dentro de la card de un perfume. */
function FilaDecant({ perfume, ml, dolarMedio, onAgregar }) {
  const tienePrecio = Boolean(dolarMedio);
  const precios = tienePrecio
    ? preciosPorMetodo(precioDecantUSD(perfume, ml), dolarMedio)
    : null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2">
      <div>
        <p className="font-body text-sm font-semibold text-text">{ml}ml</p>
        {precios ? (
          <p className="text-xs text-text-secondary tabular-nums">
            {formatARS(precios.precioTransferencia)} transf. · {formatARS(precios.precioEfectivo)} efvo.
          </p>
        ) : (
          <p className="text-xs text-text-secondary">Sin cotización</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onAgregar(perfume, ml)}
        disabled={!tienePrecio}
        className="rounded-lg bg-violet px-3 py-2 text-xs font-semibold text-white transition-base hover:bg-violet/90 disabled:opacity-40"
      >
        Agregar
      </button>
    </div>
  );
}

function CardDecant({ perfume, dolarMedio, onAgregar }) {
  const imagen = perfume.imagenes?.[0];
  return (
    <GlassCard className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-white">
          <ImagenProducto url={imagen} sizes="64px" width="64" height="64" className="h-full w-full object-contain p-1" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide2 text-lila truncate">{perfume.marca}</p>
          <h2 className="font-display text-sm font-semibold leading-snug text-text line-clamp-2">{perfume.nombre}</h2>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {ML_DECANT.map((ml) => (
          <FilaDecant key={ml} perfume={perfume} ml={ml} dolarMedio={dolarMedio} onAgregar={onAgregar} />
        ))}
      </div>
    </GlassCard>
  );
}

/**
 * Catálogo de decants: los mismos perfumes marcados `decant: true` en
 * Firestore, vendidos en fracciones de 3/5/10ml en vez de la botella entera.
 * El precio en USD de cada fracción es el costo del líquido por ml (según el
 * precio del perfume completo) x2,5 — de ahí en adelante usa el mismo cálculo
 * de transferencia/efectivo que el resto del catálogo (ver utils/decants.js).
 */
export default function Decants() {
  useDocumentMeta({
    title: 'Decants de perfumes árabes',
    description: 'Probá nuestros perfumes árabes en fracciones de 3, 5 y 10ml antes de llevarte la botella entera.',
    path: '/decants',
  });
  const { data: catalogo, isLoading } = usePerfumes();
  const { dolarMedio } = useDolarBlue();
  const { agregar } = useCart();

  const perfumes = useMemo(() => catalogo?.filter(esDecant) ?? [], [catalogo]);

  function handleAgregar(perfume, ml) {
    agregar(
      {
        id: `${perfume.id}__decant${ml}`,
        perfumeIdBase: perfume.id,
        esDecant: true,
        ml,
        nombre: `${nombreCompleto(perfume)} — Decant ${ml}ml`,
        marca: perfume.marca,
        precioUSD: precioDecantUSD(perfume, ml),
        imagenes: perfume.imagenes,
      },
      1
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <h1 className="font-luxury text-3xl tracking-wide text-text sm:text-4xl">Decants</h1>
        <p className="mt-2 font-body text-text-secondary">
          Probá estos perfumes en fracciones de 3, 5 o 10ml antes de llevarte la botella entera.
        </p>
      </div>

      {isLoading ? (
        <p className="font-body text-text-secondary">Cargando...</p>
      ) : perfumes.length === 0 ? (
        <p className="font-body text-text-secondary">Todavía no hay perfumes disponibles en decant.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {perfumes.map((perfume) => (
            <CardDecant key={perfume.id} perfume={perfume} dolarMedio={dolarMedio} onAgregar={handleAgregar} />
          ))}
        </div>
      )}
    </div>
  );
}
