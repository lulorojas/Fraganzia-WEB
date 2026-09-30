// Minúsculas y sin tildes: "Lattafá" encuentra "lattafa" y al revés.
export function normalizarTexto(texto) {
  return (texto ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}
