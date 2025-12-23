# **AmigOrganizador**

_Especificaciones Funcionales_

# **1\. Módulo de Autenticación**

## **1.1 Registro de Usuario**

**Descripción:** Permite a nuevos usuarios crear una cuenta en la plataforma

**Campos Requeridos:**

- Email (validación de formato, verificación de unicidad)
- Contraseña (mínimo 8 caracteres, al menos una mayúscula, un número)
- Nombre de usuario (único, 3-20 caracteres alfanuméricos)
- Nombre completo (opcional)

**Validaciones:**

- Email no registrado previamente
- Username no en uso
- Coincidencia de contraseña en campo de confirmación
- Todos los campos cumplen requisitos de formato

**Flujo:**

1. Usuario completa formulario de registro
2. Sistema valida datos en tiempo real (feedback instantáneo)
3. Al enviar, backend verifica unicidad de email y username
4. Contraseña se hashea con bcrypt
5. Usuario se crea en base de datos
6. Se genera JWT y usuario es redirigido a dashboard

## **1.2 Inicio de Sesión**

**Descripción:** Autenticación de usuarios existentes

**Campos:**

- Email o username
- Contraseña

**Funcionalidades:**

- Opción 'Recordarme' (extiende duración del token)
- Link a recuperación de contraseña
- Rate limiting: máximo 5 intentos por 15 minutos

**Manejo de Errores:**

- Mensaje genérico 'Credenciales inválidas' (no especificar si email o password)
- Bloqueo temporal tras 5 intentos fallidos

# **2\. Módulo de Gestión de Horarios**

## **2.1 Vista de Calendario Mensual**

**Descripción:** Interfaz principal para visualizar y editar disponibilidad del usuario

**Características:**

- Vista de mes completo con grid de días
- Navegación mes anterior/siguiente con botones
- Selector rápido de mes/año
- Cada día muestra resumen visual de disponibilidad (color coding)
- Click en día abre modal de edición detallada

**Estados Visuales:**

- Verde: Completamente disponible
- Amarillo: Parcialmente disponible
- Gris: Sin disponibilidad definida
- Rojo: No disponible (ocupado todo el día)

## **2.2 Edición de Disponibilidad Diaria**

**Descripción:** Modal para definir franjas horarias específicas de disponibilidad en un día

**Funcionalidades:**

- Agregar múltiples franjas horarias para el día seleccionado
- Cada franja: hora inicio y hora fin (selectores de 30 min de intervalo)
- Botón '+' para agregar nueva franja
- Botón 'x' para eliminar franja
- Opción 'Todo el día disponible' (shortcut: 00:00 \- 23:59)
- Opción 'No disponible' (marca día como ocupado)
- Visualización en tiempo real de franjas agregadas

**Validaciones:**

- Hora fin debe ser posterior a hora inicio
- Detección de solapamiento entre franjas (warning, no bloqueo)
- Mínimo 30 minutos de duración por franja

## **2.3 Edición Rápida Múltiple**

**Descripción:** Funcionalidad para aplicar misma disponibilidad a múltiples días simultáneamente

**Casos de Uso:**

- Copiar disponibilidad de un día a otros días específicos
- Aplicar patrón semanal (ej: Lun-Vie 9:00-18:00)
- Marcar rango de días como no disponibles

**Flujo:**

7. Usuario activa modo 'Edición múltiple'
8. Selecciona múltiples días en calendario (checkboxes o multi-select)
9. Define disponibilidad que se aplicará
10. Confirma aplicación masiva
11. Sistema actualiza todos los días seleccionados

## **2.4 Importación de Horarios (JSON)**

**Descripción:** Permite cargar horarios desde archivo JSON estructurado

**Formato JSON Esperado:**

```json
{ "month": 1, "year": 2025, "availability": \[ { "date": "2025-01-15", "timeSlots": \[ { "start": "09:00", "end": "12:00" }, { "start": "14:00", "end": "18:00" } \] } \]}
```

**Funcionalidades:**

- Botón 'Descargar plantilla' para obtener formato JSON correcto
- Drag & drop o selector de archivos
- Validación de estructura JSON
- Preview de datos a importar antes de confirmar
- Opciones: 'Sobrescribir mes completo' o 'Agregar a disponibilidad existente'
- Reporte de éxito/errores tras importación

