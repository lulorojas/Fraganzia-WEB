// src/services/emailService.js
// Servicio de emails usando EmailJS
// Para configurar: https://www.emailjs.com/
// 1. Crear cuenta en EmailJS
// 2. Agregar servicio de email
// 3. Crear templates (welcome, pedido, nuevo_perfume, promocion)
// 4. Copiar SERVICE_ID, TEMPLATE_IDs y PUBLIC_KEY

import emailjs from '@emailjs/browser';

// Credenciales en variables de entorno (ver .env.example y EMAILJS_SETUP.md).
// La public key de EmailJS es pública por diseño; se protege restringiendo
// los dominios permitidos en el panel de EmailJS.
const EMAILJS_CONFIG = {
  SERVICE_ID: import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_fraganzia',
  PUBLIC_KEY: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
  TEMPLATES: {
    WELCOME: 'template_welcome',
    PEDIDO: 'template_pedido',
    NUEVO_PERFUME: 'template_nuevo_perfume',
    PROMOCION: 'template_promocion',
  },
  // Destinatario de las notificaciones internas. Conviene fijarlo también en
  // la plantilla de EmailJS en vez de confiar en este parámetro.
  ADMIN_EMAIL: import.meta.env.VITE_EMAILJS_ADMIN_EMAIL,
};

const configurado = Boolean(EMAILJS_CONFIG.PUBLIC_KEY);

if (configurado) {
  emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
}

// Sin credenciales no intentamos enviar: antes cada envío fallaba en silencio
// contra la API. Devolvemos el mismo formato que un fallo normal.
function noConfigurado() {
  return { success: false, error: 'EmailJS no está configurado' };
}

// ============= EMAILS A USUARIOS =============

export async function enviarEmailBienvenida(email, nombre) {
  if (!configurado) return noConfigurado();
  try {
    const templateParams = {
      to_email: email,
      to_name: nombre || 'Cliente',
      from_name: 'Fraganzia',
      message: `¡Bienvenido a Fraganzia! Tu cuenta ha sido creada exitosamente.`,
    };

    await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATES.WELCOME,
      templateParams
    );
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function enviarEmailPedidoConfirmado(email, nombre, items, total) {
  if (!configurado) return noConfigurado();
  try {
    const itemsList = items.map(item => 
      `${item.cantidad}x ${item.marca} ${item.nombre}`
    ).join('\n');

    const templateParams = {
      to_email: email,
      to_name: nombre || 'Cliente',
      items_list: itemsList,
      total: total,
      from_name: 'Fraganzia',
    };

    await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATES.PEDIDO,
      templateParams
    );
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============= NOTIFICACIONES AL ADMIN =============

export async function notificarNuevoRegistro(email, nombre) {
  if (!configurado) return noConfigurado();
  try {
    const templateParams = {
      to_email: EMAILJS_CONFIG.ADMIN_EMAIL,
      to_name: 'Admin Fraganzia',
      subject: '🎉 Nuevo usuario registrado',
      message: `Nuevo usuario registrado:\n\nNombre: ${nombre}\nEmail: ${email}`,
      from_name: 'Sistema Fraganzia',
    };

    await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATES.WELCOME,
      templateParams
    );
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function notificarNuevoPedido(clienteEmail, clienteNombre, items, total) {
  if (!configurado) return noConfigurado();
  try {
    const itemsList = items.map(item => 
      `• ${item.cantidad}x ${item.marca} ${item.nombre} - $${item.precioARS}`
    ).join('\n');

    const templateParams = {
      to_email: EMAILJS_CONFIG.ADMIN_EMAIL,
      to_name: 'Admin Fraganzia',
      subject: '🛍️ Nuevo pedido recibido',
      message: `Nuevo pedido de ${clienteNombre}${clienteEmail ? ` (${clienteEmail})` : ''}:\n\n${itemsList}\n\nTotal: ${total}\n\nRevisá el panel admin para más detalles.`,
      from_name: 'Sistema Fraganzia',
    };

    await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATES.PEDIDO,
      templateParams
    );
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function notificarNuevoPerfume(perfume) {
  if (!configurado) return noConfigurado();
  try {
    const templateParams = {
      to_email: EMAILJS_CONFIG.ADMIN_EMAIL,
      to_name: 'Admin Fraganzia',
      subject: '✨ Nuevo perfume agregado',
      message: `Nuevo perfume agregado al catálogo:\n\n${perfume.marca} ${perfume.nombre}\nPrecio USD: $${perfume.precioUSD}\nGénero: ${perfume.genero}\nFamilia: ${perfume.familiaOlfativa}`,
      from_name: 'Sistema Fraganzia',
    };

    await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATES.NUEVO_PERFUME,
      templateParams
    );
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function notificarNuevaPromocion(promocion) {
  if (!configurado) return noConfigurado();
  try {
    const mensaje = promocion.tipo === '2x1' 
      ? `Nueva promoción 2x1: ${promocion.titulo}`
      : `Nueva promoción ${promocion.descuentoPorcentaje}% OFF: ${promocion.titulo}`;

    const templateParams = {
      to_email: EMAILJS_CONFIG.ADMIN_EMAIL,
      to_name: 'Admin Fraganzia',
      subject: '🎁 Nueva promoción creada',
      message: mensaje,
      from_name: 'Sistema Fraganzia',
    };

    await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATES.PROMOCION,
      templateParams
    );
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
