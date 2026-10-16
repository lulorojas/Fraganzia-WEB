// FNV-1a de 32 bits en hexadecimal. Nombre corto y estable para un texto
// (se usa para nombrar las fotos localizadas a partir de su URL original).
// Lo comparten la web y tools/localizar-imagenes.mjs: tienen que dar lo mismo.
export function hashTexto(texto) {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}
