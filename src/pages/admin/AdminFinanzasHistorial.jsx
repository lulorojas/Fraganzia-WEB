import { History, TrendingUp } from 'lucide-react';
import AdminAuditoria from './AdminAuditoria';
import AdminAnalytics from './AdminAnalytics';

function TituloSeccion({ Icon, children }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 font-display text-xl text-text">
      <div className="rounded-xl bg-lila/10 p-2">
        <Icon className="h-5 w-5 text-lila" />
      </div>
      {children}
    </h2>
  );
}

export default function AdminFinanzasHistorial() {
  return (
    <div>
      <section>
        <TituloSeccion Icon={History}>Historial y auditoría</TituloSeccion>
        <AdminAuditoria />
      </section>
      <section className="mt-10">
        <TituloSeccion Icon={TrendingUp}>Analytics</TituloSeccion>
        <AdminAnalytics />
      </section>
    </div>
  );
}
