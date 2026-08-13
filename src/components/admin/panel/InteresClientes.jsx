import { Eye, Search, SearchX, MousePointerClick } from 'lucide-react';
import { GlassCard } from '../../ui/GlassCard';

function Titulo({ Icon, children, sub }) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2">
        <div className="rounded-xl bg-lila/10 p-2">
          <Icon className="h-5 w-5 text-lila" />
        </div>
        <h3 className="font-display text-lg text-text">{children}</h3>
      </div>
      {sub && <p className="mt-1 text-xs text-text-secondary">{sub}</p>}
    </div>
  );
}

function Lista({ items, vacio, render }) {
  if (!items?.length) return <p className="text-sm text-text-secondary">{vacio}</p>;
  return (
    <ol className="flex flex-col gap-2 text-sm">
      {items.map((item, i) => (
        <li key={item.perfumeId ?? item.id ?? i} className="flex items-center justify-between gap-3 border-b border-border py-1">
          {render(item, i)}
        </li>
      ))}
    </ol>
  );
}

export function PerfumesMasVistos({ perfumes }) {
  return (
    <GlassCard>
      <Titulo Icon={Eye} sub="Lo que más miran en la web, aunque no lo compren">
        Perfumes más vistos
      </Titulo>
      <Lista
        items={perfumes}
        vacio="Todavía sin datos. Se empiezan a acumular con las visitas de ahora en adelante."
        render={(p, i) => (
          <>
            <span className="min-w-0 truncate text-text">
              <span className="text-text-secondary">{i + 1}.</span> {p.nombre}
            </span>
            <span className="shrink-0 text-right text-text">
              {p.vistas} <span className="text-xs text-text-secondary">vistas</span>
            </span>
          </>
        )}
      />
    </GlassCard>
  );
}

export function MasBuscados({ terminos }) {
  return (
    <GlassCard>
      <Titulo Icon={Search} sub="Lo que la gente escribe en el buscador del catálogo">
        Más buscados
      </Titulo>
      <Lista
        items={terminos}
        vacio="Todavía sin búsquedas registradas."
        render={(t, i) => (
          <>
            <span className="min-w-0 truncate text-text">
              <span className="text-text-secondary">{i + 1}.</span> {t.termino}
            </span>
            <span className="shrink-0 text-text">
              {t.conteo} <span className="text-xs text-text-secondary">veces</span>
            </span>
          </>
        )}
      />
    </GlassCard>
  );
}

export function BusquedasSinResultado({ terminos }) {
  return (
    <GlassCard>
      <Titulo Icon={SearchX} sub="Lo buscaron y no encontraron nada: candidatos a sumar al catálogo">
        Buscado y no encontrado
      </Titulo>
      <Lista
        items={terminos}
        vacio="Sin búsquedas fallidas: todo lo que buscaron lo tenías."
        render={(t) => (
          <>
            <span className="min-w-0 truncate text-text">{t.termino}</span>
            <span className="shrink-0 text-xs text-error">{t.sinResultados} sin resultado</span>
          </>
        )}
      />
    </GlassCard>
  );
}

export function BajaConversion({ perfumes }) {
  return (
    <GlassCard>
      <Titulo Icon={MousePointerClick} sub="Los miran pero no los agregan: revisá precio, fotos o descripción">
        Mucha vista, poco carrito
      </Titulo>
      <Lista
        items={perfumes}
        vacio="Todavía sin suficientes vistas para comparar."
        render={(p) => (
          <>
            <span className="min-w-0 truncate text-text">{p.nombre}</span>
            <span className="shrink-0 text-xs text-text-secondary">
              {p.vistas} vistas · {p.agregados} al carrito
            </span>
          </>
        )}
      />
    </GlassCard>
  );
}
