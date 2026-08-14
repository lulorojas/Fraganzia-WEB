import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

export function Toast({ message, type = 'success', onClose }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300);
    }, 2700);

    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle size={20} className="text-green-400" />,
    error: <AlertCircle size={20} className="text-red-400" />,
  };

  return (
    <div
      className={`glass flex items-center gap-3 rounded-xl px-4 py-3 shadow-2xl transition-all duration-300 max-w-md ${
        isExiting ? 'translate-x-[400px] opacity-0' : 'translate-x-0 opacity-100'
      }`}
    >
      {icons[type]}
      <p className="text-sm text-text font-body line-clamp-2 flex-1">{message}</p>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(onClose, 300);
        }}
        className="ml-2 flex-shrink-0 text-text-secondary hover:text-text transition-base"
      >
        <X size={16} />
      </button>
    </div>
  );
}
