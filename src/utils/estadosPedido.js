// Un pedido entra como 'confirmado' (lo exige firestore.rules; el cliente lo ve
// como "Recibido") o, en los viejos, como 'en_proceso'. Los dos significan lo
// mismo para el panel: llegó y todavía nadie lo atendió.
export const ESTADOS_NUEVOS = ['confirmado', 'en_proceso'];

export const esNuevo = (pedido) => ESTADOS_NUEVOS.includes(pedido.estado);
export const enCurso = (pedido) => ['preparando', 'enviado'].includes(pedido.estado);

// Color de la etiqueta de cada estado en el panel.
export const TONO_ESTADO = {
  confirmado: 'warn',
  en_proceso: 'warn',
  preparando: 'accent',
  enviado: 'accent',
  entregado: 'ok',
  cancelado: 'bad',
};
