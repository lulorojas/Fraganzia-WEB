import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import { loginSchema } from '../schemas/loginSchema';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data) {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      navigate('/admin');
    } catch {
      setError('Email o contraseña incorrectos.');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <GlassCard className="w-full max-w-sm">
        <h1 className="mb-6 font-display text-2xl text-text">Iniciar sesión</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="admin-email" className="font-body text-xs text-text-secondary">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              className="w-full rounded-xl border border-border bg-white/[0.03] px-3 py-2.5 text-text focus:border-violet focus:outline-none"
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-error">{errors.email.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="admin-password" className="font-body text-xs text-text-secondary">
              Contraseña
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-xl border border-border bg-white/[0.03] px-3 py-2.5 text-text focus:border-violet focus:outline-none"
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-error">{errors.password.message}</p>
            )}
          </div>
          {error && <p className="text-sm text-error" role="alert">{error}</p>}
          <Button type="submit" disabled={isSubmitting}>
            Ingresar
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}
