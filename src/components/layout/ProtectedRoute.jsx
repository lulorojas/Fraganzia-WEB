import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../ui/Spinner';

export function ProtectedRoute({ children }) {
  const { user, isAdmin, loading, authIniciada, iniciarAuth } = useAuth();

  // Las rutas protegidas necesitan saber ya quién es la persona: arrancan Auth.
  useEffect(() => { iniciarAuth(); }, [iniciarAuth]);

  if (loading || !authIniciada) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
