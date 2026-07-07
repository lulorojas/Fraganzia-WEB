function Grupo({ titulo, notas }) {
  if (!notas?.length) return null;
  return (
    <div>
      <h3 className="font-luxury text-sm text-text-secondary">{titulo}</h3>
      <p className="font-body text-text">{notas.join(', ')}</p>
    </div>
  );
}

export function NotasOlfativas({ notasSalida, notasCorazon, notasFondo }) {
  return (
    <div className="flex flex-col gap-3">
      <Grupo titulo="Notas de salida" notas={notasSalida} />
      <Grupo titulo="Notas de corazón" notas={notasCorazon} />
      <Grupo titulo="Notas de fondo" notas={notasFondo} />
    </div>
  );
}
