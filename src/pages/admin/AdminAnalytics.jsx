import { useMemo, useState } from 'react';
import { Trophy, LineChart } from 'lucide-react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useUsuarios } from '../../hooks/useUsuarios';
import { useInteresClientes } from '../../hooks/useInteresClientes';
import {
  calcularResumenMensual, mesesRecientes, rankingPerfumesDelMes, rankingDecantsDelMes, decantsPorTamanoDelMes,
  variacionPct,
} from '../../services/analyticsCalculos';
import { SOCIOS } from '../../constants';
import { formatFecha, diaMes } from '../../utils/format';
import {
  PerfumesMasVistos, MasGuardados, MasBuscados, BusquedasSinResultado, BajaConversion,
} from '../../components/admin/panel/InteresClientes';
import { Card, CardTitle, Count, Kpi, Seg, Tag, Avatar, Cargando, Empty } from '../../components/admin/ui/kit';
import { corto, pesos, pl } from '../../components/admin/ui/formato';

const Titulo = ({ children, sub }) => (
  <div className="flex flex-col gap-1" style={{ marginTop: 8 }}>
    <h2 style={{ margin: 0, fontFamily: 'Outfit', fontSize: 21, fontWeight: 400, letterSpacing: '-.01em' }}>{children}</h2>
    {sub && <span className="card-note">{sub}</span>}
  </div>
);

function Fila({ etiqueta, valor, signo, fuerte }) {
  return (
    <div className="flex items-baseline justify-between gap-3" style={{ padding: '5px 0' }}>
      <span className={fuerte ? '' : 'dim'}>{signo && <span className="faint">{signo} </span>}{etiqueta}</span>
      <span className="num" style={{ fontWeight: fuerte ? 500 : 400, fontSize: fuerte ? 17 : 14 }}>{valor}</span>
    </div>
  );
}

/** Línea de 6 meses con puntos clickeables. */
function LineaVentas({ meses, seleccion, onElegir }) {
  const max = Math.max(1, ...meses.map((m) => m.vendido));
  const top = 36;
  const alto = 230;
  const pos = (m, i) => ({
    x: 7 + (i / Math.max(1, meses.length - 1)) * 86,
    y: top + (1 - m.vendido / max) * (alto - top - 26),
  });
  const puntos = meses.map(pos);
  const linea = puntos.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ');
  const area = `${linea} L ${puntos[puntos.length - 1].x} ${alto - 26} L ${puntos[0].x} ${alto - 26} Z`;
  const iSel = meses.findIndex((m) => m.clave === seleccion);

  return (
    <div style={{ position: 'relative', height: alto }}>
      <svg viewBox={`0 0 100 ${alto}`} preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }} aria-hidden="true">
        <defs>
          <linearGradient id="area-ventas" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#C084FC" stopOpacity=".28" /><stop offset="1" stopColor="#C084FC" stopOpacity="0" />
          </linearGradient>
        </defs>
        {iSel >= 0 && <line x1={puntos[iSel].x} x2={puntos[iSel].x} y1={top - 6} y2={alto - 26} stroke="rgba(192,132,252,.45)" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />}
        <g className="reveal-x">
          <path d={area} fill="url(#area-ventas)" />
          <path d={linea} fill="none" stroke="#C084FC" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ filter: 'drop-shadow(0 0 6px rgba(192,132,252,.8))' }} />
        </g>
      </svg>
      {meses.map((m, i) => {
        const activo = m.clave === seleccion;
        return (
          <button
            key={m.clave}
            onClick={() => onElegir(m.clave)}
            aria-label={`${m.label}: ${pesos(m.vendido)}`}
            style={{ position: 'absolute', left: `${puntos[i].x}%`, top: puntos[i].y, width: 36, height: 36, transform: 'translate(-50%,-50%)', border: 0, background: 'transparent', display: 'grid', placeItems: 'center' }}
          >
            <span style={{ position: 'absolute', bottom: 24, whiteSpace: 'nowrap', fontSize: 11.5, color: activo ? '#E9D5FF' : 'var(--a-dim)', fontWeight: activo ? 600 : 400 }}>{corto(m.vendido)}</span>
            <span style={{ width: activo ? 14 : 9, height: activo ? 14 : 9, borderRadius: '50%', background: activo ? '#E9D5FF' : '#C084FC', boxShadow: activo ? '0 0 0 4px rgba(192,132,252,.35), 0 0 18px #C084FC' : '0 0 8px #C084FC', transition: 'all .25s' }} />
          </button>
        );
      })}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 18 }}>
        {meses.map((m, i) => (
          <span key={m.clave} style={{ position: 'absolute', left: `${puntos[i].x}%`, transform: 'translateX(-50%)', fontSize: 12, color: m.clave === seleccion ? '#E9D5FF' : 'var(--a-faint)' }}>{m.corto}</span>
        ))}
      </div>
    </div>
  );
}

