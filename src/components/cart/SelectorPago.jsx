import { METODOS_PAGO } from '../../constants';

export function SelectorPago({ value, onChange }) {
  return (
    <div className="flex gap-3">
      {METODOS_PAGO.map((metodo) => (
        <label
          key={metodo}
          className={`cursor-pointer rounded-xl border px-4 py-2 font-body transition-base ${
            value === metodo ? 'border-violet text-text glow' : 'border-border text-text-secondary'
          }`}
        >
          <input
            type="radio"
            name="metodoPago"
            value={metodo}
            checked={value === metodo}
            onChange={() => onChange(metodo)}
            className="sr-only"
          />
          {metodo}
        </label>
      ))}
    </div>
  );
}
