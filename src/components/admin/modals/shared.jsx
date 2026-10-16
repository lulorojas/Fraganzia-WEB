import { useMemo, useState } from 'react';
import { Search, X, Minus, Plus } from 'lucide-react';
import { Seg, Thumb } from '../ui/kit';
import { SOCIOS } from '../../../constants';
import { formatARS } from '../../../utils/format';

/** Marco común de todos los formularios: ícono, título, cuerpo con scroll. */
export function ModalShell({ Icon, title, sub, onClose, children }) {
  return (
    <div className="adm-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="adm-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="adm-modal-head">
          {Icon && <span className="card-ico" style={{ width: 36, height: 36, borderRadius: 12 }}><Icon /></span>}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2>{title}</h2>
            {sub && <p>{sub}</p>}
          </div>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Cerrar"><X /></button>
        </div>
        <div className="adm-modal-body">{children}</div>
      </div>
    </div>
  );
}

export function SocioSeg({ value, onChange }) {
  return <Seg full value={value} onChange={onChange} options={SOCIOS.map((s) => ({ value: s.id, label: s.nombre }))} />;
}

export function MetodoSeg({ value, onChange }) {
  return (
    <Seg full value={value} onChange={onChange} options={[
      { value: 'efectivo', label: 'Efectivo' },
      { value: 'mercadopago', label: 'Mercado Pago' },
    ]} />
  );
}

export function TotalBar({ label, monto }) {
  return (
    <div className="total-bar">
      <span className="dim">{label}</span>
      <span className="num" style={{ fontSize: 26, fontWeight: 300 }}>{formatARS(monto)}</span>
    </div>
  );
}

export function Stepper({ value, onChange, min = 1, max = Infinity }) {
  return (
    <span className="stepper">
      <button type="button" aria-label="Menos" disabled={value <= min} onClick={() => onChange(value - 1)}><Minus size={13} /></button>
      <b>{value}</b>
      <button type="button" aria-label="Más" disabled={value >= max} onClick={() => onChange(value + 1)}><Plus size={13} /></button>
    </span>
  );
}

/**
 * Selector de perfumes: las líneas ya agregadas arriba, el buscador y los
 * resultados debajo. `items` = [{ perfumeId, perfumeNombre, cantidad, precioUnitario? }].
 *
 * - `stock` (mapa perfumeId → unidades): limita la cantidad y muestra "quedan N".
 * - `priced`: cada línea lleva su precio unitario editable.
 * - `multi=false`: elegir otro perfume reemplaza al anterior.
 */
export function PerfumePicker({
  perfumes, items, onChange, stock, priced = false, multi = true, precioInicial, hint, vacio = 'Sin resultados.',
}) {
  const [q, setQ] = useState('');
  const porId = useMemo(() => new Map((perfumes ?? []).map((p) => [p.id, p])), [perfumes]);

  const resultados = useMemo(() => {
    const t = q.trim().toLowerCase();
    const yaAgregados = new Set(items.map((i) => i.perfumeId));
    return (perfumes ?? [])
      .filter((p) => multi ? !yaAgregados.has(p.id) : true)
      .filter((p) => !t || p.nombre?.toLowerCase().includes(t) || p.marca?.toLowerCase().includes(t))
      .slice(0, 12);
  }, [perfumes, items, q, multi]);

  function agregar(p) {
    const linea = {
      perfumeId: p.id,
      perfumeNombre: p.nombre,
      cantidad: 1,
      ...(priced ? { precioUnitario: precioInicial?.(p) ?? '' } : {}),
    };
    onChange(multi ? [...items, linea] : [linea]);
    setQ('');
  }

  const actualizar = (id, cambios) => onChange(items.map((i) => (i.perfumeId === id ? { ...i, ...cambios } : i)));

  return (
    <div className="flex flex-col gap-2">
      {items.length > 0 && (
        <div className="pick-lines">
          {items.map((it) => {
            const p = porId.get(it.perfumeId);
            const disponible = stock ? (stock[it.perfumeId] ?? 0) : Infinity;
            return (
              <div key={it.perfumeId} className="pick-line">
                <Thumb perfume={p} size={36} />
                <div className="grow">
                  <div className="ell" style={{ fontWeight: 500 }}>{it.perfumeNombre}</div>
                  <div className="card-note">
                    {p?.marca}{stock ? ` · quedan ${disponible}` : ''}
                  </div>
                </div>
                <Stepper value={Number(it.cantidad) || 1} max={disponible} onChange={(n) => actualizar(it.perfumeId, { cantidad: n })} />
                {priced && (
                  <label className="flex items-center gap-1 card-note">
                    c/u $
                    <input
                      className="price-in" inputMode="numeric" aria-label={`Precio de ${it.perfumeNombre}`}
                      value={it.precioUnitario ?? ''}
                      onChange={(e) => actualizar(it.perfumeId, { precioUnitario: e.target.value.replace(/[^\d.]/g, '') })}
                    />
                  </label>
                )}
                <button type="button" className="btn btn-ghost btn-icon btn-bad" aria-label="Quitar" onClick={() => onChange(items.filter((i) => i.perfumeId !== it.perfumeId))}>
                  <X size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="input-wrap">
        <Search />
        <input className="input" placeholder={multi && items.length ? 'Agregar otro perfume…' : 'Buscar perfume…'} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {hint && <span className="field-hint">{hint}</span>}
      {(q || items.length === 0 || multi) && (
        <div className="pick-results">
          {resultados.length === 0 ? (
            <div className="adm-empty" style={{ padding: 14 }}>{vacio}</div>
          ) : resultados.map((p) => (
            <button key={p.id} type="button" className="pick-opt" onClick={() => agregar(p)}>
              <Thumb perfume={p} size={32} />
              <span className="ell" style={{ flex: 1 }}>
                <span style={{ fontWeight: 500 }}>{p.nombre}</span>
                <span className="card-note"> · {p.marca}</span>
              </span>
              {stock && <span className="card-note">{stock[p.id] ?? 0} en stock</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
