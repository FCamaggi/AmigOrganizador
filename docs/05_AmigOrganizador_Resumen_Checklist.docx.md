# **AmigOrganizador**

*Resumen Ejecutivo y Checklist de Desarrollo*

# **1\. Resumen Ejecutivo**

## **1.1 ¿Qué es AmigOrganizador?**

AmigOrganizador es una aplicación web que simplifica la coordinación de encuentros entre grupos de amigos. Permite a los usuarios gestionar sus horarios mensuales y compartirlos con grupos específicos, identificando automáticamente cuándo todos están disponibles para reunirse.

## **1.2 Valor Principal**

Elimina las largas cadenas de mensajes para coordinar horarios, mostrando de un vistazo cuándo hay coincidencias de disponibilidad entre todos los miembros de un grupo.

## **1.3 Stack Tecnológico**

| Componente | Tecnología |
| ----- | ----- |
| **Frontend** | React 18 \+ Vite \+ TailwindCSS \+ Zustand |
| **Backend** | Node.js \+ Express \+ Mongoose |
| **Base de Datos** | MongoDB Atlas (Free Tier \- 512 MB) |
| **Hosting Frontend** | Netlify (Free \- 100 GB bandwidth) |
| **Hosting Backend** | Render (Free \- 750h/mes) |

## **1.4 Funcionalidades Clave del MVP**

* Sistema de autenticación (registro, login)  
* Gestión de horarios personales mes a mes  
* Creación y administración de grupos de amigos  
* Sistema de invitaciones por código único  
* Visualización de disponibilidad grupal con heat map  
* Importación/exportación de horarios en JSON

# **2\. Checklist de Desarrollo**

## **2.1 Fase 1: Setup y Autenticación**

### **Backend**

* Inicializar proyecto Node.js con Express  
* Configurar conexión a MongoDB Atlas  
* Crear modelo User con Mongoose  
* Implementar hashing de contraseñas con bcrypt  
* Crear utilidad de generación de JWT  
* Implementar middleware de autenticación JWT  
* Crear endpoint POST /api/auth/register  
* Crear endpoint POST /api/auth/login  
* Crear endpoint GET /api/auth/me  
* Configurar CORS, helmet, rate-limiting  
* Probar endpoints con Postman/Insomnia

### **Frontend**

* Inicializar proyecto React con Vite  
* Configurar TailwindCSS  
* Instalar dependencias (react-router, zustand, axios, react-hook-form)  
* Configurar instancia de Axios con interceptores  
* Crear store de autenticación con Zustand  
* Desarrollar componente LoginForm  
* Desarrollar componente RegisterForm  
* Crear páginas Login y Register  
* Implementar rutas protegidas con React Router  
* Probar flujo completo de registro y login

## **2.2 Fase 2: Gestión de Horarios**

### **Backend**

* Crear modelo Schedule  
* Crear índice compuesto en userId \+ month \+ year  
* Implementar endpoint GET /api/schedules/:userId/:month/:year  
* Implementar endpoint POST /api/schedules (crear/actualizar)  
* Implementar endpoint POST /api/schedules/import  
* Validar formato de timeSlots y fechas

### **Frontend**

* Instalar y configurar react-big-calendar  
* Crear componente Calendar para vista mensual  
* Crear componente DayEditor (modal de edición)  
* Crear componente TimeSlotPicker  
* Implementar color coding de días (verde/amarillo/gris/rojo)  
* Desarrollar funcionalidad de edición múltiple  
* Crear componente ImportExport  
* Implementar descarga de plantilla JSON  
* Implementar importación con validación  
* Implementar exportación de horarios  
* Crear página MySchedule

## **2.3 Fase 3: Grupos e Invitaciones**

### **Backend**

* Crear modelo Group  
* Crear modelo Invitation  
* Crear utilidad generateCode para códigos únicos  
* Implementar endpoint POST /api/groups (crear grupo)  
* Implementar endpoint GET /api/groups (listar grupos del usuario)  
* Implementar endpoint GET /api/groups/:id  
* Implementar endpoint PUT /api/groups/:id  
* Implementar endpoint DELETE /api/groups/:id  
* Implementar endpoint POST /api/invitations  
* Implementar endpoint POST /api/invitations/:id/accept  
* Implementar endpoint POST /api/groups/join (por código)  
* Validar permisos (solo admin puede editar/eliminar grupo)

### **Frontend**

