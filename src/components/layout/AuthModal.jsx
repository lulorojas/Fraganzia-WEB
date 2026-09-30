import { forwardRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { enviarEmailBienvenida, notificarNuevoRegistro } from '../../services/emailService';
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

const INPUT =
  'w-full rounded-xl border border-border bg-white/[0.03] px-3 py-2.5 text-text text-sm placeholder:text-text-secondary focus:border-violet focus:outline-none transition-colors';

// Campo con etiqueta visible y el error asociado (lectores de pantalla lo leen).
// forwardRef: react-hook-form necesita el ref del <input> real.
const Campo = forwardRef(function Campo({ id, label, error, ...inputProps }, ref) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-body text-xs text-text-secondary">
        {label}
      </label>
      <input
        ref={ref}
        id={id}
        className={INPUT}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...inputProps}
      />
      {error && (
        <p id={`${id}-error`} className="text-xs text-error">
          {error.message}
        </p>
      )}
    </div>
  );
});

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
      <Campo id="login-email" label="Email" type="email" autoComplete="email" error={errors.email} {...register('email')} />
      <Campo id="login-password" label="Contraseña" type="password" autoComplete="current-password" error={errors.password} {...register('password')} />
      {error && <p className="text-sm text-error" role="alert">{error}</p>}
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
      
      // Enviar email de bienvenida al usuario (no bloqueante)
      enviarEmailBienvenida(email, nombre);

      // Notificar al admin del nuevo registro (no bloqueante)
      notificarNuevoRegistro(email, nombre);

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
      <Campo id="registro-nombre" label="Tu nombre" autoComplete="name" maxLength={100} error={errors.nombre} {...register('nombre')} />
      <Campo id="registro-email" label="Email" type="email" autoComplete="email" error={errors.email} {...register('email')} />
      <Campo id="registro-password" label="Contraseña (mínimo 6 caracteres)" type="password" autoComplete="new-password" error={errors.password} {...register('password')} />
      <Campo id="registro-confirmar" label="Confirmar contraseña" type="password" autoComplete="new-password" error={errors.confirmar} {...register('confirmar')} />
      {error && <p className="text-sm text-error" role="alert">{error}</p>}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
      </Button>
    </form>
  );
}

// `isOpen` es el mismo nombre que usa <Modal>. Antes este componente esperaba
// `open` mientras Navbar le pasaba `isOpen`, y el modal nunca se abría.
export function AuthModal({ isOpen, onClose }) {
  const [tab, setTab] = useState('login');

  function handleClose() {
    setTab('login');
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={tab === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}>
      <div className="flex flex-col gap-4">
        <div className="flex border-b border-border mb-1" role="tablist">
          {['login', 'registro'].map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
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
