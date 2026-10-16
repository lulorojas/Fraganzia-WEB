import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, MessageCircle } from 'lucide-react';
import { useConfig, useActualizarConfig } from '../../hooks/useConfig';
import { DOLAR_BLUE_API } from '../../constants';
import { valorDolarMedio } from '../../utils/precios';
import { useAdminActions } from '../../context/AdminActionsContext';
import { Card, CardTitle, Field, Cargando } from '../../components/admin/ui/kit';
import { pesos } from '../../components/admin/ui/formato';

async function traerDolar() {
  const res = await fetch(DOLAR_BLUE_API);
  if (!res.ok) throw new Error('No se pudo obtener la cotización del dólar blue');
  return res.json();
}

export default function AdminConfig() {
  const { avisar } = useAdminActions();
  const { data: config, isLoading } = useConfig();
  const { mutateAsync: actualizar, isPending } = useActualizarConfig();
  // Misma clave que useDolarBlue: comparte caché con el resto del panel.
  const { data: dolar, isError } = useQuery({ queryKey: ['dolarBlue'], queryFn: traerDolar, staleTime: 30 * 60 * 1000, retry: 1 });

  const { register, handleSubmit, reset } = useForm({ defaultValues: { dolarBlueManual: '', whatsappNumero: '' } });
  useEffect(() => { if (config) reset(config); }, [config, reset]);

  async function guardar(datos) {
    await actualizar(datos);
    avisar('Configuración guardada');
  }

  if (isLoading) return <Cargando />;

  return (
    <div className="adm-row" style={{ alignItems: 'flex-start' }}>
      <Card i={0} style={{ flex: '1.2 1 360px' }}>
        <CardTitle Icon={MessageCircle}>Datos generales</CardTitle>
        <form onSubmit={handleSubmit(guardar)} className="flex flex-col gap-4">
          <Field label="Dólar blue manual (respaldo)" hint="Se usa si la API de dólar no responde.">
            <input type="number" step="0.01" className="input" {...register('dolarBlueManual', { valueAsNumber: true })} />
          </Field>
          <Field label="Número de WhatsApp" hint="Formato: 5491130097370 (sin + ni espacios)">
            <input className="input" {...register('whatsappNumero')} />
          </Field>
          <div><button type="submit" className="btn btn-primary" disabled={isPending}>{isPending ? 'Guardando…' : 'Guardar configuración'}</button></div>
        </form>
      </Card>

      <Card i={1} style={{ flex: '1 1 260px' }}>
        <CardTitle Icon={DollarSign}>Dólar blue en vivo</CardTitle>
        {dolar ? (
          <>
            <span className="big">{pesos(valorDolarMedio(dolar))}</span>
            <div className="grid grid-cols-2 gap-2">
              <div><span className="card-note">Compra</span><div className="num" style={{ fontSize: 17 }}>{pesos(dolar.compra)}</div></div>
              <div><span className="card-note">Venta</span><div className="num" style={{ fontSize: 17 }}>{pesos(dolar.venta)}</div></div>
            </div>
            <span className="card-note flex items-center gap-2"><span className="pulse" style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 10px #10B981' }} />Promedio entre compra y venta</span>
          </>
        ) : (
          <span className="dim">{isError ? 'No se pudo traer la cotización. Se usa el valor manual.' : 'Cargando cotización…'}</span>
        )}
        {config?.dolarBlueManual > 0 && <div className="notice">Hay un dólar manual cargado ({pesos(config.dolarBlueManual)}): tiene prioridad sobre la cotización en vivo.</div>}
      </Card>
    </div>
  );
}
