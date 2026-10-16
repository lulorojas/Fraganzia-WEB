import { useEffect, useRef, useState } from 'react';
import { webpSrc } from '../../../utils/image';

/** Tarjeta de vidrio. `i` escalona la animación de entrada (máx. 14). */
export function Card({ i = 0, className = '', style, children, ...props }) {
  return (
    <div className={`card fx ${className}`} style={{ '--i': Math.min(i, 14), ...style }} {...props}>
      {children}
    </div>
  );
}

/** Tarjeta héroe: borde con gradiente cónico girando. */
export function HeroCard({ i = 0, className = '', style, children }) {
  return (
    <div className={`hero fx ${className}`} style={{ '--i': Math.min(i, 14), ...style }}>
      <div className="hero-spin" />
      <div className="hero-in">{children}</div>
    </div>
  );
}

export function CardTitle({ Icon, children, right }) {
  return (
    <div className="card-title">
      {Icon && <span className="card-ico"><Icon /></span>}
      <span className="grow">{children}</span>
      {right}
    </div>
  );
}

export function Kpi({ label, value, tone, i = 0, format }) {
  return (
    <div className={`card small fx ${tone === 'warn' ? 'warn' : ''}`} style={{ '--i': Math.min(i, 14) }}>
      <span className="card-note">{label}</span>
      <span className="num" style={{ fontSize: 26, fontWeight: 300, color: tone === 'warn' ? '#FCD34D' : undefined }}>
        {typeof value === 'number' && format ? <Count value={value} format={format} /> : value}
      </span>
    </div>
  );
}

/** Número que sube desde 0 (ease-out quart). Con movimiento reducido salta directo. */
export function Count({ value, format = (n) => String(Math.round(n)), duration = 1500 }) {
  const [shown, setShown] = useState(0);
  const raf = useRef();

  useEffect(() => {
    const reducido = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const dur = reducido ? 600 : duration;
    const t0 = performance.now();
    const paso = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      setShown(value * (1 - (1 - p) ** 4));
      if (p < 1) raf.current = requestAnimationFrame(paso);
    };
    raf.current = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);

  return <>{format(shown)}</>;
}

const clases = { ok: 'tag-ok', warn: 'tag-warn', bad: 'tag-bad', accent: 'tag-accent', neutral: 'tag-neutral' };

export function Tag({ tone = 'accent', children, className = '' }) {
  return <span className={`tag ${clases[tone] ?? ''} ${className}`}>{children}</span>;
}

/** Control segmentado. options: [{ value, label, count }] */
export function Seg({ options, value, onChange, full = false }) {
  return (
    <div className={`seg ${full ? 'full' : ''}`} role="radiogroup">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          className={`seg-opt ${o.value === value ? 'on' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
          {o.count != null && <small>{o.count}</small>}
        </button>
      ))}
    </div>
  );
}

export function Switch({ on, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={`switch ${on ? 'on' : ''}`} onClick={onChange} />
  );
}

export function Field({ label, error, hint, className = '', children }) {
  return (
    <div className={`field ${className}`}>
      {label && <label>{label}</label>}
      {children}
      {error && <span className="field-err">{error}</span>}
      {!error && hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}

export function Thumb({ perfume, src, size = 40 }) {
  const url = src ?? perfume?.imagenes?.[0];
  const style = { width: size, height: size, borderRadius: Math.round(size / 4) };
  if (!url) return <span className="thumb" style={style} />;
  const webp = webpSrc(url);
  return (
    <picture>
      {webp && <source srcSet={webp} type="image/webp" />}
      <img className="thumb" src={url} alt="" loading="lazy" style={style} />
    </picture>
  );
}

export function Avatar({ nombre = '', socioId }) {
  const ini = nombre.split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase();
  const cls = socioId === 'luciano' ? 'luc' : socioId === 'benja' ? 'ben' : '';
  return <span className={`cell-av ${cls}`}>{ini || '?'}</span>;
}

export function Empty({ children }) {
  return <div className="adm-empty">{children}</div>;
}

export function Cargando() {
  return (
    <div className="flex justify-center py-12">
      <div className="adm-spinner" role="status" aria-label="Cargando" />
    </div>
  );
}

export function Tabla({ cols, min = 760, children, head, flush = true }) {
  return (
    <div className={`card fx ${flush ? 'flush' : ''}`} style={{ '--i': 2 }}>
      <div className="tbl-scroll">
        <div className="tbl" style={{ '--cols': cols, '--min': `${min}px` }}>
          {head && <div className="tr head">{head.map((h, i) => <span key={i} className={h.right ? 'right' : ''}>{h.label ?? h}</span>)}</div>}
          {children}
        </div>
      </div>
    </div>
  );
}
