import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

const schemaLogin = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

const schemaRegistro = z.object({
  nombre: z.string().min(2, 'Ingresá tu nombre'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmar: z.string().min(1, 'Confirmá tu contraseña'),
}).refine((d) => d.password === d.confirmar, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmar'],
});

const INPUT = 'w-full rounded-xl border border-border bg-transparent px-3 py-2 text-text text-sm';

function FormLogin({ onSuccess }) {
  const [error, setError] = useState(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schemaLogin),
  });

  async function onSubmit({ email, password }) {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onSuccess();
    } catch {
      setError('Email o contraseña incorrectos.');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <div>
        <input className={INPUT} placeholder="Email" type="email" {...register('email')} />
        {errors.email && <p className="text-xs text-error mt-1">{errors.email.message}</p>}
      </div>
      <div>
        <input className={INPUT} placeholder="Contraseña" type="password" {...register('password')} />
        {errors.password && <p className="text-xs text-error mt-1">{errors.password.message}</p>}
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Ingresando…' : 'Iniciar sesión'}
      </Button>
    </form>
  );
}

function FormRegistro({ onSuccess }) {
  const [error, setError] = useState(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schemaRegistro),
  });

  async function onSubmit({ nombre, email, password }) {
    setError(null);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName: nombre });
      onSuccess();
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') {
        setError('Ya existe una cuenta con ese email.');
      } else {
        setError('Error al crear la cuenta. Intentá de nuevo.');
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <div>
        <input className={INPUT} placeholder="Tu nombre" {...register('nombre')} />
        {errors.nombre && <p className="text-xs text-error mt-1">{errors.nombre.message}</p>}
      </div>
      <div>
        <input className={INPUT} placeholder="Email" type="email" {...register('email')} />
        {errors.email && <p className="text-xs text-error mt-1">{errors.email.message}</p>}
      </div>
      <div>
        <input className={INPUT} placeholder="Contraseña (mín. 6 caracteres)" type="password" {...register('password')} />
        {errors.password && <p className="text-xs text-error mt-1">{errors.password.message}</p>}
      </div>
      <div>
        <input className={INPUT} placeholder="Confirmar contraseña" type="password" {...register('confirmar')} />
        {errors.confirmar && <p className="text-xs text-error mt-1">{errors.confirmar.message}</p>}
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
      </Button>
    </form>
  );
}

export function AuthModal({ isOpen, onClose }) {
  const [tab, setTab] = useState('login');

  function handleClose() {
    setTab('login');
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="flex flex-col gap-4">
        <h2 className="font-display text-xl text-text">
          {tab === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
        </h2>

        <div className="flex border-b border-border mb-1">
          {['login', 'registro'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-2 px-4 text-sm font-body transition-base ${
                tab === t
                  ? 'text-text border-b-2 border-violet'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              {t === 'login' ? 'Iniciar sesión' : 'Registrarse'}
            </button>
          ))}
        </div>

        {tab === 'login' ? (
          <FormLogin onSuccess={handleClose} />
        ) : (
          <FormRegistro onSuccess={handleClose} />
        )}
      </div>
    </Modal>
  );
}
