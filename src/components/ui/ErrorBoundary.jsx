import { Component } from 'react';

// Evita que un error de render deje la página en blanco: muestra un mensaje y
// permite recargar. Un chunk lazy que falla al descargarse (por ejemplo tras un
// deploy nuevo) también cae acá, y recargar lo resuelve.
export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="glass max-w-md rounded-2xl p-8 text-center">
          <h1 className="font-display text-2xl text-text mb-3">Algo salió mal</h1>
          <p className="font-body text-text-secondary mb-6">
            Ocurrió un error inesperado. Probá recargar la página.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="gradient-violet rounded-xl px-5 py-2.5 font-body font-medium text-text shadow-lg shadow-violet/20 transition-base hover:shadow-violet/40"
          >
            Recargar
          </button>
        </div>
      </div>
    );
  }
}
