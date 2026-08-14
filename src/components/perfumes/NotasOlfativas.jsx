function Grupo({ titulo, notas }) {
  if (!notas?.length) return null;
  return (
    <div>
      <h3 className="font-luxury text-sm text-text-secondary">{titulo}</h3>
      <p className="font-body text-text">{notas.join(', ')}</p>
    </div>
  );
}

function buildFragranticaUrl(nombre) {
  // Elimina el volumen al final (ej: " 100ML", " 90ML") y codifica para URL
  const query = nombre.replace(/\s+\d+M[Ll]$/i, '').trim();
  return `https://www.fragrantica.com/search/?query=${encodeURIComponent(query)}`;
}

export function NotasOlfativas({ notasSalida, notasCorazon, notasFondo, nombre }) {
  const hayNotas = notasSalida?.length || notasCorazon?.length || notasFondo?.length;
  const url = nombre ? buildFragranticaUrl(nombre) : null;

  return (
    <div className="flex flex-col gap-3">
      {hayNotas ? (
        <>
          <Grupo titulo="Notas de salida" notas={notasSalida} />
          <Grupo titulo="Notas de corazón" notas={notasCorazon} />
          <Grupo titulo="Notas de fondo" notas={notasFondo} />
        </>
      ) : null}
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-lila hover:underline"
        >
          Ver notas en Fragrantica ↗
        </a>
      )}
    </div>
  );
}
