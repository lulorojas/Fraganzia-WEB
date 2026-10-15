/* Parfumo+ — panel de filtros (valoración, votos, año, nombre) sobre los listados de Parfumo. */
(function () {
  'use strict';
  const S = window.PFStats;
  const STORE_KEY = 'pfplus';
  const DEFAULTS = {
    // Por defecto no se reordena nada: solo se filtra. El puntaje estadístico es opt-in.
    sort: 'original', z: 1.28,
    include: '', exclude: '', matchAll: false,
    yearMin: null, yearMax: null, scoreMin: null,
    ratingMin: null, ratingMax: null, votesMin: null, votesMax: null,
    // Traer las demás páginas del resultado para que los filtros valgan sobre todo.
    autoPaginas: true, maxPaginas: 50,
    collapsed: false,
  };
  // Duración, estela, botella y precio/valor: mín/máx de valoración y mín de votos de cada una.
  S.METRICAS_EXTRA.forEach((k) => { DEFAULTS[k + 'Min'] = null; DEFAULTS[k + 'Max'] = null; DEFAULTS[k + 'VotesMin'] = null; });
  const NOMBRES = { dur: 'Duración', sillage: 'Estela', bottle: 'Botella', pricing: 'Precio/valor' };
  const PAUSA_MS = 400; // entre pedidos, para no castigar a Parfumo

  // Un perfume en Parfumo: /Perfumes/<Casa>/<Nombre>. Los listados no cambian
  // mucho de estructura, así que se detectan las tarjetas por esos enlaces.
  const PERFUME_HREF = /\/Perfumes\/[^/?#]+\/[^/?#]+/i;

  let settings = { ...DEFAULTS };
  let cards = []; // { el, index, text, rating, votes, year, score }
  const known = new WeakMap();
  const seq = {}; // contador de tarjetas vistas por página
  let applying = false;
  let pager = null; // { base, current, last, loaded: [páginas traídas], cargando, detener, error }
  let resumen = '';
  let estadoUI = null; // el panel registra acá cómo repintar sus botones de carga
  // Cada tarjeta muestra una sola valoración (la de la métrica por la que está ordenado el
  // listado). Acá se acumula lo leído de cada métrica, por perfume, para poder combinarlas.
  const datos = { scent: new Map(), dur: new Map(), sillage: new Map(), bottle: new Map(), pricing: new Map() };
  let nativa = 'scent'; // métrica que muestran las tarjetas de la página abierta
  const metricas = {}; // estado de la carga de cada métrica extra: { paginas, objetivo, cargando, error }
  let parar = false;
  let cola = Promise.resolve(); // las cargas van de a una, para no saturar a Parfumo
  const encolar = (fn) => { cola = cola.then(fn).catch((e) => console.warn('Parfumo+', e)); return cola; };

  const storage = {
    get() {
      return new Promise((res) => {
        try { chrome.storage.local.get(STORE_KEY, (r) => res((r && r[STORE_KEY]) || {})); }
        catch { try { res(JSON.parse(localStorage.getItem(STORE_KEY)) || {}); } catch { res({}); } }
      });
    },
    set(v) {
      try { chrome.storage.local.set({ [STORE_KEY]: v }); }
      catch { try { localStorage.setItem(STORE_KEY, JSON.stringify(v)); } catch { /* sin persistencia */ } }
    },
  };

  /**
   * Sube desde cada enlace de perfume hasta el contenedor que es una sola tarjeta.
   * `root` es el documento (el actual o una página traída con fetch); `claseGrilla`
   * deja pasar la última página aunque tenga 1 o 2 perfumes (la grilla ya se conoce).
   */
  function findCards(root = document, claseGrilla = null) {
    const body = root.body || document.body;
    const links = [...root.querySelectorAll('a[href]')].filter((a) =>
      PERFUME_HREF.test(a.getAttribute('href')) && !a.closest('#pfplus-panel'));
    const seen = new Set();
    const result = [];
    for (const a of links) {
      let el = a;
      while (el.parentElement && el.parentElement !== body) {
        const p = el.parentElement;
        const inside = new Set([...p.querySelectorAll('a[href]')]
          .filter((x) => PERFUME_HREF.test(x.getAttribute('href')))
          .map((x) => x.getAttribute('href').split(/[?#]/)[0].toLowerCase()));
        if (inside.size > 1) break;
        el = p;
      }
      if (seen.has(el) || el === a) continue;
      // Solo listados: la tarjeta debe tener hermanas del mismo tipo.
      seen.add(el);
      result.push(el);
    }
    const parents = new Map();
    result.forEach((el) => parents.set(el.parentElement, (parents.get(el.parentElement) || 0) + 1));
    return result.filter((el) => parents.get(el.parentElement) > 2
      || (claseGrilla && el.parentElement.className === claseGrilla));
  }

  const paginaDe = (el) => Number(el.dataset.pfPage) || (pager ? pager.current : 1);

  /** Identifica al perfume por la URL de su ficha (igual en todos los listados). */
  function claveDe(el) {
    const a = [...el.querySelectorAll('a[href]')].find((x) => PERFUME_HREF.test(x.getAttribute('href')));
    return a ? a.getAttribute('href').split(/[?#]/)[0].toLowerCase() : null;
  }

  /** Lee la valoración y los votos de una tarjeta: .av (número) y .tv (votos), o el texto como respaldo. */
  function leerAv(el) {
    const av = el.querySelector('.av');
    if (av) {
      const tv = av.querySelector('.tv');
      const r = S.num(((av.firstChild && av.firstChild.textContent) || '').trim());
      return {
        metrica: S.metricaDeClase(av.className),
        rating: r !== null && r >= 0 && r <= 10 ? r : null,
        votes: tv ? S.num((tv.textContent || '').replace(/[^\d.,]/g, '')) : null,
      };
    }
    const p = S.parseCardText(el.innerText || el.textContent);
    return { metrica: null, rating: p.rating, votes: p.votes };
  }

  /** Guarda lo que muestra la tarjeta como dato de la métrica `forzada` (o la que indique su clase). */
  function registrar(el, forzada) {
    const clave = claveDe(el);
    if (!clave) return;
    const d = leerAv(el);
    const k = forzada || d.metrica || nativa;
    if (d.rating !== null) datos[k].set(clave, { rating: d.rating, votes: d.votes });
  }

  function collect() {
    const els = findCards();
    cards = els.map((el) => {
      let c = known.get(el);
      // El índice se fija la primera vez que se ve la tarjeta: página y posición en ella,
      // o sea el orden original de Parfumo aunque las páginas lleguen desordenadas.
      if (!c) {
        const p = paginaDe(el);
        c = { el, index: p * 100000 + (seq[p] = (seq[p] || 0) + 1), ...S.parseCardText(el.innerText || el.textContent) };
        known.set(el, c);
        registrar(el); // dato de la métrica que muestra esta página
      }
      c.text = (el.textContent || '').replace(/\s+/g, ' ');
      // Valoración y votos (métrica "scent") y las demás métricas, según lo que ya se cargó.
      const clave = claveDe(el);
      const sc = clave && datos.scent.get(clave);
      c.rating = sc ? sc.rating : null;
      c.votes = sc ? sc.votes : null;
      c.m = {};
      S.METRICAS_EXTRA.forEach((k) => { const d = clave && datos[k].get(clave); if (d) c.m[k] = d; });
      return c;
    });
    const ctx = S.buildContext(cards);
    cards.forEach((c) => { c.score = S.statScore(c, ctx, { z: settings.z }); });
    return ctx;
  }

  function reorder(sorted) {
    // Agrupa por padre y reubica cada tarjeta en los "huecos" que ya ocupaba el grupo.
    const byParent = new Map();
    sorted.forEach((c) => {
      const p = c.el.parentElement;
      if (!byParent.has(p)) byParent.set(p, []);
      byParent.get(p).push(c.el);
    });
    byParent.forEach((ordered, parent) => {
      const slots = cards.filter((c) => c.el.parentElement === parent)
        .map((c) => c.el)
        .sort((a, b) => (a.compareDocumentPosition(b) & 4 ? -1 : 1));
      const markers = slots.map((el) => { const m = document.createComment(''); parent.insertBefore(m, el); return m; });
      ordered.forEach((el, i) => parent.insertBefore(el, markers[i]));
      markers.forEach((m) => m.remove());
    });
  }

  function badge(c) {
    let b = c.el.querySelector(':scope > .pfplus-badge, .pfplus-badge');
    // La insignia Σ solo aparece si el usuario eligió ese orden o filtro.
    const usaPuntaje = settings.sort === 'score' || settings.scoreMin !== null;
    if (c.score === null || !usaPuntaje) { if (b) b.remove(); return; }
    if (!b) {
      b = document.createElement('div');
      b.className = 'pfplus-badge';
      b.style.cssText = 'position:absolute;top:4px;right:4px;background:#1f2937;color:#fff;font:600 11px/1 system-ui;padding:3px 6px;border-radius:999px;z-index:5;pointer-events:none';
      if (getComputedStyle(c.el).position === 'static') c.el.style.position = 'relative';
      c.el.appendChild(b);
    }
    b.textContent = 'Σ ' + c.score.toFixed(2);
    b.title = 'Puntaje estadístico (media bayesiana con cota de confianza)';
  }

  function apply() {
    if (applying) return;
    applying = true;
    try {
      collect();
      cards.forEach((c) => {
        const ok = S.passes(c, settings);
        c.el.style.display = ok ? '' : 'none';
        if (ok) badge(c);
      });
      reorder(S.sortItems(cards.filter((c) => c.el.style.display !== 'none'), settings.sort));
      const shown = cards.filter((c) => c.el.style.display !== 'none').length;
      resumen = `${shown} de ${cards.length} perfumes`;
      pintar();
    } finally {
      // El observer dispara por nuestros propios cambios; se libera en el próximo tick.
      setTimeout(() => { applying = false; }, 0);
    }
  }

  /** Texto del contador: cuántos pasan los filtros y cómo va la carga de páginas. */
  function pintar() {
    const out = document.getElementById('pfplus-count');
    if (!out) return;
    let estado = '';
    if (pager) {
      const traidas = pager.loaded.length + 1;
      if (pager.cargando) estado = `Cargando páginas… ${traidas} de ${pager.last}`;
      else if (pager.error) estado = `Se cargaron ${traidas} de ${pager.last} páginas. ${pager.error}`;
      else if (traidas >= pager.last) estado = `Resultado completo (${pager.last} ${pager.last === 1 ? 'página' : 'páginas'})`;
      else estado = `Cargadas ${traidas} de ${pager.last} páginas`;
    }
    const lineas = [resumen];
    if (estado) lineas.push(estado);
    // Carga de duración, estela, etc. y perfumes que no tienen ese dato (no pasan ese filtro).
    for (const [k, st] of Object.entries(metricas)) {
      const nom = S.METRICAS[k].nombre;
      if (st.cargando) lineas.push(`Cargando ${nom}… ${st.paginas} de ${st.objetivo}`);
      else if (st.error) lineas.push(`${nom}: ${st.error}`);
      else if (st.paginas && usaMetrica(k) && k !== 'scent') {
        const sin = cards.filter((c) => !c.m[k]).length;
        if (sin) lineas.push(`${sin} sin dato de ${nom}`);
      }
    }
    out.textContent = lineas.join('\n');
    const c = estadoUI;
    if (c) c(pager);
  }

  // ---------- Métricas: duración, estela, botella, precio/valor ----------

  const filtraMetrica = (k) => settings[k + 'Min'] != null || settings[k + 'Max'] != null || settings[k + 'VotesMin'] != null;
  const usaMetrica = (k) => filtraMetrica(k) || settings.sort === k;

  /** Métricas que hay que traer: las que se filtran u ordenan y la página abierta no muestra. */
  function metricasNecesarias() {
    const out = S.METRICAS_EXTRA.filter((k) => k !== nativa && usaMetrica(k));
    const usaValoracion = ['ratingMin', 'ratingMax', 'votesMin', 'votesMax', 'scoreMin'].some((k) => settings[k] != null)
      || ['rating', 'votes', 'score'].includes(settings.sort);
    if (usaValoracion && nativa !== 'scent') out.push('scent');
    return out;
  }

  function revisarMetricas() {
    metricasNecesarias().forEach((k) => encolar(() => cargarMetrica(k)));
  }

  /**
   * Pide el mismo listado ordenado por la métrica `k` (hasta las mismas páginas que se
   * cargaron del resultado) y guarda la valoración y los votos de cada perfume.
   */
  async function cargarMetrica(k) {
    const st = metricas[k] || (metricas[k] = { paginas: 0, objetivo: 0, cargando: false, error: null });
    const visibles = findCards();
    if (!visibles.length || parar) return;
    const cuantas = pager ? Math.min(pager.last, Math.max(settings.maxPaginas, pager.loaded.length + 1)) : 1;
    if (st.paginas >= cuantas) return;
    const claseGrilla = visibles[0].parentElement.className;
    const base = S.urlConOrden(pager ? pager.base : location.href, S.METRICAS[k].o);
    st.objetivo = cuantas; st.cargando = true; st.error = null;
    pintar();
    for (let n = st.paginas + 1; n <= cuantas; n++) {
      if (parar) break;
      try {
        const res = await fetch(S.pageUrl(base, n), { credentials: 'include' });
        if (res.status === 429 || res.status === 403) throw new Error('Parfumo limitó los pedidos; probá de nuevo en unos minutos.');
        if (!res.ok) throw new Error(`Parfumo respondió ${res.status}.`);
        const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
        const tarjetas = findCards(doc, claseGrilla).filter((el) => el.parentElement.className === claseGrilla);
        if (!tarjetas.length) throw new Error(`sin resultados en la página ${n}.`);
        tarjetas.forEach((el) => registrar(el, k));
        st.paginas = n;
      } catch (e) {
        st.error = e && e.message ? e.message : 'no se pudo cargar.';
        break;
      }
      apply();
      await dormir(PAUSA_MS);
    }
    st.cargando = false;
    apply();
  }

  // ---------- Paginación: traer las demás páginas del resultado ----------

  function detectarPaginador() {
    const links = [...document.querySelectorAll('a[href*="current_page="]')].filter((a) => !a.closest('#pfplus-panel'));
    if (!links.length) return null;
    const activo = document.querySelector('.paging .active a[href*="current_page="]');
    const current = S.pageOf(activo && activo.href) || S.pageOf(location.href) || 1;
    return { base: links[0].href, current, last: Math.max(current, S.lastPage(links.map((a) => a.href))), loaded: [], cargando: false, detener: false, error: null };
  }

  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

  /** Trae las páginas que faltan (hasta `max` en total) y las inserta en la misma grilla. */
  async function cargarPaginas(max) {
    if (!pager || pager.cargando) return;
    const pendientes = S.pagesToLoad(pager.current, pager.last, pager.loaded, max);
    if (!pendientes.length) { pintar(); return; }
    const nativas = findCards();
    if (!nativas.length) return;
    const grilla = nativas[0].parentElement;
    const claseGrilla = grilla.className;
    let ultima = nativas[nativas.length - 1]; // las páginas siguientes van después de esta
    const primera = nativas[0]; // las anteriores, antes de esta
    pager.cargando = true; pager.detener = false; pager.error = null;
    pintar();
    for (const n of pendientes) {
      if (pager.detener) break;
      try {
        const res = await fetch(S.pageUrl(pager.base, n), { credentials: 'include' });
        if (res.status === 429 || res.status === 403) throw new Error('Parfumo limitó los pedidos; probá de nuevo en unos minutos.');
        if (!res.ok) throw new Error(`Parfumo respondió ${res.status} en la página ${n}.`);
        const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
        const tarjetas = findCards(doc, claseGrilla).filter((el) => el.parentElement.className === claseGrilla);
        if (!tarjetas.length) throw new Error(`No se encontraron perfumes en la página ${n}.`);
        const frag = document.createDocumentFragment();
        tarjetas.forEach((el) => { const nodo = document.importNode(el, true); nodo.dataset.pfPage = String(n); frag.appendChild(nodo); });
        if (n < pager.current) grilla.insertBefore(frag, primera);
        else { const sig = ultima.nextSibling; const ult = frag.lastChild; grilla.insertBefore(frag, sig); ultima = ult; }
        pager.loaded.push(n);
      } catch (e) {
        pager.error = e && e.message ? e.message : 'No se pudo cargar una página.';
        break;
      }
      apply();
      await dormir(PAUSA_MS);
    }
    pager.cargando = false;
    // Con el resultado completo, el paginador de Parfumo ya no hace falta.
    if (pager.loaded.length + 1 >= pager.last) document.querySelectorAll('.paging').forEach((p) => { p.style.display = 'none'; });
    apply();
    revisarMetricas(); // ahora hay más perfumes: completar duración, estela, etc. si hace falta
  }

  let t;
  const schedule = () => { clearTimeout(t); t = setTimeout(apply, 250); };

  // ---------- Panel ----------
  const field = (id, label, type, extra = '') =>
    `<label class="pf-f"><span>${label}</span><input id="pf-${id}" type="${type}" ${extra}></label>`;

  const seccionMetricas = () => S.METRICAS_EXTRA.map((k) => `<div class="mt"><b>${NOMBRES[k]}</b><div class="row3">
    <input id="${k}Min" type="number" step="0.1" min="0" max="10" placeholder="mín." title="Valoración mínima">
    <input id="${k}Max" type="number" step="0.1" min="0" max="10" placeholder="máx." title="Valoración máxima">
    <input id="${k}VotesMin" type="number" min="0" placeholder="votos" title="Votos mínimos"></div></div>`).join('');

  function buildPanel() {
    const host = document.createElement('div');
    host.id = 'pfplus-panel';
    host.style.cssText = 'position:fixed;top:80px;right:12px;z-index:2147483000;width:260px;font:13px system-ui;';
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `
<style>
 .box{background:#fff;color:#111;border:1px solid #d1d5db;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.18);overflow:hidden}
 header{display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:#1f2937;color:#fff;font-weight:600;cursor:pointer}
 .body{padding:10px;display:grid;gap:8px;max-height:75vh;overflow:auto}
 .pf-f{display:grid;gap:2px} .pf-f span{font-size:11px;color:#555}
 input,select,textarea{width:100%;box-sizing:border-box;padding:4px 6px;border:1px solid #cbd5e1;border-radius:6px;font:inherit}
 .row{display:grid;grid-template-columns:1fr 1fr;gap:6px}
 .row3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px} .mt{display:grid;gap:2px} .mt b{font-size:12px} .nota{font-size:10.5px;color:#6b7280;margin:0}
 h4{margin:6px 0 0;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#6b7280}
 .opt{border-top:1px dashed #cbd5e1;padding-top:6px}
 button{padding:6px;border:0;border-radius:6px;background:#e5e7eb;cursor:pointer;font:inherit}
 #count{font-size:11px;color:#555;white-space:pre-line}
</style>
<div class="box">
 <header id="head"><span>Parfumo+ filtros</span><span id="tog">▾</span></header>
 <div class="body" id="body">
  <div id="pfplus-count-wrap"><span id="count"></span></div>
  <div id="paginas" style="display:none;gap:6px;border-bottom:1px dashed #cbd5e1;padding-bottom:8px">
   <label class="pf-f" style="display:flex;gap:6px;align-items:center"><input id="autoPaginas" type="checkbox" style="width:auto"><span>Traer todas las páginas del resultado</span></label>
   <div class="row"><label class="pf-f"><span>Máx. páginas</span><input id="maxPaginas" type="number" min="1" max="1000"></label>
    <div style="display:flex;align-items:end"><button id="cargarTodo" style="width:100%">Cargar todas</button></div></div>
   <button id="detener" style="display:none">Detener carga</button>
  </div>
  <label class="pf-f"><span>Ordenar por</span>
   <select id="sort">
    <option value="original">Orden original de Parfumo</option>
    <option value="rating">Valoración</option>
    <option value="votes">Cantidad de votos</option>
    <option value="year">Año</option>
    <option value="dur">Duración</option>
    <option value="sillage">Estela</option>
    <option value="bottle">Botella</option>
    <option value="pricing">Precio/valor</option>
    <option value="score">Puntaje estadístico (avanzado)</option>
   </select></label>
  <h4>Aroma: valoración y votos</h4>
  <div class="row"><label class="pf-f"><span>Valoración mín.</span><input id="ratingMin" type="number" step="0.1" min="0" max="10"></label>
   <label class="pf-f"><span>Valoración máx.</span><input id="ratingMax" type="number" step="0.1" min="0" max="10"></label></div>
  <div class="row"><label class="pf-f"><span>Votos mín.</span><input id="votesMin" type="number" min="0"></label>
   <label class="pf-f"><span>Votos máx.</span><input id="votesMax" type="number" min="0"></label></div>
  <h4>Duración, estela y más</h4>
  <p class="nota">Valoración de 0 a 10 (mín., máx.) y votos mínimos. Se combinan entre sí y con el resto de los filtros.</p>
  ${seccionMetricas()}
  <h4>Año</h4>
  <div class="row"><label class="pf-f"><span>Año desde</span><input id="yearMin" type="number"></label>
   <label class="pf-f"><span>Año hasta</span><input id="yearMax" type="number"></label></div>
  <h4>Nombre o casa</h4>
  <label class="pf-f"><span>Debe incluir (coma = varias)</span><textarea id="include" rows="2"></textarea></label>
  <label class="pf-f" style="display:flex;gap:6px;align-items:center"><input id="matchAll" type="checkbox" style="width:auto"><span>Exigir todas</span></label>
  <label class="pf-f"><span>Excluir</span><textarea id="exclude" rows="2"></textarea></label>
  <h4 class="opt">Avanzado: puntaje estadístico</h4>
  <label class="pf-f"><span>Puntaje mínimo (solo si lo usás)</span><input id="scoreMin" type="number" step="0.1"></label>
  <label class="pf-f"><span>Prudencia (z): <b id="zv"></b></span>
   <input id="z" type="range" min="0" max="2.5" step="0.05"></label>
  <button id="reset">Restablecer</button>
 </div>
</div>`;
    document.documentElement.appendChild(host);
    return root;
  }

  const NUM = ['yearMin', 'yearMax', 'scoreMin', 'ratingMin', 'ratingMax', 'votesMin', 'votesMax',
    ...S.METRICAS_EXTRA.flatMap((k) => [k + 'Min', k + 'Max', k + 'VotesMin'])];
  const TXT = ['include', 'exclude'];

  function bind(root) {
    const $ = (id) => root.getElementById(id);
    const sync = () => {
      $('sort').value = settings.sort;
      $('z').value = settings.z; $('zv').textContent = Number(settings.z).toFixed(2);
      $('matchAll').checked = settings.matchAll;
      $('autoPaginas').checked = settings.autoPaginas;
      $('maxPaginas').value = settings.maxPaginas;
      TXT.forEach((k) => { $(k).value = settings[k]; });
      NUM.forEach((k) => { $(k).value = settings[k] ?? ''; });
      $('body').style.display = settings.collapsed ? 'none' : '';
      $('tog').textContent = settings.collapsed ? '▸' : '▾';
    };
    const save = () => { parar = false; storage.set(settings); schedule(); revisarMetricas(); };
    $('sort').onchange = (e) => { settings.sort = e.target.value; save(); };
    $('z').oninput = (e) => { settings.z = parseFloat(e.target.value); $('zv').textContent = settings.z.toFixed(2); save(); };
    $('matchAll').onchange = (e) => { settings.matchAll = e.target.checked; save(); };
    TXT.forEach((k) => { $(k).oninput = (e) => { settings[k] = e.target.value; save(); }; });
    NUM.forEach((k) => {
      $(k).oninput = (e) => { const v = e.target.value; settings[k] = v === '' ? null : S.num(v); save(); };
    });
    $('autoPaginas').onchange = (e) => { settings.autoPaginas = e.target.checked; save(); if (e.target.checked) encolar(() => cargarPaginas(settings.maxPaginas)); };
    let tMax;
    $('maxPaginas').oninput = (e) => {
      const n = Math.min(1000, Math.max(1, parseInt(e.target.value, 10) || 1));
      settings.maxPaginas = n; storage.set(settings);
      clearTimeout(tMax);
      tMax = setTimeout(() => { if (settings.autoPaginas) { parar = false; encolar(() => cargarPaginas(n)); } revisarMetricas(); }, 700);
    };
    $('cargarTodo').onclick = () => {
      if (!pager) return;
      const faltan = pager.last - pager.loaded.length - 1;
      if (faltan > 50 && !confirm(`Son ${faltan} páginas más (unos ${Math.round(faltan * PAUSA_MS / 1000)} s como mínimo). ¿Cargarlas todas?`)) return;
      parar = false;
      encolar(() => cargarPaginas(pager.last));
    };
    $('detener').onclick = () => { parar = true; if (pager) pager.detener = true; };
    estadoUI = (p) => {
      $('paginas').style.display = p ? 'grid' : 'none';
      if (!p) return;
      $('detener').style.display = p.cargando || Object.values(metricas).some((m) => m.cargando) ? '' : 'none';
      $('cargarTodo').disabled = p.cargando || p.loaded.length + 1 >= p.last;
    };
    $('head').onclick = () => { settings.collapsed = !settings.collapsed; sync(); storage.set(settings); };
    $('reset').onclick = () => { settings = { ...DEFAULTS, collapsed: settings.collapsed }; sync(); save(); };
    // Contador accesible desde apply() fuera del shadow root.
    const proxy = document.createElement('span');
    proxy.id = 'pfplus-count';
    new MutationObserver(() => { $('count').textContent = proxy.textContent; })
      .observe(proxy, { childList: true, characterData: true, subtree: true });
    root.host.appendChild(proxy);
    proxy.style.display = 'none';
    sync();
  }

  async function init() {
    settings = { ...DEFAULTS, ...(await storage.get()) };
    pager = detectarPaginador();
    const primeras = findCards();
    nativa = (primeras.length && leerAv(primeras[0]).metrica) || 'scent';
    bind(buildPanel());
    apply();
    if (pager && settings.autoPaginas) encolar(() => cargarPaginas(settings.maxPaginas));
    revisarMetricas();
    // Parfumo carga más resultados al avanzar: re-aplicar cuando cambia la lista.
    new MutationObserver(() => { if (!applying) schedule(); })
      .observe(document.body, { childList: true, subtree: true });
  }
  init();
})();