* Crear componente GroupCard  
* Crear componente GroupDetail  
* Crear componente MemberList  
* Crear formulario de creación de grupo  
* Implementar visualización de código de invitación  
* Implementar funcionalidad 'Copiar código'  
* Crear interfaz para unirse a grupo por código  
* Implementar gestión de miembros (remover, promover)  
* Crear página Groups  
* Crear página GroupView

## **2.4 Fase 4: Disponibilidad Grupal**

### **Backend**

* Crear utilidad availabilityCalc.js  
* Implementar algoritmo de cálculo de coincidencias  
* Optimizar con división en bloques de 30 minutos  
* Implementar endpoint GET /api/groups/:id/availability  
* Considerar implementar caching básico

### **Frontend**

* Crear componente AvailabilityView  
* Implementar heat map con color coding  
* Crear vista detallada de día con timeline  
* Mostrar nombres de miembros disponibles por franja  
* Implementar filtros (mínimo de personas, rango horario)  
* Agregar loading states para cálculos

## **2.5 Fase 5: Perfil y Pulido**

### **Backend**

* Implementar endpoint PUT /api/users/profile  
* Implementar endpoint POST /api/users/change-password  
* Implementar endpoint DELETE /api/users/account

### **Frontend**

* Crear página Profile  
* Implementar edición de datos personales  
* Implementar cambio de contraseña  
* Implementar eliminación de cuenta con confirmación  
* Mejorar responsividad móvil en todas las páginas  
* Implementar lazy loading en rutas  
* Agregar memoization en componentes pesados  
* Implementar manejo de errores global  
* Agregar loading spinners consistentes  
* Pulir diseño y consistencia visual  
* Testing manual exhaustivo

## **2.6 Fase 6: Deploy**

### **Configuración Netlify**

* Crear cuenta en Netlify  
* Conectar repositorio frontend  
* Configurar build command y publish directory  
* Agregar variable VITE\_API\_URL  
* Crear archivo netlify.toml para redirects

### **Configuración Render**

* Crear cuenta en Render  
* Crear Web Service  
* Conectar repositorio backend  
* Configurar build y start commands  
* Agregar variables de entorno (MONGODB\_URI, JWT\_SECRET, etc)  
* Verificar que el servicio inicia correctamente

### **MongoDB Atlas**

* Crear cluster gratuito M0  
* Configurar usuario de base de datos  
* Whitelist IP de Render  
* Copiar connection string a Render

### **Testing Producción**

* Verificar registro de usuario funciona  
* Verificar login funciona  
* Verificar creación de horarios  
* Verificar creación de grupos  
* Verificar invitaciones por código  
* Verificar visualización de disponibilidad grupal  
* Verificar importación/exportación JSON  
* Probar desde dispositivo móvil  
* Verificar que CORS está configurado correctamente

# **3\. Recursos Esenciales**

## **3.1 Variables de Entorno**

**Backend (.env):**

PORT=5000MONGODB\_URI=mongodb+srv://...JWT\_SECRET=your\_super\_secret\_key\_min\_32\_charsNODE\_ENV=developmentFRONTEND\_URL=http://localhost:5173

**Frontend (.env):**

VITE\_API\_URL=http://localhost:5000/api

## **3.2 Scripts Package.json**

**Backend:**

"dev": "nodemon src/server.js""start": "node src/server.js"

**Frontend:**

"dev": "vite""build": "vite build""preview": "vite preview"

# **4\. Consideraciones Finales**

## **4.1 Prioridades de Desarrollo**

* **Funcionalidad \> Estética:** Priorizar que todo funcione antes de pulir diseño  
* **Core features primero:** Calendario y grupos son esenciales, perfil puede ser básico inicialmente  
* **Testing continuo:** Probar cada feature inmediatamente después de implementarla

## **4.2 Gestión de Tiempo**

* Fase 1: 3-5 días  
* Fase 2: 5-7 días  
* Fase 3: 4-6 días  
* Fase 4: 4-6 días  
* Fase 5: 3-5 días  
* Fase 6: 2-3 días

**Total estimado: 21-32 días de desarrollo**

## **4.3 Recursos de Documentación**

* React: https://react.dev  
* React Router: https://reactrouter.com  
* TailwindCSS: https://tailwindcss.com/docs  
* Zustand: https://github.com/pmndrs/zustand  
* Express: https://expressjs.com  
* Mongoose: https://mongoosejs.com  
* MongoDB Atlas: https://docs.atlas.mongodb.com  
* Netlify: https://docs.netlify.com  
* Render: https://render.com/docs