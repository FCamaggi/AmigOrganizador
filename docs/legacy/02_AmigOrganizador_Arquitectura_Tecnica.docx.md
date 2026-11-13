# **AmigOrganizador**

*Arquitectura Técnica y Stack Tecnológico*

# **1\. Arquitectura General**

AmigOrganizador implementa una arquitectura de tres capas (frontend, backend, base de datos) utilizando servicios cloud con planes gratuitos generosos. El diseño prioriza simplicidad, escalabilidad y costo cero de operación.

## **1.1 Diagrama de Arquitectura**

**Cliente (Navegador)**

↓

**Frontend: React (SPA) \- Netlify**

↓

**Backend: Node.js \+ Express (API REST) \- Render**

↓

**Base de Datos: MongoDB Atlas (Free Tier)**

# **2\. Stack Tecnológico Detallado**

## **2.1 Frontend**

| Tecnología | Descripción y Justificación |
| ----- | ----- |
| **React 18+** | Framework principal. Ecosistema maduro, excelente para UIs interactivas, comunidad activa |
| **Vite** | Build tool moderno. Desarrollo rápido con HMR, bundle optimizado para producción |
| **React Router** | Navegación y rutas. Estándar para SPAs, manejo de rutas protegidas |
| **Zustand** | State management. Ligero, simple, menos boilerplate que Redux |
| **TailwindCSS** | Estilos utility-first. Desarrollo rápido, diseño consistente, bundle pequeño |
| **React Hook Form** | Gestión de formularios. Performante, validaciones integradas, UX fluida |
| **Axios** | Cliente HTTP. Interceptores para tokens, manejo de errores centralizado |
| **date-fns** | Manipulación de fechas. Funcional, tree-shakeable, locale support |
| **React Big Calendar** | Visualización de calendarios. Componente robusto, customizable, vistas múltiples |

## **2.2 Backend**

| Tecnología | Descripción y Justificación |
| ----- | ----- |
| **Node.js 20 LTS** | Runtime JavaScript. Performante, ecosistema amplio, mismo lenguaje que frontend |
| **Express.js** | Framework web. Minimalista, flexible, middleware ecosystem robusto |
| **Mongoose** | ODM para MongoDB. Schemas tipados, validaciones, queries expresivas |
| **JWT** | Autenticación. Stateless, seguro, estándar de la industria |
| **bcrypt** | Hashing de contraseñas. Algoritmo probado, resistente a ataques |
| **express-validator** | Validación de inputs. Middleware para sanitización y validación de datos |
| **cors** | CORS middleware. Configuración de políticas cross-origin |
| **helmet** | Security headers. Protección contra vulnerabilidades comunes |
| **express-rate-limit** | Rate limiting. Protección contra abuso de API |

## **2.3 Base de Datos**

| Aspecto | Detalles |
| ----- | ----- |
| **Servicio** | MongoDB Atlas \- Free Tier M0 |
| **Capacidad** | 512 MB de almacenamiento, sin límite de documentos |
| **Ventajas** | NoSQL flexible, buena para datos con estructura variable (horarios), backups automáticos |
| **Consideraciones** | Diseñar índices eficientes, optimizar queries para minimizar operaciones de lectura |

# **3\. Infraestructura y Deploy**

## **3.1 Netlify (Frontend)**

* **Plan:** Free Tier \- 100 GB bandwidth/mes, builds ilimitados  
* **Features:** Deploy continuo desde Git, HTTPS automático, CDN global  
* **Configuración:** Build command: npm run build, Publish directory: dist  
* **Variables de entorno:** VITE\_API\_URL para la URL del backend

## **3.2 Render (Backend)**

* **Plan:** Free Tier \- 750 horas/mes, spin down después de inactividad  
* **Tipo:** Web Service con Node.js  
* **Limitación:** Se duerme tras 15 min de inactividad, primera request tarda \~30-60 seg en despertar  
* **Solución:** Implementar loading state en frontend para primera carga, considerar ping periódico opcional  
* **Variables de entorno:** MONGODB\_URI, JWT\_SECRET, PORT, NODE\_ENV

# **4\. Modelo de Datos**

## **4.1 Colecciones Principales**

### **Users**

**Campos:** \_id, email (único), password (hash), username, fullName, createdAt, lastLogin

### **Schedules**

**Campos:** \_id, userId, month, year, availability (array de objetos: {date, timeSlots\[{start, end}\]})

### **Groups**

**Campos:** \_id, name, description, createdBy, members\[{userId, joinedAt, role}\], createdAt, inviteCode

