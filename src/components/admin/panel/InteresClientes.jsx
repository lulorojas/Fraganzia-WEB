import { Eye, Search, SearchX, MousePointerClick } from 'lucide-react';
import { Card, CardTitle, Empty } from '../ui/kit';

function Lista({ items, vacio, render }) {
  if (!items?.length) return <Empty>{vacio}</Empty>;
  return (
    <ol className="flex flex-col" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
      {items.map((item, i) => (
        <li key={item.perfumeId ?? item.id ?? i} className="list-row">{render(item, i)}</li>
      ))}
    </ol>
  );
}

function Panel({ i, Icon, titulo, sub, children }) {
  return (
    <Card i={i} style={{ gap: 8 }}>
      <CardTitle Icon={Icon}>{titulo}</CardTitle>
      <span className="card-note">{sub}</span>
      {children}
    </Card>
  );
}

const Fila = ({ n, children }) => (
  <span className="ell" style={{ flex: 1 }}><span className="faint">{n}.</span> {children}</span>
);

export function PerfumesMasVistos({ perfumes, i = 0 }) {
  return (
    <Panel i={i} Icon={Eye} titulo="Perfumes más vistos" sub="Lo que más miran en la web, aunque no lo compren">
      <Lista items={perfumes} vacio="Todavía sin datos. Se acumulan con las visitas de ahora en adelante."
        render={(p, n) => (<><Fila n={n + 1}>{p.nombre}</Fila><span className="num">{p.vistas} <span className="card-note">vistas</span></span></>)} />
    </Panel>
  );
}

export function MasBuscados({ terminos, i = 0 }) {
  return (
    <Panel i={i} Icon={Search} titulo="Lo que más escriben en el buscador" sub="Términos más buscados en el catálogo">
      <Lista items={terminos} vacio="Todavía sin búsquedas registradas."
        render={(t, n) => (<><Fila n={n + 1}>{t.termino}</Fila><span className="num">{t.conteo} <span className="card-note">veces</span></span></>)} />
    </Panel>
  );
}

export function BusquedasSinResultado({ terminos, i = 0 }) {
  return (
    <Panel i={i} Icon={SearchX} titulo="Buscan y no lo tenemos" sub="Lo buscaron y no encontraron nada: candidatos a sumar al catálogo">
      <Lista items={terminos} vacio="Sin búsquedas fallidas: todo lo que buscaron lo tenías."
        render={(t) => (<><span className="ell" style={{ flex: 1 }}>{t.termino}</span><span className="card-note" style={{ color: '#FCA5A5' }}>{t.sinResultados} sin resultado</span></>)} />
    </Panel>
  );
}

export function BajaConversion({ perfumes, i = 0 }) {
  return (
    <Panel i={i} Icon={MousePointerClick} titulo="Muchas visitas, pocos pedidos" sub="Los miran pero no los agregan: revisá precio, fotos o descripción">
      <Lista items={perfumes} vacio="Todavía sin suficientes vistas para comparar."
        render={(p) => (<><span className="ell" style={{ flex: 1 }}>{p.nombre}</span><span className="card-note">{p.agregados} de {p.vistas} vistas</span></>)} />
    </Panel>
  );
}
