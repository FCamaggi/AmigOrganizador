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
