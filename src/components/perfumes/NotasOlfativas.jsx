const GRUPOS = [
  { clave: 'notasSalida', titulo: 'Salida', detalle: 'Lo primero que se siente' },
  { clave: 'notasCorazon', titulo: 'Corazón', detalle: 'El carácter del perfume' },
  { clave: 'notasFondo', titulo: 'Fondo', detalle: 'Lo que queda en la piel' },
];

function buildFragranticaUrl(nombre) {
  // Elimina el volumen al final (ej: " 100ML", " 90ML") y codifica para URL
  const query = nombre.replace(/\s+\d+M[Ll]$/i, '').trim();
  return `https://www.fragrantica.com/search/?query=${encodeURIComponent(query)}`;
}

/** Pirámide olfativa: salida → corazón → fondo, cada nivel como chips. */
export function NotasOlfativas({ notasSalida, notasCorazon, notasFondo, nombre }) {
  const notas = { notasSalida, notasCorazon, notasFondo };
  const hayNotas = GRUPOS.some(({ clave }) => notas[clave]?.length);
  const url = nombre ? buildFragranticaUrl(nombre) : null;

  return (
    <div className="flex flex-col gap-4">
      {hayNotas && (
        <>
          <h2 className="font-display text-lg text-text">Pirámide olfativa</h2>
          <ol className="flex flex-col gap-3">
            {GRUPOS.filter(({ clave }) => notas[clave]?.length).map(({ clave, titulo, detalle }, i) => (
              <li key={clave} className="flex gap-4">
                {/* El ancho de la barra crece hacia el fondo, como una pirámide. */}
                <div className="flex w-20 shrink-0 flex-col items-center pt-1" aria-hidden="true">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-violet to-lila"
                    style={{ width: `${40 + i * 30}%` }}
                  />
                </div>
                <div>
                  <h3 className="font-body text-sm font-semibold text-text">
                    {titulo} <span className="font-normal text-text-secondary">· {detalle}</span>
                  </h3>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {notas[clave].map((nota) => (
                      <li
                        key={nota}
                        className="rounded-full border border-violet/25 bg-violet/10 px-3 py-1 text-xs text-text"
                      >
                        {nota}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-1 text-sm text-lila hover:underline"
        >
          Ver notas en Fragrantica ↗
        </a>
      )}
    </div>
  );
}
