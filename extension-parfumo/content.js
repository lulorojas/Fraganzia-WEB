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
    collapsed: false,
  };

  // Un perfume en Parfumo: /Perfumes/<Casa>/<Nombre>. Los listados no cambian
  // mucho de estructura, así que se detectan las tarjetas por esos enlaces.
  const PERFUME_HREF = /\/Perfumes\/[^/?#]+\/[^/?#]+/i;

  let settings = { ...DEFAULTS };
  let cards = []; // { el, index, text, rating, votes, year, score }
  const known = new WeakMap();
  let seq = 0;
  let applying = false;

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

  /** Sube desde cada enlace de perfume hasta el contenedor que es una sola tarjeta. */
  function findCards() {
    const links = [...document.querySelectorAll('a[href]')].filter((a) =>
      PERFUME_HREF.test(a.getAttribute('href')) && !a.closest('#pfplus-panel'));
    const seen = new Set();
    const result = [];
    for (const a of links) {
      let el = a;
      while (el.parentElement && el.parentElement !== document.body) {
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
    return result.filter((el) => parents.get(el.parentElement) > 2);
  }

  function collect() {
    const els = findCards();
    cards = els.map((el) => {
      let c = known.get(el);
      // El índice se fija la primera vez que se ve la tarjeta: es el orden original de Parfumo.
      if (!c) { c = { el, index: seq++, ...S.parseCardText(el.innerText || el.textContent) }; known.set(el, c); }
      c.text = (el.textContent || '').replace(/\s+/g, ' ');
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
      const out = document.getElementById('pfplus-count');
      if (out) out.textContent = `${shown} de ${cards.length} perfumes`;
    } finally {
      // El observer dispara por nuestros propios cambios; se libera en el próximo tick.
      setTimeout(() => { applying = false; }, 0);
    }
  }

  let t;
  const schedule = () => { clearTimeout(t); t = setTimeout(apply, 250); };

  // ---------- Panel ----------
  const field = (id, label, type, extra = '') =>
    `<label class="pf-f"><span>${label}</span><input id="pf-${id}" type="${type}" ${extra}></label>`;

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
 h4{margin:6px 0 0;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#6b7280}
 .opt{border-top:1px dashed #cbd5e1;padding-top:6px}
 button{padding:6px;border:0;border-radius:6px;background:#e5e7eb;cursor:pointer;font:inherit}
 #count{font-size:11px;color:#555}
</style>
<div class="box">
 <header id="head"><span>Parfumo+ filtros</span><span id="tog">▾</span></header>
 <div class="body" id="body">
  <div id="pfplus-count-wrap"><span id="count"></span></div>
  <label class="pf-f"><span>Ordenar por</span>
   <select id="sort">
    <option value="original">Orden original de Parfumo</option>
    <option value="rating">Valoración</option>
    <option value="votes">Cantidad de votos</option>
    <option value="year">Año</option>
    <option value="score">Puntaje estadístico (avanzado)</option>
   </select></label>
  <h4>Valoración y votos</h4>
  <div class="row"><label class="pf-f"><span>Valoración mín.</span><input id="ratingMin" type="number" step="0.1" min="0" max="10"></label>
   <label class="pf-f"><span>Valoración máx.</span><input id="ratingMax" type="number" step="0.1" min="0" max="10"></label></div>
  <div class="row"><label class="pf-f"><span>Votos mín.</span><input id="votesMin" type="number" min="0"></label>
   <label class="pf-f"><span>Votos máx.</span><input id="votesMax" type="number" min="0"></label></div>
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

  const NUM = ['yearMin', 'yearMax', 'scoreMin', 'ratingMin', 'ratingMax', 'votesMin', 'votesMax'];
  const TXT = ['include', 'exclude'];

  function bind(root) {
    const $ = (id) => root.getElementById(id);
    const sync = () => {
      $('sort').value = settings.sort;
      $('z').value = settings.z; $('zv').textContent = Number(settings.z).toFixed(2);
      $('matchAll').checked = settings.matchAll;
      TXT.forEach((k) => { $(k).value = settings[k]; });
      NUM.forEach((k) => { $(k).value = settings[k] ?? ''; });
      $('body').style.display = settings.collapsed ? 'none' : '';
      $('tog').textContent = settings.collapsed ? '▸' : '▾';
    };
    const save = () => { storage.set(settings); schedule(); };
    $('sort').onchange = (e) => { settings.sort = e.target.value; save(); };
    $('z').oninput = (e) => { settings.z = parseFloat(e.target.value); $('zv').textContent = settings.z.toFixed(2); save(); };
    $('matchAll').onchange = (e) => { settings.matchAll = e.target.checked; save(); };
    TXT.forEach((k) => { $(k).oninput = (e) => { settings[k] = e.target.value; save(); }; });
    NUM.forEach((k) => {
      $(k).oninput = (e) => { const v = e.target.value; settings[k] = v === '' ? null : S.num(v); save(); };
    });
    $('head').onclick = () => { settings.collapsed = !settings.collapsed; sync(); storage.set(settings); };
    $('reset').onclick = () => { settings = { ...DEFAULTS }; sync(); save(); };
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
    bind(buildPanel());
    apply();
    // Parfumo carga más resultados al avanzar: re-aplicar cuando cambia la lista.
    new MutationObserver(() => { if (!applying) schedule(); })
      .observe(document.body, { childList: true, subtree: true });
  }
  init();
})();