### **Invitations**

**Campos:** \_id, groupId, invitedBy, invitedEmail, status (pending/accepted/rejected), createdAt, expiresAt

## **4.2 Índices Requeridos**

* Users: email (único), username (único)  
* Schedules: userId \+ month \+ year (compuesto, único)  
* Groups: inviteCode (único), createdBy  
* Invitations: groupId, invitedEmail, status

# **5\. API REST \- Endpoints Principales**

## **5.1 Autenticación**

* POST /api/auth/register \- Registro de usuario  
* POST /api/auth/login \- Inicio de sesión  
* POST /api/auth/logout \- Cierre de sesión  
* GET /api/auth/me \- Obtener usuario actual

## **5.2 Horarios**

* GET /api/schedules/:userId/:month/:year \- Obtener horario  
* POST /api/schedules \- Crear/actualizar horario  
* POST /api/schedules/import \- Importar desde JSON

## **5.3 Grupos**

* POST /api/groups \- Crear grupo  
* GET /api/groups \- Listar grupos del usuario  
* GET /api/groups/:id \- Detalle de grupo  
* PUT /api/groups/:id \- Actualizar grupo  
* DELETE /api/groups/:id \- Eliminar grupo  
* GET /api/groups/:id/availability \- Ver disponibilidad grupal

## **5.4 Invitaciones**

* POST /api/invitations \- Enviar invitación  
* GET /api/invitations \- Listar invitaciones pendientes  
* POST /api/invitations/:id/accept \- Aceptar invitación

# **6\. Seguridad**

## **6.1 Medidas Implementadas**

* **Autenticación:** JWT con tokens de corta duración (2h), refresh tokens opcionales  
* **Contraseñas:** Hashing con bcrypt (10 rounds), validación de fortaleza  
* **Rate limiting:** 100 requests/15min por IP para endpoints sensibles  
* **Validación:** Sanitización de inputs con express-validator  
* **Headers:** Helmet para security headers (CSP, HSTS, etc.)  
* **CORS:** Configuración restrictiva solo para frontend en producción

## **6.2 Variables de Entorno Sensibles**

* JWT\_SECRET: Clave para firmar tokens (mínimo 32 caracteres aleatorios)  
* MONGODB\_URI: Connection string de MongoDB Atlas  
* NODE\_ENV: production/development

# **7\. Optimizaciones de Performance**

## **7.1 Frontend**

* Code splitting con React.lazy() para rutas  
* Memoización con useMemo/useCallback en componentes pesados  
* Debouncing en inputs de búsqueda y filtros  
* Lazy loading de calendario solo cuando se muestra

## **7.2 Backend**

* Índices MongoDB optimizados para queries frecuentes  
* Proyecciones para retornar solo campos necesarios  
* Agregaciones eficientes para cálculo de disponibilidad grupal  
* Compresión de respuestas con compression middleware

# **8\. Monitoreo y Logging**

## **8.1 Herramientas Recomendadas**

* **Sentry:** Tracking de errores en frontend y backend (free tier generoso)  
* **Morgan:** HTTP request logging en backend  
* **MongoDB Atlas:** Métricas nativas de uso de base de datos

## **8.2 Métricas Clave a Monitorear**

* Tiempo de respuesta de API endpoints  
* Errores 5xx y 4xx por endpoint  
* Uso de almacenamiento MongoDB (alertar al 80%)  
* Tiempo de cold start de Render (despertar del sleep)

# **9\. Consideraciones de Escalabilidad**

## **9.1 Límites del Free Tier**

* **MongoDB:** 512 MB (suficiente para \~50K usuarios activos con horarios mensuales)  
* **Render:** 750h/mes (suficiente para un servicio), 512 MB RAM  
* **Netlify:** 100 GB bandwidth (suficiente para \~100K visitas/mes)

## **9.2 Estrategias de Optimización**

* Implementar paginación en listados de grupos  
* Lazy loading de horarios (solo cargar mes actual)  
* Comprimir imágenes de perfil agresivamente  
* Establecer límites: máximo 10 grupos por usuario, 50 miembros por grupo

# **10\. Plan de Migración (Si se Exceden Límites)**

Si el proyecto crece más allá de los límites gratuitos:

* **MongoDB:** Upgrade a tier M2 ($9/mes) para 2GB  
* **Render:** Upgrade a plan Starter ($7/mes) sin sleep  
* **Alternativa:** Migrar backend a Railway (similar a Render) o considerar VPS (DigitalOcean $4/mes)