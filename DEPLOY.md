# 🚀 Guía de Deployment - AmigOrganizador

## 📋 Prerequisitos

- Cuenta en [Netlify](https://netlify.com)
- Cuenta en [Render](https://render.com)
- Repositorio en GitHub ya configurado ✅

---

## 🎨 Frontend en Netlify

### Paso 1: Conectar el Repositorio

1. Ve a [Netlify](https://app.netlify.com)
2. Click en **"Add new site"** → **"Import an existing project"**
3. Selecciona **GitHub** y autoriza
4. Busca y selecciona el repositorio: `FCamaggi/AmigOrganizador`

### Paso 2: Configurar el Build

Netlify debería detectar automáticamente la configuración desde `netlify.toml`, pero verifica:

- **Base directory**: `frontend`
- **Build command**: `npm install && npm run build`
- **Publish directory**: `frontend/dist`

### Paso 3: Variables de Entorno

Después del primer deploy, ve a **Site configuration → Environment variables** y agrega:

```
VITE_API_URL=https://tu-backend.onrender.com
```

⚠️ **IMPORTANTE**: Reemplaza con la URL real de tu backend de Render (la obtendrás en el siguiente paso)

### Paso 4: Deploy

1. Click en **"Deploy site"**
2. Espera a que termine el build (2-3 minutos)
3. Tu sitio estará en: `https://tu-sitio.netlify.app`

---

## ⚙️ Backend en Render

### Paso 1: Crear Web Service

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Click en **"New +"** → **"Web Service"**
3. Conecta tu repositorio de GitHub: `FCamaggi/AmigOrganizador`

### Paso 2: Configurar el Servicio

- **Name**: `amigorganizador-backend`
- **Region**: Oregon (US West)
- **Branch**: `master`
- **Root Directory**: `backend`
- **Runtime**: Node
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: Free

### Paso 3: Variables de Entorno

En la sección **Environment**, agrega estas variables:

```bash
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://amigorganizador_user:TU_PASSWORD@tu-cluster.mongodb.net/AmigOrganizador
JWT_SECRET=genera_un_string_aleatorio_de_64_caracteres_minimo
JWT_EXPIRES_IN=24h
FRONTEND_URL=https://tu-sitio.netlify.app
```

⚠️ **IMPORTANTE**:
- Usa la misma MONGODB_URI de tu `.env` local
- Genera un JWT_SECRET nuevo para producción (puede ser cualquier string aleatorio largo)
- Reemplaza FRONTEND_URL con la URL real de Netlify

### Paso 4: Deploy

1. Click en **"Create Web Service"**
2. Espera a que termine el deploy (3-5 minutos)
3. Tu backend estará en: `https://amigorganizador-backend.onrender.com`

---

## 🔗 Conectar Frontend y Backend

### Paso 1: Actualizar Frontend

1. Ve a **Netlify** → tu sitio → **Site configuration → Environment variables**
2. Actualiza `VITE_API_URL` con la URL real de Render:
   ```
   VITE_API_URL=https://amigorganizador-backend.onrender.com
   ```
3. Ve a **Deploys** → **Trigger deploy** → **Clear cache and deploy site**

### Paso 2: Actualizar Backend

1. Ve a **Render** → tu servicio → **Environment**
2. Actualiza `FRONTEND_URL` con la URL real de Netlify:
   ```
   FRONTEND_URL=https://tu-sitio.netlify.app
   ```
3. El servicio se redesplegará automáticamente

---

## ✅ Verificar el Deployment

### Frontend
- Abre `https://tu-sitio.netlify.app`
- Deberías ver la página de login
- Abre DevTools (F12) → Network → verifica que no haya errores CORS

### Backend
- Abre `https://amigorganizador-backend.onrender.com/api/health`
- Deberías ver: `{"status":"OK","timestamp":"..."}`

### Funcionalidad Completa
1. Registra un usuario nuevo
2. Inicia sesión
3. Crea un grupo
4. Agrega horarios

---

## 🐛 Troubleshooting

### Error CORS
- Verifica que `FRONTEND_URL` en Render coincida exactamente con la URL de Netlify
- No incluyas `/` al final de las URLs

### Backend no responde
- Render en plan Free duerme después de 15 min de inactividad
- La primera petición puede tardar 30-60 segundos en despertar

### Build falla en Netlify
- Verifica que `VITE_API_URL` esté configurada
- Revisa los logs en: Deploys → Failed deploy → View logs

### Build falla en Render
- Verifica que todas las variables de entorno estén configuradas
- Revisa los logs en: Logs (pestaña superior)

---

## 🔄 Deploys Automáticos

Ambas plataformas tienen **auto-deploy** activado por defecto:

- Cada `git push` a la rama `master` desplegará automáticamente
- Netlify: ~2-3 minutos
- Render: ~3-5 minutos

---

## 📱 URLs Finales

Guarda estas URLs para usar tu app:

- **Frontend**: `https://tu-sitio.netlify.app`
- **Backend**: `https://amigorganizador-backend.onrender.com`
- **Repositorio**: `https://github.com/FCamaggi/AmigOrganizador`

---

¡Listo! Tu aplicación está en producción 🎉
