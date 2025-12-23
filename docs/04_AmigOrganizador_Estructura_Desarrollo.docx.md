# **AmigOrganizador**

*Estructura del Proyecto y Guía de Desarrollo*

# **1\. Estructura de Directorios**

## **1.1 Repositorio Frontend**

**amigorganizador-frontend/**  
├── public/  
└── favicon.ico  
├── src/  
├── components/  
├── common/          \# Componentes reutilizables  
├── Button.jsx  
├── Input.jsx  
├── Modal.jsx  
└── LoadingSpinner.jsx  
├── auth/  
├── LoginForm.jsx  
└── RegisterForm.jsx  
├── schedule/  
├── Calendar.jsx  
├── DayEditor.jsx  
├── TimeSlotPicker.jsx  
└── ImportExport.jsx  
└── groups/  
├── GroupCard.jsx  
├── GroupDetail.jsx  
├── MemberList.jsx  
└── AvailabilityView.jsx  
├── pages/  
├── Login.jsx  
├── Register.jsx  
├── Dashboard.jsx  
├── MySchedule.jsx  
├── Groups.jsx  
├── GroupView.jsx  
└── Profile.jsx  
├── services/  
├── api.js           \# Configuración Axios  
├── authService.js  
├── scheduleService.js  
└── groupService.js  
├── store/  
├── authStore.js     \# Estado de autenticación  
├── scheduleStore.js  
└── groupStore.js  
├── utils/  
├── dateHelpers.js  
├── validators.js  
└── constants.js  
├── App.jsx  
├── main.jsx  
└── index.css  
├── .env.example  
├── .gitignore  
├── package.json  
├── vite.config.js  
├── tailwind.config.js  
└── README.md

## **1.2 Repositorio Backend**

**amigorganizador-backend/**  
├── src/  
├── config/  
├── database.js      \# Conexión MongoDB  
└── env.js           \# Variables de entorno  
├── models/  
├── User.js  
├── Schedule.js  
├── Group.js  
└── Invitation.js  
├── controllers/  
├── authController.js  
├── scheduleController.js  
├── groupController.js  
└── userController.js  
├── routes/  
├── authRoutes.js  
├── scheduleRoutes.js  
├── groupRoutes.js  
└── userRoutes.js  
├── middleware/  
├── auth.js          \# Verificación JWT  
├── validation.js    \# Express-validator  
└── errorHandler.js  \# Manejo errores  
├── utils/  
├── jwt.js  
├── generateCode.js  \# Códigos únicos grupos  
└── availabilityCalc.js \# Algoritmo coincidencias  
└── server.js         \# Entry point  
├── .env.example  
├── .gitignore  
├── package.json  
└── README.md

# **2\. Flujo de Desarrollo Recomendado**

## **2.1 Fases de Implementación**

### **Fase 1: Setup Inicial y Autenticación**

1. Configurar repositorios (frontend y backend)  
2. Setup MongoDB Atlas (crear cluster, configurar usuario)  
3. Implementar modelo User y autenticación JWT  
4. Crear endpoints de registro y login  
5. Desarrollar UI de registro y login en frontend  
6. Implementar sistema de rutas protegidas

***Entregable:** Sistema de autenticación funcional con registro, login y protección de rutas*

### **Fase 2: Gestión de Horarios Personal**

7. Crear modelo Schedule en backend  
8. Implementar endpoints CRUD para horarios  
9. Desarrollar componente Calendar con React Big Calendar  
10. Crear modal DayEditor para edición de disponibilidad  
11. Implementar edición múltiple de días  
12. Agregar funcionalidad importación/exportación JSON

***Entregable:** Usuario puede gestionar su horario mensual completo de forma intuitiva*

### **Fase 3: Grupos y Invitaciones**

13. Crear modelos Group e Invitation  
14. Implementar endpoints para gestión de grupos  
15. Desarrollar utilidad para generar códigos únicos  
16. Crear UI para creación y listado de grupos  
17. Implementar sistema de invitaciones por código  
18. Agregar funcionalidad de gestión de miembros

***Entregable:** Usuarios pueden crear grupos, invitar amigos y gestionar membresías*

### **Fase 4: Visualización de Disponibilidad Grupal**

19. Desarrollar algoritmo de cálculo de coincidencias  
20. Implementar endpoint para disponibilidad grupal  
21. Crear componente AvailabilityView con heat map  
22. Implementar vista detallada por día con timeline  
23. Agregar filtros de disponibilidad

***Entregable:** Grupos pueden ver cuándo hay coincidencias de disponibilidad entre miembros*

### **Fase 5: Perfil de Usuario y Pulido**

24. Crear página de perfil con edición de datos  
25. Implementar cambio de contraseña  
26. Agregar opción de eliminar cuenta  
27. Mejorar diseño y responsividad general  
28. Optimizar performance (lazy loading, memoization)  
29. Testing y corrección de bugs

***Entregable:** Aplicación completa, pulida y lista para MVP*

### **Fase 6: Deploy y Configuración Producción**

30. Configurar Netlify para frontend  
31. Configurar Render para backend  
32. Conectar MongoDB Atlas en producción  
33. Configurar variables de entorno en ambos servicios  
34. Implementar monitoreo básico (Sentry)  
35. Testing en producción y ajustes finales

***Entregable:** Aplicación desplegada y accesible públicamente*

# **3\. Guías de Desarrollo Específicas**

## **3.1 Configuración Inicial Backend**

**Instalación de Dependencias:**

npm install express mongoose bcrypt jsonwebtoken cors helmet express-validator express-rate-limit dotenv

**Estructura server.js:**

* Importar dependencias y configuración  
* Conectar a MongoDB  
* Configurar middleware (CORS, helmet, rate limiting, body parser)  
* Registrar rutas  
* Middleware de manejo de errores  
* Iniciar servidor

## **3.2 Configuración Inicial Frontend**

**Crear Proyecto con Vite:**

npm create vite@latest amigorganizador-frontend \-- \--template react

**Instalar Dependencias:**

npm install react-router-dom zustand axios react-hook-form date-fns react-big-calendar

npm install \-D tailwindcss postcss autoprefixer

npx tailwindcss init \-p

**Configurar Axios Instance:**

* Crear instancia con baseURL desde variable de entorno  
* Interceptor para agregar token JWT en headers  
* Interceptor para manejo de errores (401, 403, etc.)

## **3.3 Implementación de Autenticación JWT**

**Backend \- Generación de Token:**

* Crear función generateToken en utils/jwt.js  
* Payload: userId, email, iat, exp (2 horas)  
* Firmar con JWT\_SECRET desde variables de entorno

**Backend \- Middleware de Autenticación:**

* Extraer token de header Authorization (Bearer)  
* Verificar y decodificar token  
* Agregar userId a req.user  
* Manejo de errores (token inválido, expirado)

**Frontend \- Almacenamiento de Token:**

* Guardar en localStorage tras login exitoso  
* Leer token al iniciar app (persistencia de sesión)  
* Eliminar token al hacer logout

## **3.4 Algoritmo de Cálculo de Disponibilidad Grupal**

**Lógica de Implementación:**

36. Recibir mes, año y groupId como parámetros  
37. Obtener todos los miembros del grupo  
38. Para cada miembro, obtener su Schedule del mes solicitado  
39. Crear estructura de datos por día (1-31)  
40. Para cada día, dividir en bloques de 30 minutos (48 bloques/día)  
41. Iterar sobre cada bloque horario y contar cuántos miembros están disponibles  
42. Calcular porcentaje de disponibilidad por bloque  
43. Retornar objeto con disponibilidad por día y detalles por franja

**Optimizaciones:**

* Cachear resultados por 5 minutos (evitar recalcular constantemente)  
* Invalidar caché cuando algún miembro actualiza su horario  
* Limitar grupos a máximo 50 miembros

# **4\. Configuración de Deploy**

## **4.1 Netlify (Frontend)**

**Pasos:**

44. Crear cuenta en Netlify  
45. Conectar repositorio de GitHub  
46. Configurar build settings:

\- Build command: npm run build  
\- Publish directory: dist

47. Agregar variable de entorno VITE\_API\_URL con URL del backend  
48. Deploy automático en cada push a main

**Configurar Redirects (para SPA):**

Crear archivo netlify.toml en raíz del proyecto:

\[\[redirects\]\]  from \= "/\*"  to \= "/index.html"  status \= 200

## **4.2 Render (Backend)**

**Pasos:**

49. Crear cuenta en Render  
50. Crear nuevo Web Service  
51. Conectar repositorio de GitHub  
52. Configuraciones:

\- Name: amigorganizador-api  
\- Environment: Node  
\- Build Command: npm install  
\- Start Command: node src/server.js  
\- Plan: Free

53. Agregar variables de entorno:

\- MONGODB\_URI  
\- JWT\_SECRET  
\- NODE\_ENV=production  
\- PORT=10000 (Render usa este puerto)

54. Deploy automático en cada push

## **4.3 MongoDB Atlas**

**Configuración:**

55. Crear cuenta en MongoDB Atlas  
56. Crear cluster gratuito (M0)  
57. Configurar usuario de base de datos  
58. Whitelist IP de Render (o permitir desde cualquier IP: 0.0.0.0/0)  
59. Copiar connection string  
60. Agregar connection string a variables de entorno de Render

# **5\. Buenas Prácticas y Consideraciones**

## **5.1 Seguridad**

* NUNCA commitear archivos .env con credenciales reales  
* Usar JWT\_SECRET suficientemente largo (mínimo 32 caracteres aleatorios)  
* Validar todos los inputs en backend (express-validator)  
* Implementar rate limiting en endpoints sensibles  
* Configurar CORS restrictivamente en producción

## **5.2 Performance**

* Crear índices apropiados en MongoDB desde el inicio  
* Implementar lazy loading en componentes grandes  
* Usar memoization (useMemo, useCallback) en cálculos pesados  
* Implementar loading states para mejorar percepción de velocidad  
* Monitorear uso de MongoDB para no exceder límites gratuitos

## **5.3 Código Limpio**

* Mantener componentes pequeños y enfocados (Single Responsibility)  
* Extraer lógica compleja a custom hooks  
* Usar nombres descriptivos para variables y funciones  
* Comentar lógica compleja o no obvia  
* Mantener consistencia en estilo de código (usar ESLint/Prettier)

## **5.4 Testing**

* Aunque no es requisito para MVP, considerar agregar tests en iteraciones futuras  
* Prioridad: tests de endpoints críticos (autenticación, disponibilidad grupal)  
* Herramientas recomendadas: Jest \+ React Testing Library para frontend, Jest \+ Supertest para backend

# **6\. Siguientes Pasos Post-MVP**

## **6.1 Funcionalidades Extendidas**

* Sistema de notificaciones (email o in-app)  
* Integración con Google Calendar  
* Chat grupal básico  
* Sugerencias inteligentes de horarios  
* Sistema de votación para eventos

## **6.2 Mejoras Técnicas**

* Implementar refresh tokens para sesiones más largas  
* Agregar sistema de logs estructurado  
* Implementar CI/CD con tests automáticos  
* Considerar migración a TypeScript para mejor type safety  
* Implementar Progressive Web App (PWA) para experiencia móvil mejorada