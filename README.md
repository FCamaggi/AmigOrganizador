# AmigOrganizador

Aplicación web para coordinar encuentros entre grupos de amigos mediante la gestión y compartición de horarios personales.

## 📋 Descripción

AmigOrganizador simplifica la coordinación de horarios entre grupos de amigos. Los usuarios pueden gestionar sus horarios mensuales y compartirlos con grupos específicos, identificando automáticamente cuándo todos están disponibles para reunirse.

## 🏗️ Arquitectura

- **Frontend:** React + Vite + TailwindCSS → Netlify
- **Backend:** Node.js + Express + MongoDB → Render
- **Base de Datos:** MongoDB (Free Tier)

## 📁 Estructura del Proyecto

```
AmigOrganizador/
├── backend/          # API REST con Node.js + Express
├── frontend/         # SPA con React + Vite
└── docs/            # Documentación del proyecto
```

## 🚀 Setup Rápido

### Prerrequisitos

- Node.js 20+ instalado
- Cuenta en MongoDB Atlas (gratuita)
- Git

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus credenciales
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Editar .env con la URL del backend
npm run dev
```

## 📖 Documentación Completa

Consulta la carpeta `docs/` para documentación detallada:

- [01_AmigOrganizador_Vision_Proyecto.docx.md](docs/01_AmigOrganizador_Vision_Proyecto.docx.md)
- [02_AmigOrganizador_Arquitectura_Tecnica.docx.md](docs/02_AmigOrganizador_Arquitectura_Tecnica.docx.md)
- [03_AmigOrganizador_Especificaciones_Funcionales.docx.md](docs/03_AmigOrganizador_Especificaciones_Funcionales.docx.md)
- [04_AmigOrganizador_Estructura_Desarrollo.docx.md](docs/04_AmigOrganizador_Estructura_Desarrollo.docx.md)
- [05_AmigOrganizador_Resumen_Checklist.docx.md](docs/05_AmigOrganizador_Resumen_Checklist.docx.md)

## ✨ Funcionalidades Principales

- ✅ Sistema de autenticación (registro, login)
- ✅ Gestión de horarios personales mes a mes
- ✅ Creación y administración de grupos
- ✅ Sistema de invitaciones por código único
- ✅ Visualización de disponibilidad grupal
- ✅ Importación/exportación de horarios (JSON)

## 🎯 Propósito, Objetivos y Archivos Críticos

### Propósito del producto

AmigOrganizador está diseñado para simplificar la coordinación de encuentros entre grupos de amigos.
El foco principal del producto es transformar la disponibilidad personal de cada miembro en ventanas comunes de encuentro, evitando cadenas largas de mensajes y reduciendo fricción para organizar planes.

### Objetivos del proyecto

#### Objetivos funcionales

- Permitir gestionar horarios personales mes a mes de forma intuitiva.
- Facilitar la creación y administración de grupos.
- Identificar automáticamente franjas donde todos (o casi todos) están disponibles.
- Soportar importación/exportación de horarios en JSON.
- Mantener criterios de disponibilidad grupal configurables por grupo.

#### Objetivos técnicos

- Mantener una arquitectura escalable y mantenible.
- Garantizar experiencia responsive y mobile-first.
- Proteger datos sensibles con autenticación y controles de seguridad.
- Mantener costos operativos bajos usando servicios cloud en free tier.

### Archivos críticos (fuente de verdad)

#### Producto y alcance

- [README.md](README.md): visión general, funcionalidades principales y stack.
- [docs/01_AmigOrganizador_Vision_Proyecto.docx.md](docs/01_AmigOrganizador_Vision_Proyecto.docx.md): problema, visión, objetivos y métricas.
- [docs/02_AmigOrganizador_Arquitectura_Tecnica.docx.md](docs/02_AmigOrganizador_Arquitectura_Tecnica.docx.md): arquitectura, infraestructura, seguridad y endpoints.

#### Backend (dominio y API)

- [backend/src/server.js](backend/src/server.js): composición de la API, middlewares y rutas montadas.
- [backend/src/config/env.js](backend/src/config/env.js): variables de entorno críticas y validaciones de arranque.
- [backend/src/models/Schedule.js](backend/src/models/Schedule.js): modelo central de disponibilidad mensual por día y franjas.
- [backend/src/models/Group.js](backend/src/models/Group.js): grupos, membresía, roles y settings de disponibilidad.
- [backend/src/models/Event.js](backend/src/models/Event.js): eventos personales, categorías y recurrencia.
- [backend/src/routes/groupRoutes.js](backend/src/routes/groupRoutes.js): flujo de grupos, disponibilidad simple/detallada y sugerencias.
- [backend/src/middleware/errorHandler.js](backend/src/middleware/errorHandler.js): formato y terminología de errores de API.

#### Frontend (flujo principal y lenguaje de UI)

- [frontend/src/App.tsx](frontend/src/App.tsx): rutas públicas/protegidas y navegación principal.
- [frontend/src/pages/Schedule.tsx](frontend/src/pages/Schedule.tsx): experiencia núcleo de "Mi Horario", vista calendario y configuración rápida.
- [frontend/src/components/groups/GroupsPage.tsx](frontend/src/components/groups/GroupsPage.tsx): gestión de grupos, invitaciones y acciones principales.
- [frontend/src/components/groups/GroupAvailabilityView.tsx](frontend/src/components/groups/GroupAvailabilityView.tsx): análisis grupal por ranking, calendario, eventos y criterios.
- [frontend/src/services/api.ts](frontend/src/services/api.ts): manejo de errores de red y estado de backend dormido.

#### Identidad visual y sistema de diseño

- [frontend/src/styles/design-system.ts](frontend/src/styles/design-system.ts): tokens de color, tipografía, spacing, sombras y variantes.
- [frontend/tailwind.config.js](frontend/tailwind.config.js): extensión de paletas y sombras usadas en la UI real.
- [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md): guía de componentes y uso de tokens.

### Forma nativa del producto

El producto sigue esta estructura funcional:

1. Disponibilidad personal por mes.
2. Edición por día y franja horaria.
3. Compartición por grupo.
4. Cálculo de ventanas comunes (simples y detalladas).
5. Acciones derivadas: invitaciones, import/export y sugerencias de eventos.

Esta forma define la jerarquía recomendada para cualquier diseño de página o narrativa del producto.

## 🧭 Cobertura Funcional Completa (Vistas + Acciones)

Esta sección describe la experiencia completa de la SPA y lo que puede hacer un usuario en cada vista.

### Rutas y vistas reales

Las rutas activas están definidas en `frontend/src/App.tsx`.

#### Vistas públicas

- `/login`:
	- Iniciar sesión con email/username y contraseña.
	- Mensaje principal visible: "Organiza tus encuentros sin complicaciones".
- `/register`:
	- Crear cuenta nueva.

#### Vistas protegidas

- `/dashboard`:
	- Resumen de bienvenida.
	- Accesos rápidos a Mi Horario, Mis Grupos y Mi Perfil.
	- Muestra datos básicos de cuenta (email, username, fecha de alta).

- `/schedule` (Mi Horario):
	- Gestión mensual de disponibilidad personal por día/franja horaria.
	- Modo calendario y modo configuración rápida.
	- Edición puntual por día con modal.
	- Uso de presets rápidos para cargar horarios comunes.
	- Exportación de horario a JSON.
	- Importación de horario desde JSON.
	- Importación de eventos de calendario externo al horario (modal dedicado).

- `/calendar` (Calendario de Eventos):
	- Vista mensual/semanal/diaria con `react-big-calendar`.
	- Alta de evento al seleccionar un bloque de tiempo.
	- Edición de evento al seleccionar un evento existente.
	- Código visual diferenciado para eventos de fin de semana.

- `/groups` (Mis Grupos):
	- Listado de grupos del usuario.
	- Listado de invitaciones (pendientes, aceptadas/rechazadas según estado).
	- Crear grupo.
	- Unirse a grupo por código.
	- Alertas de invitaciones pendientes.

- `/groups/:id` (Detalle de Grupo):
	- Tab "Detalles del grupo":
		- Ver miembros y roles.
		- Ver código del grupo.
		- Editar grupo (admin).
		- Invitar por email (admin, o según permisos del grupo).
		- Cancelar invitaciones pendientes.
		- Remover miembros (admin).
		- Salir del grupo (miembro no creador).
		- Eliminar grupo (solo creador).
	- Tab "Disponibilidad grupal":
		- Ranking de mejores ventanas de coincidencia.
		- Vista calendario de disponibilidad.
		- Vista de eventos sugeridos para días útiles.
		- Vista de análisis de participación/disponibilidad.
		- Ajuste de criterios de disponibilidad del grupo.

- `/profile` (Mi Perfil):
	- Tab Información Personal:
		- Actualizar username, email y nombre.
	- Tab Seguridad:
		- Cambiar contraseña.
	- Tab Calendarios:
		- Ver estado de conexión por proveedor.
		- Conectar/desconectar calendarios externos.
	- Tab Zona Peligrosa:
		- Eliminar cuenta con confirmación de contraseña.

### Navegación y flujo principal

- Navbar en vistas autenticadas con accesos a Inicio, Mi Horario, Grupos y Perfil.
- Ruta raíz `/` redirige automáticamente:
	- a `/dashboard` si hay sesión válida.
	- a `/login` si no hay sesión.

## ⚙️ Funcionalidades Detalladas Por Dominio

### 1) Autenticación y sesión

- Registro de usuario.
- Login por email o username.
- Endpoint para obtener usuario actual autenticado.
- Logout protegido.
- Protección de rutas frontend con `PrivateRoute`.
- Manejo de expiración/invalidez de token con limpieza de sesión en frontend.

### 2) Horarios personales

- Modelo mensual por usuario (`year`, `month`) con disponibilidad por día.
- Slots por día con inicio/fin en formato HH:MM.
- Nota opcional por día.
- Operaciones:
	- Obtener mes.
	- Actualizar un día.
	- Eliminar disponibilidad de un día.
	- Obtener rango de meses.
	- Exportar JSON.
	- Importar JSON.

### 3) Eventos personales

- CRUD completo de eventos.
- Categorías, color y recurrencia.
- Disponibilidad por fecha específica.
- Calendario visual con edición desde la interfaz.

### 4) Grupos y membresía

- Crear grupo con código único.
- Listar grupos del usuario.
- Obtener detalle de grupo (solo miembros).
- Unirse por código de grupo.
- Editar datos de grupo (admins).
- Eliminar grupo (creador).
- Salir del grupo (miembro no creador).
- Remover miembros (admins).

### 5) Invitaciones

- Crear invitación por email.
- Ver invitaciones del usuario actual.
- Ver invitaciones de un grupo.
- Aceptar invitación.
- Rechazar invitación.
- Cancelar invitación (autor o admin).

### 6) Disponibilidad grupal

- Cálculo de ventanas perfectas y alternativas por día/mes.
- Estadísticas por mes y grupo.
- Vista simple (días con disponibilidad común).
- Vista detallada (horas exactas y miembros).
- Configuración de criterios de disponibilidad por grupo:
	- horario útil inicio/fin,
	- bloque mínimo,
	- umbral de alternativa,
	- horas mínimas requeridas.

### 7) Sugerencias de eventos para grupos

- Endpoint por grupo para obtener sugerencias en días útiles.
- Filtros por mes, categoría(s), fuente(s), ciudad y límite.
- Opciones para incluir alternativas e incluir/excluir eventos sin hora.
- Matching de evento contra ventanas horarias del grupo.

### 8) Perfil y cuenta

- Obtener perfil autenticado.
- Actualizar perfil.
- Cambiar contraseña.
- Eliminar cuenta.

### 9) Integración con calendarios externos

- Estado de conexión por proveedor.
- Flujo OAuth con URL de autorización y callback.
- Importación de eventos externos por mes.
- Desconexión de proveedor.

### 10) Plantillas de usuario

- CRUD de plantillas personalizadas (`/api/user-templates`).
- Reordenamiento de plantillas.

## 🔐 Roles y Permisos

En grupos existen tres estados prácticos de permiso:

- Creador:
	- Puede eliminar el grupo.
	- Es miembro administrador por definición funcional.
- Admin:
	- Puede editar grupo.
	- Puede gestionar miembros e invitaciones según reglas.
- Miembro:
	- Puede ver grupo y disponibilidad.
	- Puede salir del grupo.

La API valida pertenencia al grupo para vistas privadas de disponibilidad y detalle.

## 🚫 Lo que hoy NO hace la plataforma

### No implementado en esta versión

- Chat o mensajería interna entre miembros.
- Confirmación de eventos, reservas o compra de entradas.
- Notificaciones push nativas dentro de la app.
- App móvil nativa (iOS/Android) separada de la web.
- Descubrimiento público de grupos (el acceso es por invitación/código y membresía).

### Limitaciones actuales visibles en código

- La importación a "Mi Horario" desde calendario externo está centrada en Google Calendar en el modal actual.
- El comportamiento de integraciones OAuth depende de variables de entorno correctamente configuradas.
- El backend en Render free puede entrar en sleep; la primera request puede demorar.

## 📡 API Detallada (Resumen ejecutable)

### Health

- `GET /api/health`

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### Schedules

- `GET /api/schedules/:year/:month`
- `PUT /api/schedules/:year/:month/:day`
- `DELETE /api/schedules/:year/:month/:day`
- `GET /api/schedules/range/:startYear/:startMonth/:endYear/:endMonth`
- `GET /api/schedules/:year/:month/export`
- `POST /api/schedules/import`

### Events

- `GET /api/events/availability/:date`
- `POST /api/events`
- `GET /api/events`
- `GET /api/events/:id`
- `PUT /api/events/:id`
- `DELETE /api/events/:id`

### Groups

- `POST /api/groups`
- `GET /api/groups`
- `GET /api/groups/:id`
- `POST /api/groups/join/:code`
- `PUT /api/groups/:id`
- `DELETE /api/groups/:id`
- `POST /api/groups/:id/leave`
- `DELETE /api/groups/:id/members/:memberId`
- `PATCH /api/groups/:id/availability-settings`
- `GET /api/groups/:id/availability/simple`
- `GET /api/groups/:id/availability/detailed`
- `GET /api/groups/:id/event-suggestions`

### Invitations

- `POST /api/invitations`
- `GET /api/invitations/my`
- `GET /api/invitations/group/:groupId`
- `POST /api/invitations/:id/accept`
- `POST /api/invitations/:id/reject`
- `DELETE /api/invitations/:id`

### Availability

- `GET /api/availability/group/:groupId?month=MM&year=YYYY`

### Users

- `GET /api/users/profile`
- `PUT /api/users/profile`
- `POST /api/users/change-password`
- `DELETE /api/users/account`

### User Templates

- `GET /api/user-templates`
- `POST /api/user-templates`
- `PUT /api/user-templates/reorder`
- `PUT /api/user-templates/:id`
- `DELETE /api/user-templates/:id`

### Calendar Sync

- `GET /api/calendar/status`
- `GET /api/calendar/:provider/auth-url`
- `GET /api/calendar/:provider/callback`
- `GET /api/calendar/:provider/events?year=YYYY&month=MM`
- `DELETE /api/calendar/:provider/disconnect`

## 🛠️ Stack Tecnológico

### Frontend

- React 18
- Vite
- TailwindCSS
- Zustand (estado)
- React Router
- Axios
- React Big Calendar
- React Hook Form

### Backend

- Node.js
- Express.js
- Mongoose
- JWT
- bcrypt
- Helmet, CORS

## 🔐 Seguridad

- Autenticación JWT
- Contraseñas hasheadas con bcrypt
- Rate limiting
- Validación de inputs
- Headers de seguridad con Helmet
- CORS configurado

## 📝 Licencia

MIT

## 👥 Autor

Fabrizio Camaggi