## **2.5 Exportación de Horarios**

**Descripción:** Descarga de horarios en formato JSON para backup o transferencia

**Opciones de Exportación:**

- Mes específico
- Rango de meses (ej: próximos 3 meses)
- Todos los horarios del usuario

# **3\. Módulo de Grupos**

## **3.1 Creación de Grupo**

**Descripción:** Permite a usuarios crear mini-comunidades para compartir horarios

**Campos:**

- Nombre del grupo (obligatorio, 3-50 caracteres)
- Descripción (opcional, máximo 200 caracteres)
- Imagen de grupo (opcional, máximo 1MB)

**Configuración Automática:**

- Generación de código de invitación único (8 caracteres alfanuméricos)
- Creador asignado como administrador automáticamente
- Fecha de creación registrada

## **3.2 Gestión de Miembros**

**Descripción:** Administración de usuarios dentro del grupo

**Roles:**

- **Administrador:** Puede editar grupo, remover miembros, eliminar grupo
- **Miembro:** Puede ver horarios compartidos, salir del grupo

**Funcionalidades de Administrador:**

- Ver lista de miembros con fechas de ingreso
- Promover miembro a administrador
- Remover miembros del grupo
- Regenerar código de invitación (invalida el anterior)

## **3.3 Sistema de Invitaciones**

**Descripción:** Mecanismo para agregar nuevos miembros al grupo

**Métodos de Invitación:**

12. **Por código:** Usuario copia código único del grupo, lo comparte, destinatario lo ingresa en plataforma
13. **Por email:** Administrador envía invitación a email, destinatario recibe link que acepta automáticamente

**Flujo de Invitación por Código:**

14. Usuario ve código en página del grupo
15. Botón 'Copiar código' copia al portapapeles
16. Usuario comparte código por WhatsApp/Telegram/etc
17. Destinatario abre AmigOrganizador, va a 'Unirse a grupo'
18. Ingresa código de 8 caracteres
19. Sistema valida código y muestra preview del grupo
20. Usuario confirma y se une al grupo

## **3.4 Visualización de Disponibilidad Grupal**

**Descripción:** Interfaz que muestra cuándo todos o la mayoría de los miembros están disponibles

**Componentes de la Vista:**

- Calendario mensual del grupo
- Color coding por nivel de coincidencia:

\- Verde oscuro: 100% de miembros disponibles  
\- Verde claro: 75-99% disponibles  
\- Amarillo: 50-74% disponibles  
\- Naranja: 25-49% disponibles  
\- Rojo: \<25% disponibles

- Click en día muestra detalle por franja horaria

**Vista Detallada de Día:**

- Timeline de 24 horas dividido en bloques de 30 minutos
- Cada franja muestra nombres de miembros disponibles
- Identificación visual de franjas con máxima coincidencia
- Contador de personas disponibles por bloque horario

**Filtros:**

- Mostrar solo días donde \[X\] personas o más están disponibles
- Rango horario (ej: solo mostrar 18:00-22:00)
- Días de la semana específicos

# **4\. Módulo de Perfil de Usuario**

## **4.1 Información Personal**

**Campos Editables:**

- Nombre completo
- Username (validación de unicidad)
- Email (requiere re-verificación si cambia)
- Foto de perfil (opcional, máximo 2MB)

## **4.2 Seguridad**

- Cambio de contraseña (requiere contraseña actual)
- Visualización de última conexión
- Opción de cerrar sesión en todos los dispositivos

## **4.3 Privacidad**

- Lista de grupos a los que pertenece
- Opción de salir de grupos
- Eliminar cuenta (confirmación con password, eliminación permanente)

# **5\. Notificaciones (Opcional \- Versión Futura)**

## **5.1 Tipos de Notificaciones**

- Invitación a grupo pendiente
- Nuevo miembro en grupo
- Cambio en disponibilidad grupal (nueva coincidencia de 100%)
- Recordatorio para actualizar horario (si lleva más de 2 semanas sin actualizar)

**\*Nota:** Las notificaciones serán implementadas en versión posterior. MVP solo incluye indicadores visuales en la interfaz.\*