export default function AdminAnalytics() {
  const { data, isLoading } = useAnalytics();
  const { usuarios, isLoading: cargandoUsuarios } = useUsuarios();
  const { data: interes } = useInteresClientes();

  const meses = useMemo(() => mesesRecientes(6), []);
  const [seleccion, setSeleccion] = useState(meses[meses.length - 1].clave);

  const resumen = useMemo(
    () => (data ? calcularResumenMensual(data.movimientos, meses) : []),
    [data, meses]
  );
  const iMes = resumen.findIndex((m) => m.clave === seleccion);
  const mes = resumen[iMes];
  const anterior = iMes > 0 ? resumen[iMes - 1] : null;
  const delta = anterior ? variacionPct(mes?.vendido ?? 0, anterior.vendido) : null;

  const rankingPerfumes = useMemo(() => (data ? rankingPerfumesDelMes(data.movimientos.ventasSocios, seleccion) : []), [data, seleccion]);
  const rankingDecants = useMemo(() => (data ? rankingDecantsDelMes(data.movimientos.ventasDecants, seleccion) : []), [data, seleccion]);
  const porTamano = useMemo(() => (data ? decantsPorTamanoDelMes(data.movimientos.ventasDecants, seleccion) : []), [data, seleccion]);

  if (isLoading || !mes) return <Cargando />;

  const maxGanancia = Math.max(1, ...resumen.map((m) => Math.abs(m.gananciaPorSocio)));
  const maxTamano = Math.max(1, ...porTamano.map((t) => t.unidades));
  const compras = data.gananciaPorCompra;

  // Clientes (pedidos de la tienda)
  const nuevos = usuarios.filter((u) => u.totalPedidos === 1).length;
  const recurrentes = usuarios.filter((u) => u.totalPedidos > 1).length;
  const facturacion = usuarios.reduce((a, u) => a + u.totalGastado, 0);
  const maxGastado = Math.max(1, ...usuarios.map((u) => u.totalGastado));

  return (
    <div className="adm-stack" style={{ gap: 20 }}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="label">Mes</span>
        <Seg value={seleccion} onChange={setSeleccion} options={meses.map((m) => ({ value: m.clave, label: m.corto }))} />
      </div>

      {/* 1 — Ganancia */}
      <Titulo sub="Vendido, menos lo que costó la mercadería que se vendió y los gastos del mes, dividido entre los dos.">
        ¿Cuánto ganó cada socio en {mes.nombre}?
      </Titulo>
      <div className="adm-row">
        <div className="hero fx" style={{ flex: '1.3 1 400px', '--i': 0 }}>
          <div className="hero-spin" />
          <div className="hero-in">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {SOCIOS.map((s) => (
                <div key={s.id}>
                  <span className="dim">{s.nombre} ganó</span>
                  <div className="big ok-text" style={{ fontSize: 40, color: mes.gananciaPorSocio < 0 ? '#FCA5A5' : undefined, textShadow: mes.gananciaPorSocio < 0 ? 'none' : undefined }}>
                    <Count value={mes.gananciaPorSocio} format={pesos} />
                  </div>
                </div>
              ))}
            </div>
            <span className="line" />
            <div>
              <Fila etiqueta={`Vendido (${pl(mes.perfumes.unidades, 'perfume', 'perfumes')} + ${pl(mes.decants.unidades, 'decant', 'decants')})`} valor={pesos(mes.vendido)} />
              <Fila signo="−" etiqueta="Lo que costó la mercadería vendida" valor={pesos(mes.costo)} />
              <Fila signo="−" etiqueta="Gastos del mes" valor={pesos(mes.gastos)} />
              <Fila signo="=" etiqueta="Ganancia del negocio" valor={pesos(mes.gananciaNegocio)} fuerte />
              <Fila signo="÷" etiqueta="2 socios" valor={`${pesos(mes.gananciaPorSocio)} cada uno`} fuerte />
            </div>
            <span className="card-note">Los decants suman sin costo: salen de frascos que ya están contados en sus compras.</span>
          </div>
        </div>

        <Card i={1} style={{ flex: '1 1 300px' }}>
          <CardTitle Icon={Trophy}>Ganancia neta de cada socio, mes a mes</CardTitle>
          <div className="flex items-end gap-2" style={{ height: 190 }}>
            {resumen.map((m, i) => {
              const activo = m.clave === seleccion;
              return (
                <button key={m.clave} onClick={() => setSeleccion(m.clave)} className="flex flex-1 flex-col items-center justify-end gap-1" style={{ height: '100%', border: 0, background: 'transparent', minWidth: 0 }}>
                  <span style={{ fontSize: 11, color: activo ? '#E9D5FF' : 'var(--a-dim)' }}>{corto(m.gananciaPorSocio)}</span>
                  <span className="grow-y" style={{ '--i': i, width: '100%', height: `${Math.max(3, (Math.abs(m.gananciaPorSocio) / maxGanancia) * 140)}px`, borderRadius: '6px 6px 2px 2px', background: m.gananciaPorSocio < 0 ? 'linear-gradient(180deg,#EF4444,#7f1d1d)' : activo ? 'linear-gradient(180deg,#E9D5FF,#9B59D0)' : 'linear-gradient(180deg,#9B59D0,#4a1f80)', boxShadow: activo ? '0 0 18px rgba(192,132,252,.6)' : 'none' }} />
                  <span style={{ fontSize: 12, color: activo ? '#E9D5FF' : 'var(--a-faint)' }}>{m.corto}</span>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* 2 — Ventas */}
      <Titulo sub="Facturación pura, sin descontar costos ni gastos: cuánto stock estamos moviendo.">¿Cuánto vendimos?</Titulo>
      <div className="adm-row">
        <Card i={2} style={{ flex: '2 1 460px' }}>
          <CardTitle Icon={LineChart}>Vendido en los últimos 6 meses</CardTitle>
          <LineaVentas meses={resumen} seleccion={seleccion} onElegir={setSeleccion} />
        </Card>
        <Card i={3} style={{ flex: '1 1 240px' }}>
          <span className="label">{mes.label}</span>
          <span className="big"><Count value={mes.vendido} format={pesos} /></span>
          {delta != null && <div><Tag tone={delta >= 0 ? 'accent' : 'warn'}>{delta >= 0 ? '+' : ''}{Math.round(delta)}% vs {anterior.nombre}</Tag></div>}
          <span className="line" />
          <Fila etiqueta={pl(mes.perfumes.unidades, 'perfume', 'perfumes')} valor={pesos(mes.perfumes.monto)} />
          <Fila etiqueta={pl(mes.decants.unidades, 'decant', 'decants')} valor={pesos(mes.decants.monto)} />
        </Card>
      </div>

      <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
        <Card i={4}>
          <CardTitle>Qué vendió cada socio en {mes.nombre}</CardTitle>
          {SOCIOS.map((s) => {
            const x = mes.porSocio[s.id];
            return (
              <div key={s.id} className="flex flex-col gap-1">
                <div className="flex items-center gap-2"><Avatar nombre={s.nombre} socioId={s.id} /><span style={{ fontWeight: 500, flex: 1 }}>{s.nombre}</span><span className="num" style={{ fontWeight: 500 }}>{pesos(x.perfumes.monto + x.decants.monto)}</span></div>
                <Fila etiqueta={`Perfumes · ${pl(x.perfumes.unidades, 'u.', 'u.')}`} valor={pesos(x.perfumes.monto)} />
                <Fila etiqueta={`Decants · ${pl(x.decants.unidades, 'u.', 'u.')}`} valor={pesos(x.decants.monto)} />
              </div>
            );
          })}
        </Card>

        <Card i={5}>
          <CardTitle>Perfumes más vendidos</CardTitle>
          {!rankingPerfumes.length ? <Empty>Sin ventas de perfumes en {mes.nombre}.</Empty> : rankingPerfumes.slice(0, 6).map((p, n) => (
            <div key={p.perfumeId} className="list-row">
              <span className="faint num" style={{ width: 16 }}>{n + 1}</span>
              <span className="ell" style={{ flex: 1 }}>{p.nombre}</span>
              <span className="card-note">{pl(p.unidades, 'u.', 'u.')}</span>
              <span className="num" style={{ fontWeight: 500, minWidth: 84, textAlign: 'right' }}>{pesos(p.monto)}</span>
            </div>
          ))}
        </Card>

        <Card i={6}>
          <CardTitle>Decants más vendidos</CardTitle>
          {!rankingDecants.length ? <Empty>Sin decants vendidos en {mes.nombre}.</Empty> : rankingDecants.slice(0, 6).map((p, n) => (
            <div key={p.perfumeId} className="list-row">
              <span className="faint num" style={{ width: 16 }}>{n + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}><div className="ell">{p.nombre}</div><div className="card-note">{pl(p.unidades, 'u.', 'u.')} · más pedido: {p.tamanoTop}</div></div>
              <span className="num" style={{ fontWeight: 500 }}>{pesos(p.monto)}</span>
            </div>
          ))}
        </Card>

        <Card i={7}>
          <CardTitle>Decants vendidos por tamaño</CardTitle>
          {!porTamano.length ? <Empty>Sin decants vendidos en {mes.nombre}.</Empty> : porTamano.map((t, idx) => (
            <div key={t.tamano} className="flex flex-col gap-1">
              <div className="flex justify-between"><span>{t.tamano}</span><span className="num dim">{pl(t.unidades, 'u.', 'u.')} · {pesos(t.monto)}</span></div>
              <div className="bar"><span className="grow-x" style={{ '--i': idx, width: `${(t.unidades / maxTamano) * 100}%`, background: 'linear-gradient(90deg,#a21caf,#F0ABFC)' }} /></div>
            </div>
          ))}
        </Card>

        <Card i={8} style={{ gridColumn: '1 / -1' }}>
          <CardTitle>Ganancia de cada compra</CardTitle>
          <span className="card-note">Cuánto costó cada compra, cuánto de lo comprado ya se vendió y cuánto se ganó con eso (se vende primero lo que se compró primero).</span>
          {!compras.detalle.length ? <Empty>Todavía no hay compras.</Empty> : (
            <div className="tbl-scroll">
              <div className="tbl" style={{ '--cols': 'minmax(180px,1.5fr) 110px 150px 120px', '--min': '560px' }}>
                <div className="tr head"><span>Compra</span><span className="right">Costó</span><span>% vendido</span><span className="right">Ganancia</span></div>
                {compras.detalle.slice().reverse().map((c) => {
                  const pct = c.unidades ? Math.min(100, (c.unidadesVendidas / c.unidades) * 100) : 0;
                  return (
                    <div key={c.compraId} className="tr">
                      <div style={{ minWidth: 0 }}><div className="ell">{c.proveedor}</div><div className="card-note">{diaMes(c.fecha)} · {pl(c.unidades, 'perfume', 'perfumes')}</div></div>
                      <span className="num right">{pesos(c.montoTotal)}</span>
                      <div className="flex items-center gap-2"><div className="bar" style={{ flex: 1 }}><span style={{ width: `${pct}%` }} /></div><span className="card-note num">{Math.round(pct)}%</span></div>
                      <span className="num right" style={{ fontWeight: 500, color: c.ganancia >= 0 ? '#6EE7B7' : '#FCA5A5' }}>{pesos(c.ganancia)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {compras.unidadesSinCosto > 0 && (
            <div className="notice info">
              {pl(compras.unidadesSinCosto, 'unidad vendida', 'unidades vendidas')} salieron de stock cargado a mano (sin costo conocido): no entran en la ganancia de ninguna compra.
            </div>
          )}
        </Card>
      </div>

      {/* 3 — Clientes */}
      <Titulo sub="Los clientes que hicieron pedidos desde la tienda.">¿Quiénes nos compran?</Titulo>
      {cargandoUsuarios ? <Cargando /> : (
        <>
          <div className="grid-auto">
            <Kpi i={0} label="Clientes" value={usuarios.length} />
            <Kpi i={1} label="Compraron 1 vez" value={nuevos} />
            <Kpi i={2} label="Volvieron a comprar" value={recurrentes} />
            <Kpi i={3} label="Facturación total" value={pesos(facturacion)} />
          </div>
          <Card i={4} className="flush" style={{ gap: 0 }}>
            <div className="tbl-scroll">
              <div className="tbl" style={{ '--cols': 'minmax(220px,1.6fr) 110px minmax(180px,1.2fr) 110px', '--min': '680px' }}>
                <div className="tr head"><span>Cliente</span><span>Tipo</span><span>Pedidos · gastó</span><span>Primera compra</span></div>
                {usuarios.map((u) => (
                  <div key={u.email} className="tr">
                    <div className="flex min-w-0 items-center gap-[10px]">
                      <Avatar nombre={u.nombre} />
                      <div className="min-w-0"><div className="ell" style={{ fontWeight: 500 }}>{u.nombre}</div><div className="faint ell" style={{ fontSize: 12 }}>{u.email}</div></div>
                    </div>
                    <span><Tag tone={u.totalPedidos > 1 ? 'accent' : 'ok'}>{u.totalPedidos > 1 ? 'Recurrente' : 'Nuevo'}</Tag></span>
                    <div><div className="flex justify-between"><span className="dim">{pl(u.totalPedidos, 'pedido', 'pedidos')}</span><span className="num">{pesos(u.totalGastado)}</span></div><div className="bar" style={{ marginTop: 4 }}><span style={{ width: `${(u.totalGastado / maxGastado) * 100}%` }} /></div></div>
                    <span className="dim">{formatFecha(u.primerPedido)}</span>
                  </div>
                ))}
              </div>
            </div>
            {!usuarios.length && <Empty>Todavía no hay clientes con pedidos.</Empty>}
          </Card>
        </>
      )}

      {/* 4 — Interés */}
      <Titulo sub="Se registra desde el sitio público: los números se acumulan con el tráfico.">¿Qué miran y buscan en la tienda?</Titulo>
      <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
        <PerfumesMasVistos i={0} perfumes={interes?.masVistos} />
        <MasGuardados i={1} perfumes={interes?.masFavoritos} />
        <MasBuscados i={2} terminos={interes?.masBuscados} />
        <BusquedasSinResultado i={3} terminos={interes?.sinResultado} />
        <BajaConversion i={4} perfumes={interes?.bajaConversion} />
      </div>
    </div>
  );
}
