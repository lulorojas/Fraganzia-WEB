import { useEffect, useState, useSyncExternalStore } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Minus, Plus, ChevronLeft, MessageCircle } from 'lucide-react';
import { usePerfume } from '../hooks/usePerfume';
import { incrementarVista } from '../services/estadisticasService';
import { useDolarBlue } from '../hooks/useDolarBlue';
import { useCart, CANTIDAD_MAX } from '../context/CartContext';
import { useConfig } from '../hooks/useConfig';
import { usePromocionesActivas } from '../hooks/usePromociones';
import { useDocumentMeta, SITE_URL } from '../hooks/useDocumentMeta';
import { NotasOlfativas } from '../components/perfumes/NotasOlfativas';
import { InspiradoEn } from '../components/perfumes/InspiradoEn';
import { PrecioNoDisponible } from '../components/perfumes/PrecioNoDisponible';
import { Button } from '../components/ui/Button';
import { preciosPorMetodo, getMejorPromo } from '../utils/precios';
import { formatARS, nombreCompleto } from '../utils/format';
import { imagenGrande } from '../utils/image';
import { construirLinkWhatsApp } from '../utils/whatsapp';
import { WHATSAPP_NUMERO } from '../constants';
import { ImagenProducto } from '../components/perfumes/ImagenProducto';
import { BotonFavorito } from '../components/perfumes/BotonFavorito';


// Mismo layout que la página cargada, para que nada se mueva al llegar los datos.
function DetalleSkeleton() {
  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 md:grid-cols-2 md:gap-12 md:py-12" role="status" aria-label="Cargando perfume">
      <div className="aspect-square w-full animate-pulse rounded-3xl bg-white/[0.06]" />
      <div className="flex flex-col gap-4">
        <div className="h-4 w-24 animate-pulse rounded bg-white/[0.08]" />
        <div className="h-9 w-4/5 animate-pulse rounded bg-white/[0.08]" />
        <div className="h-24 w-full animate-pulse rounded-2xl bg-white/[0.06]" />
        <div className="h-12 w-full animate-pulse rounded-xl bg-white/[0.06]" />
      </div>
    </div>
  );
}

function precioConPromo(precio, pct) {
  return Math.round((precio * (1 - pct / 100)) / 1000) * 1000;
}

