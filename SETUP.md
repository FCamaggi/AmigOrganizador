# 🚀 Guía de Setup Manual - AmigOrganizador

Esta guía te ayudará a completar la configuración inicial del proyecto.

## ✅ Pasos Completados

- ✅ Estructura de carpetas creada
- ✅ Backend configurado con todas las dependencias
- ✅ Frontend configurado con React + Vite + TailwindCSS
- ✅ Archivos base y servicios creados

## 📋 Pasos que DEBES Completar

### 1. Configurar MongoDB Atlas ⚠️ REQUERIDO

1. Ve a [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Crea una cuenta gratuita (si no tienes una)
3. Crea un nuevo cluster:

   - Click en "Build a Database"
   - Selecciona "M0 FREE" (Shared)
   - Elige una región cercana (ej: AWS / N. Virginia)
   - Dale un nombre al cluster
   - Click "Create"

4. Configura acceso a la base de datos:

   - **Database Access** (menú izquierdo):
     - Add New Database User
     - Username: `amigorganizador_user` (o el que prefieras)
     - Password: Genera una contraseña segura **¡GUÁRDALA!**
     - Database User Privileges: "Read and write to any database"
     - Click "Add User"

5. Configura acceso desde cualquier IP:

   - **Network Access** (menú izquierdo):
     - Add IP Address
     - Click "Allow Access from Anywhere"
     - IP: `0.0.0.0/0` (ya debería aparecer)
     - Click "Confirm"

6. Obtén tu Connection String:
   - Vuelve a "Database" (menú izquierdo)
   - Click en "Connect" en tu cluster
   - Click "Connect your application"
   - Copia el connection string (ej: `mongodb+srv://usuario:<password>@cluster.mongodb.net/`)
   - **REEMPLAZA** `<password>` con la contraseña que creaste
   - Agrega el nombre de la base de datos al final: `amigorganizador`
   - Resultado final: `mongodb+srv://usuario:tupassword@cluster.mongodb.net/amigorganizador?retryWrites=true&w=majority`

### 2. Configurar Variables de Entorno del Backend ⚠️ REQUERIDO

1. Navega a la carpeta del backend:

   ```bash
   cd backend
   ```

2. Crea tu archivo `.env` copiando el ejemplo:

   ```bash
   cp .env.example .env
   ```

3. Abre el archivo `.env` y edita:

   ```env
   PORT=5000
   NODE_ENV=development

   # Pega aquí tu connection string de MongoDB Atlas
   MONGODB_URI=mongodb+srv://usuario:tupassword@cluster.mongodb.net/amigorganizador?retryWrites=true&w=majority

   # Genera un JWT secret seguro (mínimo 32 caracteres aleatorios)
   # Puedes usar: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   JWT_SECRET=tu_super_secreto_jwt_key_minimo_32_caracteres_aleatorios_aqui

   JWT_EXPIRES_IN=2h
   FRONTEND_URL=http://localhost:5173
   ```

4. **IMPORTANTE:** Para generar un JWT_SECRET seguro, ejecuta en la terminal:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Copia el resultado y pégalo en JWT_SECRET

### 3. Probar el Backend

1. Asegúrate de estar en la carpeta `backend`
2. Inicia el servidor:

   ```bash
   npm run dev
   ```

3. Deberías ver:

   ```
   ✅ MongoDB conectado: cluster0.xxxxx.mongodb.net
   🚀 Servidor corriendo en modo development
   📡 Puerto: 5000
   🌐 URL: http://localhost:5000
   📋 Health check: http://localhost:5000/api/health
   ```

4. Abre tu navegador y ve a: `http://localhost:5000/api/health`
   - Deberías ver: `{"success":true,"message":"AmigOrganizador API funcionando correctamente","timestamp":"..."}`

### 4. Probar el Frontend

1. Abre una **nueva terminal** (mantén el backend corriendo)
2. Navega a la carpeta frontend:

   ```bash
   cd frontend
   ```

3. Inicia el servidor de desarrollo:

   ```bash
   npm run dev
   ```

4. Deberías ver:

   ```
   VITE v5.x.x  ready in xxx ms
   ➜  Local:   http://localhost:5173/
   ```

5. Abre tu navegador y ve a: `http://localhost:5173`

## 🎯 Próximos Pasos

Una vez que ambos servidores estén corriendo sin errores, estarás listo para comenzar el desarrollo.

### Fase 1: Sistema de Autenticación

Vamos a implementar:

- Modelo User en el backend
- Endpoints de registro y login
- Componentes de UI para login y registro
- Rutas protegidas en el frontend

### Fases Siguientes:

- Fase 2: Gestión de horarios personales
- Fase 3: Grupos e invitaciones
- Fase 4: Visualización de disponibilidad grupal
- Fase 5: Perfil y pulido
- Fase 6: Deploy a producción

## ⚠️ Troubleshooting

### Error: "MONGODB_URI no está definida"

- Asegúrate de haber creado el archivo `.env` en la carpeta `backend`
- Verifica que la variable MONGODB_URI esté correctamente escrita

### Error: "JWT_SECRET debe tener al menos 32 caracteres"

- Genera un secreto seguro con el comando proporcionado
- Asegúrate de que tenga al menos 32 caracteres

### Error al conectar a MongoDB

- Verifica que el connection string sea correcto
- Asegúrate de haber reemplazado `<password>` con tu contraseña real
- Verifica que hayas configurado "Allow Access from Anywhere" en Network Access

### Puerto 5000 o 5173 ya en uso

- Cambia el puerto en el archivo `.env` del backend (PORT=5001)
- O detén el proceso que esté usando el puerto

## 📞 ¿Necesitas Ayuda?

Si encuentras algún problema, revisa:

1. Los logs en la terminal
2. Que ambos servidores estén corriendo
3. Que las variables de entorno estén correctamente configuradas
4. La documentación en la carpeta `docs/`

---

**Una vez completado este setup, estarás listo para empezar el desarrollo de las funcionalidades principales. ¡Avísame cuando esté todo funcionando y continuaremos con la Fase 1!** 🚀
