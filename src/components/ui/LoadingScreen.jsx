import { Loader2 } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-4">
        <Loader2 size={48} className="animate-spin text-violet" />
        <p className="font-body text-sm text-text-secondary">Cargando...</p>
      </div>
    </div>
  );
}
