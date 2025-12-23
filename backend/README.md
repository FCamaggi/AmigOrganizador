# AmigOrganizador - Backend API

Backend API RESTful para la plataforma de coordinación social AmigOrganizador.

## Stack Tecnológico

- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Base de Datos:** MongoDB Atlas (Mongoose ODM)
- **Autenticación:** JWT (JSON Web Tokens)
- **Seguridad:** Helmet, CORS, bcrypt, express-rate-limit

## Instalación

1. Instalar dependencias:

```bash
npm install
```

2. Configurar variables de entorno:

```bash
cp .env.example .env
# Editar .env con tus credenciales
```

3. Iniciar servidor de desarrollo:

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:5000`

## Estructura del Proyecto

```
backend/
├── src/
│   ├── config/          # Configuración de DB y entorno
│   ├── models/          # Modelos de Mongoose
│   ├── controllers/     # Lógica de negocio
│   ├── routes/          # Definición de rutas
│   ├── middleware/      # Middleware personalizado
│   ├── utils/           # Utilidades y helpers
│   └── server.js        # Entry point
├── .env                 # Variables de entorno (no en git)
├── .env.example         # Plantilla de variables
└── package.json
```

## API Endpoints

### Autenticación

- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual

### Horarios

- `GET /api/schedules/:userId/:month/:year` - Obtener horario
- `POST /api/schedules` - Crear/actualizar horario
- `POST /api/schedules/import` - Importar desde JSON

### Grupos

- `POST /api/groups` - Crear grupo
- `GET /api/groups` - Listar grupos del usuario
- `GET /api/groups/:id` - Detalle de grupo
- `PUT /api/groups/:id` - Actualizar grupo
- `DELETE /api/groups/:id` - Eliminar grupo
- `GET /api/groups/:id/availability` - Ver disponibilidad grupal
- `POST /api/groups/join` - Unirse por código

### Invitaciones

- `POST /api/invitations` - Enviar invitación
- `GET /api/invitations` - Listar invitaciones pendientes
- `POST /api/invitations/:id/accept` - Aceptar invitación

## Seguridad

- Rate limiting: 100 requests/15min por IP
- Validación de inputs con express-validator
- Sanitización de datos
- Headers de seguridad con Helmet
- CORS configurado para frontend específico
- Contraseñas hasheadas con bcrypt (10 rounds)
- JWTs con expiración de 2 horas

## Deploy

Diseñado para Render.com (Free Tier):

- Auto-deploy desde repositorio Git
- Variables de entorno configurables en dashboard
- Sleep tras 15 min de inactividad (primera request tarda ~30-60s)
