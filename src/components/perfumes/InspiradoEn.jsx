import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const USO = {
  C: 'Día y calor',
  O: 'Día y oficina',
  N: 'Noche y salidas',
  F: 'Noche y frío',
  T: 'Todo uso',
  K: 'Infantil',
};

const parecido = (s) => (s >= 85 ? 'Muy parecido' : s >= 70 ? 'Parecido' : 'Aire similar');

/**
 * Referencia en la que se inspira el perfume, para qué momento sirve y otras
 * opciones del catálogo con la misma inspiración. Los datos del asistente se
 * descargan aparte: no pesan en la carga de la ficha.
 */
export function InspiradoEn({ perfume, catalogo }) {
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    let vigente = true;
    import('../../data/asistente-perfumes.json').then((m) => vigente && setDatos(m.default));
    return () => {
      vigente = false;
    };
  }, []);

  const extra = datos?.[perfume.id];

  const similares = useMemo(() => {
    if (!extra?.i || !catalogo) return [];
    return catalogo
      .filter((p) => p.id !== perfume.id && datos[p.id]?.i === extra.i)
      .sort((a, b) => (datos[b.id].s ?? 0) - (datos[a.id].s ?? 0))
      .slice(0, 4);
  }, [catalogo, datos, extra, perfume.id]);

  if (!extra?.i && !(extra?.u && extra.u !== 'K')) return null;

  return (
    <section aria-label="Cómo huele y cuándo usarlo" className="card-surface flex flex-col gap-3 rounded-2xl p-5">
      {extra.i && (
        <div>
          <p className="font-body text-sm text-text-secondary">
            {parecido(extra.s)} a <span className="font-semibold text-text">{extra.i}</span>
          </p>
          <p className="mt-0.5 font-body text-xs text-text-secondary">
            Es una inspiración, no el perfume original.
          </p>
        </div>
      )}
      {extra.u && USO[extra.u] && extra.u !== 'K' && (
        <p className="font-body text-sm text-text-secondary">
          Ideal para: <span className="text-text">{USO[extra.u]}</span>
        </p>
      )}
      {similares.length > 0 && (
        <div>
          <p className="font-body text-sm text-text-secondary">Otros inspirados en lo mismo</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {similares.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/perfume/${p.id}`}
                  className="inline-block rounded-full border border-violet/25 bg-violet/10 px-3 py-1 text-xs text-text transition-colors hover:border-violet"
                >
                  {p.nombre}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
