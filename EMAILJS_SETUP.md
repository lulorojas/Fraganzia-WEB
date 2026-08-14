# Configuración de EmailJS para Fraganzia

## Sistema de Notificaciones Newsletter estilo Letterboxd

Este sistema envía emails automáticos cuando:
- ✉️ Un usuario se registra (bienvenida + notificación al admin)
- 🛍️ Se crea un nuevo pedido (notificación al admin)
- ✨ Se agrega un nuevo perfume (notificación al admin)
- 🎁 Se crea una promoción (notificación al admin)

## Pasos para configurar:

### 1. Crear cuenta en EmailJS
- Ir a https://www.emailjs.com/
- Crear cuenta gratuita (hasta 200 emails/mes)

### 2. Configurar servicio de email
- Dashboard → Email Services → Add New Service
- Elegir Gmail o el proveedor que uses
- Conectar tu cuenta de email (benjuserra@gmail.com)

### 3. Crear templates

#### Template 1: BIENVENIDA (template_welcome)
Para emails de bienvenida a nuevos usuarios.

**Nombre**: `template_welcome`  
**Subject**: `¡Bienvenido a Fraganzia! 🎉`

**Content**:
```html
<html>
<head>
    <style>
        body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #7B2FBE 0%, #9B59D0 100%); 
                  color: white; padding: 40px 20px; text-align: center; }
        .content { padding: 30px 20px; background: #F8F4FF; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .button { display: inline-block; padding: 12px 30px; background: #7B2FBE; 
                  color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>¡Bienvenido a Fraganzia! 🎉</h1>
        </div>
        <div class="content">
            <p>Hola {{to_name}},</p>
            <p>¡Gracias por registrarte en Fraganzia!</p>
            <p>Ya podés explorar nuestro catálogo de más de 300 fragancias árabes exclusivas.</p>
            <p><strong>Beneficios de tu cuenta:</strong></p>
            <ul>
                <li>Acceso al catálogo completo</li>
                <li>Historial de pedidos</li>
                <li>Notificaciones de nuevas fragancias</li>
                <li>Promociones exclusivas</li>
            </ul>
            <a href="https://fraganzia-e9b70.web.app/catalogo" class="button">
                Ver Catálogo
            </a>
            <p>Si tenés alguna consulta, escribinos por WhatsApp.</p>
            <br>
            <p>Saludos,<br><strong>Equipo Fraganzia</strong></p>
        </div>
        <div class="footer">
            <p>@fraganzia.ar • Envíos solo al AMBA</p>
            <p>Instagram: <a href="https://www.instagram.com/fraganzia.ar/">@fraganzia.ar</a></p>
        </div>
    </div>
</body>
</html>
```

#### Template 2: PEDIDO (template_pedido)
Para notificaciones de pedidos al admin.

**Nombre**: `template_pedido`  
**Subject**: `🛍️ Nuevo Pedido - {{to_name}}`

**Content**:
```html
<html>
<body style="font-family: Arial, sans-serif; padding: 20px;">
    <h2 style="color: #7B2FBE;">{{subject}}</h2>
    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
        <p><strong>{{message}}</strong></p>
    </div>
    <p style="margin-top: 20px; font-size: 12px; color: #666;">
        Revisá el panel admin para más detalles.
    </p>
</body>
</html>
```

#### Template 3: NUEVO PERFUME (template_nuevo_perfume)
Para notificar cuando se agrega un perfume.

**Nombre**: `template_nuevo_perfume`  
**Subject**: `✨ Nuevo Perfume Agregado`

**Content**:
```html
<html>
<body style="font-family: Arial, sans-serif; padding: 20px;">
    <h2 style="color: #7B2FBE;">✨ Nuevo Perfume en el Catálogo</h2>
    <div style="background: #F8F4FF; padding: 20px; border-radius: 8px; border-left: 4px solid #7B2FBE;">
        <p><strong>{{message}}</strong></p>
    </div>
    <p style="margin-top: 20px;">
        <a href="https://fraganzia-e9b70.web.app/admin/perfumes" 
           style="background: #7B2FBE; color: white; padding: 10px 20px; 
                  text-decoration: none; border-radius: 6px;">
            Ver en Admin
        </a>
    </p>
</body>
</html>
```

#### Template 4: PROMOCIÓN (template_promocion)
Para notificar nuevas promociones.

**Nombre**: `template_promocion`  
**Subject**: `🎁 Nueva Promoción Creada`

**Content**:
```html
<html>
<body style="font-family: Arial, sans-serif; padding: 20px;">
    <h2 style="color: #7B2FBE;">🎁 Nueva Promoción</h2>
    <div style="background: #FFF4E6; padding: 20px; border-radius: 8px; border-left: 4px solid #FF9800;">
        <p><strong>{{message}}</strong></p>
    </div>
    <p style="margin-top: 20px;">
        <a href="https://fraganzia-e9b70.web.app/admin/promociones" 
           style="background: #7B2FBE; color: white; padding: 10px 20px; 
                  text-decoration: none; border-radius: 6px;">
            Ver Promociones
        </a>
    </p>
</body>
</html>
```

### 4. Obtener credenciales
- Dashboard → Account
- Copiar:
  - **Service ID**: (ej: `service_abc123`)
  - **Public Key**: (ej: `user_abc123xyz`)

### 5. Actualizar código
Editar `src/services/emailService.js`:
```javascript
const EMAILJS_CONFIG = {
  SERVICE_ID: 'tu_service_id_aqui',
  PUBLIC_KEY: 'tu_public_key_aqui',
  TEMPLATES: {
    WELCOME: 'template_welcome',
    PEDIDO: 'template_pedido',
    NUEVO_PERFUME: 'template_nuevo_perfume',
    PROMOCION: 'template_promocion',
  },
  ADMIN_EMAIL: 'benjuserra@gmail.com',
};
```

### 6. Variables de los templates
Todas usan estas variables:
- `{{to_email}}` - Email del destinatario
- `{{to_name}}` - Nombre del destinatario
- `{{subject}}` - Asunto del email
- `{{message}}` - Contenido principal
- `{{from_name}}` - "Fraganzia" o "Sistema Fraganzia"

### 7. Notificaciones configuradas

| Evento | Email a Usuario | Email a Admin |
|--------|----------------|---------------|
| Registro nuevo | ✅ Bienvenida | ✅ Notificación |
| Nuevo pedido | ❌ | ✅ Detalles del pedido |
| Nuevo perfume | ❌ | ✅ Info del perfume |
| Nueva promoción | ❌ | ✅ Info de la promo |

### 8. Limitaciones plan gratuito:
- 200 emails/mes
- 2 servicios de email
- Templates ilimitados

## Testing
1. Crear un usuario de prueba
2. Hacer un pedido de prueba
3. Agregar un perfume de prueba
4. Verificar que lleguen los emails a benjuserra@gmail.com

## Troubleshooting
- Si no llegan los emails, verificar spam
- Revisar Dashboard de EmailJS para ver si se enviaron
- Verificar que las credenciales estén correctas
- Los emails son no-bloqueantes: si fallan, la app sigue funcionando