export default function PerfumeDetalle() {
  const { id } = useParams();
  const { data: perfume, isLoading } = usePerfume(id);
  // El HTML pre-generado de la ficha es el esqueleto: al hidratar hay que
  // pintar lo mismo y recién después el contenido (si no, React descarta el
  // HTML y tira errores de hidratación). Con render normal ya es true.
  const montado = useSyncExternalStore(() => () => {}, () => true, () => false);
  // Solo se lee lo que ya está en caché (si vino del catálogo): pedir los ~400 perfumes por una ficha costaría lecturas de más.
  const catalogo = useQueryClient().getQueryData(['perfumes', 'public']);
  const { dolarMedio } = useDolarBlue();
  const { data: config } = useConfig();
  const { data: promociones } = usePromocionesActivas();
  const { agregar } = useCart();
  const [cantidad, setCantidad] = useState(1);

  // Registra la vista una sola vez por perfume por sesión (ver
  // estadisticasService). El id es la dependencia: navegar a otro perfume
  // vuelve a disparar, recargar el mismo no.
  useEffect(() => {
    if (id) incrementarVista(id);
  }, [id]);

  const tieneCotizacion = Boolean(dolarMedio);
  const preciosLive = perfume && tieneCotizacion ? preciosPorMetodo(perfume.precioUSD, dolarMedio) : null;
  const precios =
    preciosLive ??
    (perfume?.precioTransferencia
      ? { precioTransferencia: perfume.precioTransferencia, precioEfectivo: perfume.precioEfectivo }
      : null);

  const promo = perfume ? getMejorPromo(perfume.id, promociones) : null;
  const pct = promo?.descuentoPorcentaje ?? 0;
  const precioTransferenciaFinal = precios && (pct ? precioConPromo(precios.precioTransferencia, pct) : precios.precioTransferencia);
  const precioEfectivoFinal = precios && (pct ? precioConPromo(precios.precioEfectivo, pct) : precios.precioEfectivo);

  const imagen = perfume?.imagenes?.[0];
  const imagenOg = imagenGrande(imagen);
  const imagenAbsoluta = imagenOg?.startsWith('/') ? `${SITE_URL}${imagenOg}` : imagenOg;

  useDocumentMeta(
    perfume
      ? {
          title: `${perfume.nombre} — ${perfume.marca}`,
          description:
            perfume.descripcion?.slice(0, 155) ||
            `${perfume.nombre} de ${perfume.marca}, perfume original. Precio en pesos y envíos en AMBA.`,
          path: `/perfume/${perfume.id}`,
          image: imagenAbsoluta,
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: perfume.nombre,
            brand: { '@type': 'Brand', name: perfume.marca },
            image: imagenAbsoluta,
            description: perfume.descripcion,
            ...(precioTransferenciaFinal && {
              offers: {
                '@type': 'Offer',
                url: `${SITE_URL}/perfume/${perfume.id}`,
                priceCurrency: 'ARS',
                price: precioTransferenciaFinal,
                availability: 'https://schema.org/InStock',
              },
            }),
          },
        }
      : { title: 'Perfume' }
  );

  if (isLoading || !montado) return <DetalleSkeleton />;

  if (!perfume) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
        <h1 className="font-display text-2xl text-text">Perfume no encontrado</h1>
        <p className="text-text-secondary">
          Este perfume ya no está disponible o el enlace es incorrecto.
        </p>
        <Link to="/catalogo">
          <Button>Volver al catálogo</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-6 sm:px-6 md:pt-10">
      <Link
        to="/catalogo"
        className="mb-6 inline-flex items-center gap-1 font-body text-sm text-text-secondary transition-base hover:text-text"
      >
        <ChevronLeft size={16} aria-hidden="true" />
        Catálogo
      </Link>

      <div className="grid gap-8 md:grid-cols-2 md:gap-12">
        {/* ── Imagen ── */}
        <div className="md:sticky md:top-24 md:self-start">
          <div className="relative overflow-hidden rounded-3xl plinto">
            {imagen ? (
              <ImagenProducto
                url={imagen}
                alt={nombreCompleto(perfume)}
                sizes="(min-width: 1152px) 540px, (min-width: 768px) 46vw, 100vw"
                width="600"
                height="600"
                prioridad
                className="foto-producto aspect-square w-full object-contain p-8 sm:p-12"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center">
                <span className="select-none text-8xl text-violet opacity-10">✦</span>
              </div>
            )}
            {pct > 0 && (
              <span className="absolute right-4 top-4 rounded-full bg-violet px-3 py-1.5 text-sm font-bold text-white shadow-xl">
                -{pct}%
              </span>
            )}
          </div>
        </div>

        {/* ── Info ── */}
        <div className="flex flex-col gap-6">
          <div>
            <p className="mb-2 font-body text-xs font-semibold uppercase tracking-wide2 text-lila">{perfume.marca}</p>
            <h1 className="font-display text-3xl font-semibold leading-tight text-text text-balance sm:text-4xl">
              {perfume.nombre}
            </h1>
            <p className="mt-2 font-body text-sm text-text-secondary">
              {[perfume.volumenML && `${perfume.volumenML} ml`, perfume.genero, perfume.familiaOlfativa]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>

          {precios ? (
            <div className="card-surface rounded-2xl p-5 tabular-nums">
              {pct > 0 && (
                <p className="mb-3 font-body text-sm font-medium text-lila">
                  {promo?.titulo ?? promo?.nombre ?? 'Promoción'} · {pct}% off
                </p>
              )}
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-body text-sm text-text-secondary">Transferencia</span>
                <span className="flex items-baseline gap-2">
                  {pct > 0 && (
                    <span className="font-body text-sm text-text-secondary line-through">
                      <span className="sr-only">Antes </span>
                      {formatARS(precios.precioTransferencia)}
                    </span>
                  )}
                  <span className={`font-display text-2xl font-semibold ${pct > 0 ? 'text-emerald-400' : 'text-text'}`}>
                    {formatARS(precioTransferenciaFinal)}
                  </span>
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-4">
                <span className="font-body text-sm text-text-secondary">Efectivo</span>
                <span className="flex items-baseline gap-2">
                  {pct > 0 && (
                    <span className="font-body text-xs text-text-secondary line-through">
                      <span className="sr-only">Antes </span>
                      {formatARS(precios.precioEfectivo)}
                    </span>
                  )}
                  <span className={`font-display text-lg ${pct > 0 ? 'text-emerald-400' : 'text-text-secondary'}`}>
                    {formatARS(precioEfectivoFinal)}
                  </span>
                </span>
              </div>
            </div>
          ) : (
            <PrecioNoDisponible nombrePerfume={perfume.nombre} whatsappNumero={config?.whatsappNumero} />
          )}

          {/* Cantidad + agregar. En mobile queda pegada abajo mientras se lee la
              ficha (sticky dentro de esta columna, así no tapa el footer). */}
          <div className="sticky bottom-0 z-30 -mx-4 border-t border-violet/15 bg-bg/95 px-4 py-3 sm:-mx-6 sm:px-6 md:static md:z-auto md:mx-0 md:border-0 md:bg-transparent md:p-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-xl border border-border" role="group" aria-label="Cantidad">
                <button
                  type="button"
                  onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                  disabled={cantidad <= 1}
                  aria-label="Restar una unidad"
                  className="flex h-11 w-11 items-center justify-center text-text-secondary transition-base hover:text-text disabled:opacity-40"
                >
                  <Minus size={16} aria-hidden="true" />
                </button>
                <span className="w-8 text-center font-body tabular-nums text-text" aria-live="polite">
                  {cantidad}
                </span>
                <button
                  type="button"
                  onClick={() => setCantidad((c) => Math.min(CANTIDAD_MAX, c + 1))}
                  disabled={cantidad >= CANTIDAD_MAX}
                  aria-label="Sumar una unidad"
                  className="flex h-11 w-11 items-center justify-center text-text-secondary transition-base hover:text-text disabled:opacity-40"
                >
                  <Plus size={16} aria-hidden="true" />
                </button>
              </div>
              <Button onClick={() => agregar(perfume, cantidad)} className="h-11 flex-1">
                Agregar al carrito
              </Button>
              <BotonFavorito perfume={perfume} variante="borde" />
            </div>
          </div>

          {perfume.descripcion && (
            <p className="font-body leading-relaxed text-text-secondary">{perfume.descripcion}</p>
          )}

          <InspiradoEn perfume={perfume} catalogo={catalogo} />

          <a
            href={construirLinkWhatsApp(
              config?.whatsappNumero ?? WHATSAPP_NUMERO,
              `Hola! Quiero consultar por ${perfume.nombre}: ${SITE_URL}/perfume/${perfume.id}`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-2 font-body text-sm text-lila transition-colors hover:text-text"
          >
            <MessageCircle size={16} aria-hidden="true" />
            Consultar por WhatsApp
          </a>

          <div className="border-t border-violet/15 pt-6">
            <NotasOlfativas
              notasSalida={perfume.notasSalida}
              notasCorazon={perfume.notasCorazon}
              notasFondo={perfume.notasFondo}
              nombre={perfume.nombre}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
