# AmigOrganizador

Aplicación web para coordinar encuentros entre grupos de amigos mediante la gestión y compartición de horarios personales.

## 📋 Descripción

AmigOrganizador simplifica la coordinación de horarios entre grupos de amigos. Los usuarios pueden gestionar sus horarios mensuales y compartirlos con grupos específicos, identificando automáticamente cuándo todos están disponibles para reunirse.

## 🏗️ Arquitectura

- **Frontend:** React + Vite + TailwindCSS → Netlify
- **Backend:** Node.js + Express + MongoDB → Render
- **Base de Datos:** MongoDB Atlas (Free Tier)

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
