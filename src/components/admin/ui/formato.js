const nf = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });

/** $ 1.385 — con signo menos real para negativos. */
export function pesos(valor) {
  const v = Math.round(valor || 0);
  return `${v < 0 ? '−' : ''}$ ${nf.format(Math.abs(v))}`;
}

/** Para ejes de gráficos: $ 100k, $ 1,2M. */
export function corto(valor) {
  if (valor >= 1e6) return `$ ${(valor / 1e6).toLocaleString('es-AR', { maximumFractionDigits: 2 })}M`;
  if (valor >= 1000) return `$ ${Math.round(valor / 1000)}k`;
  return `$ ${Math.round(valor)}`;
}

export function pl(n, singular, plural) {
  return `${n} ${n === 1 ? singular : plural}`;
}

export function iniciales(nombre = '') {
  return nombre.split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase();
}
