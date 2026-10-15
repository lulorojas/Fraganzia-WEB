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

  /**
   * Cada tarjeta de Parfumo muestra UNA sola valoración: la de la métrica por la que está
   * ordenado el listado (clase av_scent, av_dur…). `o` es el orden que pide esa métrica.
   * Para combinar filtros hay que pedir el listado ordenado por cada una y unir por perfume.
   */
  const METRICAS = {
    scent: { o: 'v_desc', nombre: 'valoración' },
    dur: { o: 'd_desc', nombre: 'duración' },
    sillage: { o: 's_desc', nombre: 'estela' },
    bottle: { o: 'b_desc', nombre: 'botella' },
    pricing: { o: 'p_desc', nombre: 'precio/valor' },
  };
  const METRICAS_EXTRA = ['dur', 'sillage', 'bottle', 'pricing'];

  /** Métrica que muestra una tarjeta según la clase de su .av (av_dur → 'dur'), o null. */
  function metricaDeClase(cls) {
    const m = String(cls || '').match(/\bav_([a-z]+)/);
    return m && METRICAS[m[1]] ? m[1] : null;
  }

  /** La misma URL de listado pero ordenada por `o` (y desde la primera página). */
  function urlConOrden(href, o) {
    const h = String(href);
    return /[?&]o=[^&]*/.test(h) ? h.replace(/([?&]o=)[^&]*/, '$1' + o) : h + (h.includes('?') ? '&' : '?') + 'o=' + o;
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
    // Duración, estela, botella y precio/valor: cada una con mín/máx de valoración y mín de votos.
    // Todos los filtros activos se combinan (AND). Sin dato de esa métrica no pasa.
    for (const k of METRICAS_EXTRA) {
      const mn = f[k + 'Min'], mx = f[k + 'Max'], vm = f[k + 'VotesMin'];
      if (mn == null && mx == null && vm == null) continue;
      const d = item.m && item.m[k];
      if (!d || d.rating == null) return false;
      if (mn != null && d.rating < mn) return false;
      if (mx != null && d.rating > mx) return false;
      if (vm != null && (d.votes == null || d.votes < vm)) return false;
    }
    return true;
  }

  /** Orden: 'rating', 'votes', 'year', 'score', una métrica extra ('dur', 'sillage'…) u 'original'. */
  function sortItems(items, by) {
    const extra = METRICAS_EXTRA.includes(by);
    const key = extra ? by : { score: 'score', rating: 'rating', votes: 'votes', year: 'year' }[by];
    if (!key) return [...items].sort((a, b) => a.index - b.index);
    const val = (it) => (extra ? ((it.m && it.m[key] && it.m[key].rating) ?? null) : it[key]);
    return [...items].sort((a, b) => {
      const x = val(a), y = val(b);
      if (x === null && y === null) return a.index - b.index;
      if (x === null) return 1;
      if (y === null) return -1;
      return y - x || a.index - b.index;
    });
  }

  // ---- Paginación: Parfumo pagina con ?current_page=N ----

  /** Número de página de una URL (current_page) o null. */
  function pageOf(href) {
    const m = String(href || '').match(/[?&]current_page=(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  }

  /** Última página según los enlaces del paginador (el mayor current_page). */
  function lastPage(hrefs) {
    return Math.max(1, ...(hrefs || []).map(pageOf).filter((n) => n));
  }

  /** La misma URL del listado pero en la página n. */
  function pageUrl(href, n) {
    const h = String(href);
    return /[?&]current_page=\d+/.test(h)
      ? h.replace(/([?&]current_page=)\d+/, '$1' + n)
      : h + (h.includes('?') ? '&' : '?') + 'current_page=' + n;
  }

  /**
   * Páginas a traer, de la primera a la última, salteando la actual y las ya
   * cargadas, hasta juntar `max` páginas en total (la actual cuenta).
   */
  function pagesToLoad(current, last, loaded, max) {
    const out = [];
    let have = 1 + loaded.length;
    for (let n = 1; n <= last && have < max; n++) {
      if (n === current || loaded.includes(n)) continue;
      out.push(n);
      have++;
    }
    return out;
  }

  return { parseCardText, buildContext, statScore, passes, sortItems, num, pageOf, lastPage, pageUrl, pagesToLoad, METRICAS, METRICAS_EXTRA, metricaDeClase, urlConOrden };
});
