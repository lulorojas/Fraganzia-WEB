import { SOCIOS, METODOS_PAGO_SOCIOS } from '../../constants';
import { formatARS } from '../../utils/format';

const INPUT = 'w-full rounded-xl border border-border bg-transparent px-3 py-2 text-text';
const SELECT = 'w-full rounded-xl border border-border bg-bg px-3 py-2 text-text';

export const MODOS = [
  { id: 'uno', label: 'Lo pagó uno solo' },
  { id: 'mitad', label: 'Mitad y mitad' },
  { id: 'personalizado', label: 'Otro reparto' },
];

/**
 * En modo "personalizado" solo se tipea lo que puso el primer socio: lo del
 * segundo se calcula como el resto del total. Así la suma cierra siempre y no
 * se puede repetir el bloqueo por descuadre de centavos.
 */
export function CompraPagos({
  modo, onModoChange, montoTotal, pagos, onPagosChange, socios, error,
}) {
  const nombreDe = (id) =>
    socios?.find((s) => s.id === id)?.nombre ?? SOCIOS.find((s) => s.id === id)?.nombre ?? id;

  const total = Number(montoTotal) || 0;
  const montoDe = (socioId) => Number(pagos?.find((p) => p.socioId === socioId)?.monto) || 0;
  const metodoDe = (socioId) =>
    pagos?.find((p) => p.socioId === socioId)?.metodo ?? METODOS_PAGO_SOCIOS[0];

  const [primero, segundo] = SOCIOS;

  function setModo(nuevoModo) {
    onModoChange(nuevoModo);
    if (nuevoModo === 'uno') {
      onPagosChange([{ socioId: pagos?.[0]?.socioId ?? '', monto: total, metodo: metodoDe(pagos?.[0]?.socioId) }]);
    } else if (nuevoModo === 'mitad') {
      onPagosChange(SOCIOS.map((s) => ({ socioId: s.id, monto: total / 2, metodo: metodoDe(s.id) })));
    } else {
      onPagosChange(SOCIOS.map((s) => ({ socioId: s.id, monto: montoDe(s.id), metodo: metodoDe(s.id) })));
    }
  }

  function actualizarUnico(campo, valor) {
    const actual = pagos?.[0] ?? {};
    onPagosChange([{ socioId: actual.socioId ?? '', metodo: actual.metodo ?? METODOS_PAGO_SOCIOS[0], monto: total, [campo]: valor }]);
  }

  function actualizarMetodo(socioId, metodo) {
    onPagosChange(SOCIOS.map((s) => ({
      socioId: s.id,
      monto: modo === 'mitad' ? total / 2 : montoDe(s.id),
      metodo: s.id === socioId ? metodo : metodoDe(s.id),
    })));
  }

  // El segundo socio siempre recibe el resto: nunca se tipean dos montos.
  function actualizarMontoPrimero(valor) {
    const montoPrimero = Math.min(Math.max(Number(valor) || 0, 0), total);
    onPagosChange([
      { socioId: primero.id, monto: montoPrimero, metodo: metodoDe(primero.id) },
      { socioId: segundo.id, monto: total - montoPrimero, metodo: metodoDe(segundo.id) },
    ]);
  }

  // Diferencia respecto de la mitad que le tocaba a cada uno.
  const deuda = total / 2 - montoDe(segundo.id);
  const hayDeuda = Math.abs(deuda) > 0.5;

  return (
    <div>
      <p className="mb-2 text-sm text-text-secondary">¿Cómo se pagó?</p>
      <div className="mb-3 flex flex-wrap gap-2">
        {MODOS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setModo(m.id)}
            className={`rounded-xl border px-3 py-1.5 text-sm transition-base ${
              modo === m.id
                ? 'border-violet bg-violet/20 text-text'
                : 'border-border text-text-secondary hover:text-text'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {modo === 'uno' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-text-secondary">Pagado por</label>
            <select
              className={SELECT}
              value={pagos?.[0]?.socioId ?? ''}
              onChange={(e) => actualizarUnico('socioId', e.target.value)}
            >
              <option value="">Elegir…</option>
              {SOCIOS.map((s) => <option key={s.id} value={s.id}>{nombreDe(s.id)}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-text-secondary">Método de pago</label>
            <select
              className={SELECT}
              value={pagos?.[0]?.metodo ?? METODOS_PAGO_SOCIOS[0]}
              onChange={(e) => actualizarUnico('metodo', e.target.value)}
            >
              <option value="efectivo">Efectivo</option>
              <option value="mercadopago">Mercado Pago</option>
            </select>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {SOCIOS.map((s) => {
            const esPrimero = s.id === primero.id;
            const editable = modo === 'personalizado' && esPrimero;
            return (
              <div key={s.id} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_1fr] sm:items-end">
                <p className="text-sm text-text">{nombreDe(s.id)}</p>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-text-secondary">
                    {editable ? 'Puso' : 'Le corresponde'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className={`${INPUT} ${editable ? '' : 'opacity-60'}`}
                    value={Number.isFinite(montoDe(s.id)) ? montoDe(s.id) : 0}
                    readOnly={!editable}
                    onChange={editable ? (e) => actualizarMontoPrimero(e.target.value) : undefined}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-text-secondary">Método</label>
                  <select
                    className={SELECT}
                    value={metodoDe(s.id)}
                    onChange={(e) => actualizarMetodo(s.id, e.target.value)}
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="mercadopago">Mercado Pago</option>
                  </select>
                </div>
              </div>
            );
          })}

          {total > 0 && (
            <p className={`text-xs ${hayDeuda ? 'text-lila' : 'text-success'}`}>
              {hayDeuda
                ? `${nombreDe(deuda > 0 ? segundo.id : primero.id)} le queda debiendo ${formatARS(Math.abs(deuda))} a ${nombreDe(deuda > 0 ? primero.id : segundo.id)}.`
                : 'Quedan a mano: nadie le debe nada al otro.'}
            </p>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-error">{error}</p>}
    </div>
  );
}
