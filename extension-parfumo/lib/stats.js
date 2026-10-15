/*
 * Lógica pura (sin DOM) de Parfumo+. Funciona en el navegador (window.PFStats)
 * y en Node (module.exports) para poder probarla con `npm run test:bot`.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PFStats = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const num = (s) => {
    let t = String(s).trim();
    // "1.234" / "1,234" son miles; "7,8" / "7.8" son decimales.
    if (/^\d{1,3}([.,]\d{3})+$/.test(t)) t = t.replace(/[.,]/g, '');
    else t = t.replace(',', '.');
    const n = parseFloat(t);
    return Number.isFinite(n) ? n : null;
  };

  const ANIO = '19[0-9]{2}|20[0-4][0-9]';

  /**
   * Extrae valoración (0-10), votos y año del texto de una tarjeta.
   * Formato real de Parfumo: "Khamrah (2022) 7.9 4791" (año entre paréntesis,
   * después la valoración y los votos). La vista de lista suma "288 Reviews",
   * que son reseñas escritas y no votos.
   */
  function parseCardText(text) {
    let t = String(text || '').replace(/\s+/g, ' ');
    const y = t.match(new RegExp('\\(\\s*(' + ANIO + ')\\s*\\)')) || t.match(new RegExp('\\b(' + ANIO + ')\\b'));
    const year = y ? parseInt(y[1], 10) : null;
    // Sin el año ni las reseñas queda: nombre + valoración + votos.
    t = t.replace(new RegExp('\\(\\s*(?:' + ANIO + ')\\s*\\)', 'g'), ' ')
      .replace(/[\d.,]+\s*(?:reviews?|reseñas?|rezensionen)\b/gi, ' ')
      .replace(/\s+/g, ' ');
    let rating = null;
    let votes = null;
    const r = t.match(/(?:^|[^\d.,])(10(?:[.,]0+)?|\d[.,]\d{1,2})(?![\d.,])/);
    if (r) {
      const n = num(r[1]);
      if (n !== null && n >= 0 && n <= 10) {
        rating = n;
        const despues = t.slice(r.index + r[0].length).match(/^\s*(\d[\d.,]*)/);
        if (despues) votes = num(despues[1]);
      }
    }
    if (votes === null) {
      const v = t.match(/([\d.,]+)\s*(?:ratings?|votes?|votos?|valoraciones|bewertungen)\b/i);
      if (v) votes = num(v[1]);
    }
    return { rating, votes, year };
  }

  const mean = (a) => a.reduce((s, x) => s + x, 0) / (a.length || 1);
  const median = (a) => {
    if (!a.length) return 0;
    const s = [...a].sort((x, y) => x - y);
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };

  /**
   * Contexto del conjunto visible: media global C y peso previo m
   * (mediana de votos). Es el prior de la media bayesiana.
   */
  function buildContext(items) {
    const rated = items.filter((i) => i.rating !== null);
    const C = rated.length ? mean(rated.map((i) => i.rating)) : 7;
    const m = Math.max(1, median(rated.map((i) => i.votes || 0)));
    return { C, m };
  }

  /**
   * Puntaje estadístico: cota inferior de confianza sobre la media bayesiana.
   *   bayes = (v·R + m·C) / (v + m)
   *   score = bayes − z · σ / √(v + m)
   * Un 9.5 con 3 votos queda debajo de un 8.4 con 900, sin fijar un umbral
   * de votos ni usar "valoración × cantidad".
   */
  function statScore(item, ctx, opts) {
    const o = Object.assign({ z: 1.28, sigma: 1.6 }, opts);
    if (item.rating === null) return null;
    const v = item.votes === null || item.votes === undefined ? 0 : item.votes;
    const bayes = (v * item.rating + ctx.m * ctx.C) / (v + ctx.m);
    return bayes - (o.z * o.sigma) / Math.sqrt(v + ctx.m);
  }

  const splitWords = (s) => String(s || '').toLowerCase().split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean);

  /** Aplica filtros. Valoración y votos son opcionales (null = sin límite). */
  function passes(item, f) {
    const hay = (item.text || '').toLowerCase();
    const inc = splitWords(f.include);
    const exc = splitWords(f.exclude);
    if (inc.length && !inc[f.matchAll ? 'every' : 'some']((w) => hay.includes(w))) return false;
    if (exc.some((w) => hay.includes(w))) return false;
    if (f.yearMin != null && (item.year === null || item.year < f.yearMin)) return false;
    if (f.yearMax != null && (item.year === null || item.year > f.yearMax)) return false;
    if (f.scoreMin != null && (item.score === null || item.score < f.scoreMin)) return false;
    if (f.ratingMin != null && (item.rating === null || item.rating < f.ratingMin)) return false;
    if (f.ratingMax != null && (item.rating === null || item.rating > f.ratingMax)) return false;
    if (f.votesMin != null && (item.votes === null || item.votes < f.votesMin)) return false;
    if (f.votesMax != null && (item.votes === null || item.votes > f.votesMax)) return false;
    return true;
  }

  /** Orden: 'score' (default), 'rating', 'votes', 'year', 'original'. */
  function sortItems(items, by) {
    const key = { score: 'score', rating: 'rating', votes: 'votes', year: 'year' }[by];
    if (!key) return [...items].sort((a, b) => a.index - b.index);
    return [...items].sort((a, b) => {
      const x = a[key], y = b[key];
      if (x === null && y === null) return a.index - b.index;
      if (x === null) return 1;
      if (y === null) return -1;
      return y - x || a.index - b.index;
    });
  }

  return { parseCardText, buildContext, statScore, passes, sortItems, num };
});
