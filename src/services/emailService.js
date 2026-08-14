// src/services/emailService.js
// Servicio de emails usando EmailJS
// Para configurar: https://www.emailjs.com/
// 1. Crear cuenta en EmailJS
// 2. Agregar servicio de email
// 3. Crear templates (welcome, pedido, nuevo_perfume, promocion)
// 4. Copiar SERVICE_ID, TEMPLATE_IDs y PUBLIC_KEY

import emailjs from '@emailjs/browser';

// CONFIGURACIÓN - Reemplazar con tus credenciales de EmailJS
const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_fraganzia',
  PUBLIC_KEY: 'YOUR_PUBLIC_KEY',
  TEMPLATES: {
    WELCOME: 'template_welcome',
    PEDIDO: 'template_pedido',
    NUEVO_PERFUME: 'template_nuevo_perfume',
    PROMOCION: 'template_promocion',
  },
  // Email del admin para recibir notificaciones
  ADMIN_EMAIL: 'benjuserra@gmail.com',
};

// Inicializar EmailJS
if (EMAILJS_CONFIG.PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
  emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
}

// ============= EMAILS A USUARIOS =============

export async function enviarEmailBienvenida(email, nombre) {
  try {
    const templateParams = {
      to_email: email,
      to_name: nombre || 'Cliente',
      from_name: 'Fraganzia',
      message: `¡Bienvenido a Fraganzia! Tu cuenta ha sido creada exitosamente.`,
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATES.WELCOME,
      templateParams
    );

    console.log('✅ Email de bienvenida enviado:', response);
    return { success: true };
  } catch (error) {
    console.error('❌ Error al enviar email de bienvenida:', error);
    return { success: false, error: error.message };
  }
}

export async function enviarEmailPedidoConfirmado(email, nombre, items, total) {
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

    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATES.PEDIDO,
      templateParams
    );

    console.log('✅ Email de pedido enviado:', response);
    return { success: true };
  } catch (error) {
    console.error('❌ Error al enviar email de pedido:', error);
    return { success: false, error: error.message };
  }
}

// ============= NOTIFICACIONES AL ADMIN =============

export async function notificarNuevoRegistro(email, nombre) {
  try {
    const templateParams = {
      to_email: EMAILJS_CONFIG.ADMIN_EMAIL,
      to_name: 'Admin Fraganzia',
      subject: '🎉 Nuevo usuario registrado',
      message: `Nuevo usuario registrado:\n\nNombre: ${nombre}\nEmail: ${email}`,
      from_name: 'Sistema Fraganzia',
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATES.WELCOME,
      templateParams
    );

    console.log('✅ Notificación de registro enviada al admin');
    return { success: true };
  } catch (error) {
    console.error('❌ Error al notificar registro:', error);
    return { success: false, error: error.message };
  }
}

export async function notificarNuevoPedido(clienteEmail, clienteNombre, items, total) {
  try {
    const itemsList = items.map(item => 
      `• ${item.cantidad}x ${item.marca} ${item.nombre} - $${item.precioARS}`
    ).join('\n');

    const templateParams = {
      to_email: EMAILJS_CONFIG.ADMIN_EMAIL,
      to_name: 'Admin Fraganzia',
      subject: '🛍️ Nuevo pedido recibido',
      message: `Nuevo pedido de ${clienteNombre} (${clienteEmail}):\n\n${itemsList}\n\nTotal: ${total}\n\nRevisá el panel admin para más detalles.`,
      from_name: 'Sistema Fraganzia',
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATES.PEDIDO,
      templateParams
    );

    console.log('✅ Notificación de pedido enviada al admin');
    return { success: true };
  } catch (error) {
    console.error('❌ Error al notificar pedido:', error);
    return { success: false, error: error.message };
  }
}

export async function notificarNuevoPerfume(perfume) {
  try {
    const templateParams = {
      to_email: EMAILJS_CONFIG.ADMIN_EMAIL,
      to_name: 'Admin Fraganzia',
      subject: '✨ Nuevo perfume agregado',
      message: `Nuevo perfume agregado al catálogo:\n\n${perfume.marca} ${perfume.nombre}\nPrecio USD: $${perfume.precioUSD}\nGénero: ${perfume.genero}\nFamilia: ${perfume.familiaOlfativa}`,
      from_name: 'Sistema Fraganzia',
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATES.NUEVO_PERFUME,
      templateParams
    );

    console.log('✅ Notificación de perfume enviada al admin');
    return { success: true };
  } catch (error) {
    console.error('❌ Error al notificar perfume:', error);
    return { success: false, error: error.message };
  }
}

export async function notificarNuevaPromocion(promocion) {
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

    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATES.PROMOCION,
      templateParams
    );

    console.log('✅ Notificación de promoción enviada al admin');
    return { success: true };
  } catch (error) {
    console.error('❌ Error al notificar promoción:', error);
    return { success: false, error: error.message };
  }
}
