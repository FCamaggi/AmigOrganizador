# 🧪 Plan de Testeo Completo - AmigOrganizador (TODAS LAS FUNCIONALIDADES)

## 📋 Preparación Inicial

### Navegadores a Utilizar

- [x] **Chrome** (navegador principal)
- [x] **Firefox** (validación cross-browser)
- [x] **Edge** (opcional, validación adicional)

### Cuentas de Usuario Necesarias

1. **Usuario Principal (Usuario A)** - Para testeo completo

   - Email: `usuarioA@test.com` / Password: `Test123!`
   - Username: `usuarioA`

2. **Usuario Secundario (Usuario B)** - Para testeo de grupos y colaboración

   - Email: `usuarioB@test.com` / Password: `Test123!`
   - Username: `usuarioB`

3. **Usuario Terciario (Usuario C)** - Para testeo de grupos grandes

   - Email: `usuarioC@test.com` / Password: `Test123!`
   - Username: `usuarioC`

### URLs a Testear

- **Públicas:**

  - Login: `http://localhost:5174/login`
  - Register: `http://localhost:5174/register`

- **Privadas (requieren autenticación):**

  - Dashboard: `http://localhost:5174/dashboard`
  - Schedule: `http://localhost:5174/schedule`
  - Calendar: `http://localhost:5174/calendar`
  - Groups: `http://localhost:5174/groups`
  - Group Detail: `http://localhost:5174/groups/:id`
  - Profile: `http://localhost:5174/profile`

### Backend

- [x] Backend corriendo en: `http://localhost:3000`
- [x] Base de datos conectada y limpia

---

## 🔐 MÓDULO 1: AUTENTICACIÓN (Login/Register)

### 1.1 Página de Registro

**Acceso:**

- [x] Abre Chrome en modo incógnito
- [x] Navega a `http://localhost:5174/register`
- [x] ¿La página carga en menos de 2 segundos?
- [x] ¿No hay errores en consola?

**Diseño Visual:**

- [x] Logo o título "AmigOrganizador" visible
- [x] Formulario con campos: Username, Email, Full Name, Password
- [x] Botón "Registrarse" o similar
- [x] Link "¿Ya tienes cuenta? Inicia sesión"
- [x] Diseño responsive y atractivo

**Validaciones de Formulario:**

- [x] Intenta registrar con email inválido (`test@`)
  - ¿Muestra error?
- [x] Intenta registrar con password < 6 caracteres
  - ¿Muestra error?
- [x] Intenta registrar con campos vacíos
  - ¿Muestra errores en cada campo?
- [x] Username con espacios o caracteres especiales
  - ¿Valida correctamente?

**Registro Exitoso:**

- [x] Completa formulario con Usuario A:
  - Username: `usuarioA`
  - Email: `usuarioA@test.com`
  - Full Name: `Usuario Prueba A`
  - Password: `Test123!`
- [x] Haz clic en "Registrarse"
- [x] ¿Se muestra mensaje de éxito?
- [x] ¿Redirige automáticamente a Dashboard o Login?
- [x] ¿El token se guarda en localStorage?

**Registro Duplicado:**

- [x] Cierra sesión si redirigió automáticamente
- [x] Intenta registrar el mismo email otra vez
- [x] ¿Muestra error "Email ya registrado"?

**Repetir para Usuario B y C:**

- [x] Registra Usuario B (`usuarioB@test.com`)
- [x] Registra Usuario C (`usuarioC@test.com`)

### 1.2 Página de Login

**Acceso:**

- [x] Navega a `http://localhost:5174/login`
- [x] Página carga correctamente
- [x] Sin errores en consola

**Diseño Visual:**

- [x] Logo/título "AmigOrganizador"
- [x] Formulario con: Email y Password
- [x] Botón "Iniciar Sesión"
- [x] Link "¿No tienes cuenta? Regístrate"
- [x] Checkbox "Recordarme" (opcional)

**Login Fallido:**

- [x] Intenta login con email incorrecto
  - ¿Muestra "Credenciales inválidas"?
- [x] Intenta login con password incorrecta
  - ¿Muestra "Credenciales inválidas"?
- [x] Intenta login con campos vacíos
  - ¿Muestra errores de validación?

**Login Exitoso:**

- [x] Login con Usuario A:
  - Email: `usuarioA@test.com`
  - Password: `Test123!`
- [x] ¿Redirige a Dashboard?
- [x] ¿Token guardado en localStorage?
- [x] ¿Navbar aparece con nombre de usuario?

### 1.3 Persistencia de Sesión

- [x] Con sesión activa, recarga la página (F5)
- [x] ¿Sigue autenticado?
- [x] Cierra el navegador y vuelve a abrir
- [x] Navega a `http://localhost:5174`
- [x] ¿Redirige a Dashboard automáticamente?

### 1.4 Logout

- [x] Con sesión activa, haz clic en "Salir" (Navbar)
- [x] ¿Redirige a Login?
- [x] ¿Token eliminado de localStorage?
- [x] Intenta acceder a `/dashboard` directamente
- [x] ¿Redirige de vuelta a Login?

---

## 🏠 MÓDULO 2: DASHBOARD

### 2.1 Acceso y Carga

- [x] Login con Usuario A
- [x] ¿Redirige automáticamente a `/dashboard`?
- [x] Página carga en menos de 2 segundos
- [x] Sin errores en consola

### 2.2 Estructura Visual

**Navbar:**

- [ ] Logo "AmigOrganizador" presente
- [ ] Links: Inicio, Mi Horario, Grupos
- [ ] Nombre de usuario en esquina superior derecha
- [ ] Botón "Salir"

**Contenido del Dashboard:**

- [ ] Título de bienvenida: "¡Bienvenido a AmigOrganizador! 🎉"
- [ ] Mensaje de bienvenida personalizado
- [ ] Lista de funcionalidades disponibles

**Cards de Acciones Rápidas:**

- [ ] Card "📅 Mi Horario"
  - Link a `/schedule`
  - Descripción visible
- [ ] Card "👥 Mis Grupos"
  - Link a `/groups`
  - Descripción visible
- [ ] Card "⚙️ Mi Perfil"
  - Link a `/profile`
  - Descripción visible

**Información de Cuenta:**

- [ ] Muestra Email del usuario
- [ ] Muestra Username
- [ ] Muestra Full Name
- [ ] Muestra "Miembro desde" con fecha

### 2.3 Navegación desde Dashboard

- [ ] Haz clic en card "Mi Horario"
  - ¿Redirige a `/schedule`?
- [ ] Vuelve a Dashboard (click en "Inicio" en Navbar)
- [ ] Haz clic en card "Mis Grupos"
  - ¿Redirige a `/groups`?
- [ ] Vuelve a Dashboard
- [ ] Haz clic en card "Mi Perfil"
  - ¿Redirige a `/profile`?

---

## 📅 MÓDULO 3: SCHEDULE (MI HORARIO)

### 3.1 Verificación Visual Inicial

- [ ] Abre Chrome y navega a `http://localhost:5174/login`
- [ ] Inicia sesión con usuario de prueba
- [ ] Navega a `/schedule` desde el Dashboard o Navbar
- [ ] **Verifica tiempo de carga**: ¿Menos de 2 segundos?
- [ ] **Verifica que NO hay errores en consola** (F12 → Console)

### 1.2 Estructura Visual

- [ ] **Navbar** está visible en la parte superior

  - [ ] Logo "AmigOrganizador" presente
  - [ ] Links: Inicio, Mi Horario, Grupos
  - [ ] Botón "Salir" visible
  - [ ] Nombre de usuario mostrado

- [ ] **Header Card con Gradiente**

  - [ ] Título "📅 Mi Horario" visible
  - [ ] Subtítulo descriptivo presente
  - [ ] Badge "Días configurados: 0" (inicialmente)
  - [ ] Badge "Franjas horarias: 0" (inicialmente)

- [ ] **Botones de Acción**

  - [ ] "Config. Rápida" con icono de rayo ⚡
  - [ ] "Exportar" con icono de descarga
  - [ ] "Importar" con icono de subida
  - [ ] Todos los botones tienen hover effect

### 1.3 Toggle de Vista

- [ ] Hay 2 botones: "📅 Vista Calendario" y "⚡ Config. Rápida"
- [ ] "Vista Calendario" está activo (fondo azul) por defecto
- [ ] Los botones responden al hover

### 1.4 Calendario

- [ ] Calendario visible con mes actual
- [ ] Días del mes correctamente mostrados
- [ ] Toolbar del calendario con navegación (← Anterior / Siguiente →)
- [ ] Botón "Hoy" presente y funcional

### 1.5 Guía Rápida

- [ ] Card con 4 pasos en grid 2x2
- [ ] Cada paso tiene número, título y descripción
- [ ] Colores gradient diferentes para cada paso
- [ ] Responsive: se ven bien los 4 pasos

---

## 🔧 FASE 2: Testeo Funcional - Edición de Días

### 2.1 Abrir Modal de Edición

- [ ] Haz clic en **día 15 del mes actual**
- [ ] ¿Se abre modal con título "Editar Disponibilidad - [Fecha]"?
- [ ] Modal tiene fondo oscuro (overlay)
- [ ] Modal se puede cerrar con X
- [ ] Modal se puede cerrar con ESC
- [ ] Modal se puede cerrar haciendo clic fuera

### 2.2 Agregar Horarios con Presets

**Preset: Mañana (9:00 - 12:00)**

- [ ] Haz clic en botón "Mañana"
- [ ] ¿Se agrega el slot "9:00 - 12:00" a la lista?
- [ ] El slot aparece con fondo azul claro
- [ ] Tiene botón "×" para eliminar

**Preset: Tarde (14:00 - 18:00)**

- [ ] Haz clic en botón "Tarde"
- [ ] ¿Se agrega el slot "14:00 - 18:00"?
- [ ] Ahora hay 2 slots en la lista

**Preset: Noche (19:00 - 22:00)**

- [ ] Haz clic en botón "Noche"
- [ ] ¿Se agrega el slot "19:00 - 22:00"?
- [ ] Ahora hay 3 slots en la lista

**Eliminar slot individual**

- [ ] Haz clic en "×" del slot de Tarde
- [ ] ¿Se elimina solo ese slot?
- [ ] Quedan 2 slots (Mañana y Noche)

### 2.3 Agregar Horario Personalizado

- [ ] Selecciona hora inicio: "10:00"
- [ ] Selecciona hora fin: "11:30"
- [ ] Haz clic en "Agregar Horario"
- [ ] ¿Se agrega el slot "10:00 - 11:30"?
- [ ] Ahora hay 3 slots

**Validación de errores:**

- [ ] Intenta agregar horario con hora fin ANTES de hora inicio
- [ ] ¿Muestra mensaje de error?
- [ ] Intenta agregar horario ya existente
- [ ] ¿Evita duplicados?

### 2.4 Preset "Todo el día"

- [ ] Haz clic en "Eliminar Todo" para limpiar
- [ ] Haz clic en "Todo el día"
- [ ] ¿Se agregan 3 slots? (Mañana, Tarde, Noche)

### 2.5 Guardar Cambios

- [ ] Haz clic en "Guardar"
- [ ] Modal se cierra
- [ ] **El día 15 ahora tiene COLOR en el calendario**
- [ ] Aparece un badge pequeño con el número de slots
- [ ] En el header, "Días configurados" cambió a 1
- [ ] "Franjas horarias" muestra el total de slots

### 2.6 Editar Día Existente

- [ ] Haz clic nuevamente en el día 15
- [ ] ¿Se muestran los horarios guardados previamente?
- [ ] Agrega un nuevo slot
- [ ] Guarda
- [ ] Verifica que se actualizó correctamente

### 2.7 Eliminar Todos los Horarios de un Día

- [ ] Abre el día 15
- [ ] Haz clic en "Eliminar Todo"
- [ ] ¿Confirma con mensaje o directamente elimina?
- [ ] Lista de slots queda vacía
- [ ] Guarda
- [ ] **El día 15 vuelve a color normal (sin color)**
- [ ] "Días configurados" vuelve a 0

---

## ⚡ FASE 3: Configuración Rápida

### 3.1 Abrir Modal de Config. Rápida

- [ ] Haz clic en botón "Config. Rápida" (header o toggle)
- [ ] ¿Se abre modal grande con título "⚡ Configuración Rápida de Horario"?
- [ ] Hay sección de "Plantillas Predefinidas"
- [ ] Hay selector de días de la semana

### 3.2 Plantillas Predefinidas

**Plantilla: Trabajo Normal**

- [ ] Card "💼 Trabajo Normal" visible
- [ ] Descripción: "Lun-Vie: 9:00-18:00"
- [ ] Haz clic en "Seleccionar"
- [ ] ¿Se ilumina/marca como seleccionada?

**Plantilla: Medio Tiempo**

- [ ] Card "⏰ Medio Tiempo" visible
- [ ] Descripción: "Lun-Vie: 14:00-18:00"
- [ ] Haz clic en "Seleccionar"
- [ ] Plantilla anterior se deselecciona

**Plantilla: Freelancer**

- [ ] Card "💻 Freelancer" visible
- [ ] Descripción: "Lun-Dom: 9:00-22:00"

**Plantilla: Fines de Semana**

- [ ] Card "🎉 Fines de Semana" visible
- [ ] Descripción: "Sáb-Dom: Todo el día"

### 3.3 Selector de Días

- [ ] Hay botones para: Lun, Mar, Mié, Jue, Vie, Sáb, Dom
- [ ] Botones "Días laborales" y "Fines de semana"
- [ ] Haz clic en "Lun" → ¿se marca?
- [ ] Haz clic en "Días laborales" → ¿se marcan Lun-Vie?
- [ ] Haz clic nuevamente en "Lun" → ¿se desmarca?

### 3.4 Aplicar Configuración

- [ ] Selecciona plantilla "Trabajo Normal"
- [ ] Selecciona días Lun, Mié, Vie
- [ ] Haz clic en "Aplicar Configuración"
- [ ] ¿Se cierra el modal?
- [ ] **En el calendario, ¿los Lunes, Miércoles y Viernes del mes tienen color?**
- [ ] "Días configurados" se actualiza correctamente
- [ ] "Franjas horarias" se actualiza correctamente

### 3.5 Aplicar Otra Configuración

- [ ] Abre Config. Rápida nuevamente
- [ ] Selecciona "Fines de Semana"
- [ ] Selecciona Sáb y Dom
- [ ] Aplica
- [ ] **Sábados y Domingos ahora tienen color**
- [ ] Los días Lun, Mié, Vie siguen coloreados

---

## 📤 FASE 4: Exportar e Importar

### 4.1 Exportar Horario

**Preparación:**

- [ ] Asegúrate de tener al menos 5 días con horarios configurados
- [ ] Anota cuántos "Días configurados" y "Franjas horarias" tienes

**Proceso de Exportación:**

- [ ] Haz clic en botón "Exportar"
- [ ] ¿Se descarga un archivo JSON automáticamente?
- [ ] Nombre del archivo: `horario_YYYY_MM.json`
- [ ] ¿Aparece alert "✅ Horario exportado con éxito"?

**Validación del Archivo:**

- [ ] Abre el archivo JSON descargado
- [ ] Verifica que contiene los campos: `year`, `month`, `availability`
- [ ] Verifica que los días y slots están correctamente guardados

### 4.2 Limpiar Todo el Horario

- [ ] Abre cada día configurado y haz clic en "Eliminar Todo"
- [ ] Guarda cada día
- [ ] Verifica que "Días configurados" = 0
- [ ] Calendario completamente limpio (sin colores)

### 4.3 Importar Horario

- [ ] Haz clic en botón "Importar"
- [ ] ¿Se abre diálogo del sistema para seleccionar archivo?
- [ ] Selecciona el archivo JSON que exportaste anteriormente
- [ ] ¿Aparece alert "✅ Horario importado con éxito"?
- [ ] **El calendario se recarga y muestra todos los días que tenías antes**
- [ ] "Días configurados" vuelve al número original
- [ ] "Franjas horarias" vuelve al número original

### 4.4 Importar Archivo Inválido

- [ ] Crea un archivo `test.json` con contenido: `{"invalid": true}`
- [ ] Intenta importar este archivo
- [ ] ¿Aparece alert "❌ Error al importar el horario"?
- [ ] ¿El calendario NO se rompe?

---

## 🎨 FASE 5: Testeo de Colores y Leyenda

### 5.1 Código de Colores del Calendario

**Objetivo: Verificar que los días se colorean según número de slots**

**0 slots (Sin disponibilidad):**

- [ ] Elimina todos los horarios de un día
- [ ] Color: Gris claro (neutral)
- [ ] Badge: No muestra badge o muestra "0"

**1 slot:**

- [ ] Agrega SOLO 1 horario a un día (ej: Mañana)
- [ ] Color: Azul claro
- [ ] Badge muestra: "1"

**2 slots:**

- [ ] Agrega 2 horarios a un día (ej: Mañana + Tarde)
- [ ] Color: Índigo
- [ ] Badge muestra: "2"

**3+ slots:**

- [ ] Agrega 3 o más horarios a un día (ej: Todo el día)
- [ ] Color: Púrpura
- [ ] Badge muestra: "3" o número correcto

### 5.2 Leyenda del Calendario

- [ ] ¿Hay una sección "Leyenda" sobre el calendario?
- [ ] Muestra: "Sin disponibilidad", "1 franja", "2 franjas", "3+ franjas"
- [ ] Cada item tiene el color correcto

---

## 📱 FASE 6: Responsive Design

### 6.1 Viewport Grande (Desktop: 1920x1080)

- [ ] Abre DevTools (F12) → Responsive Mode
- [ ] Configura: 1920x1080
- [ ] Navbar: ¿Enlaces horizontales visibles?
- [ ] Header card: ¿Botones en fila?
- [ ] Calendario: ¿Se ve completo sin scroll horizontal?
- [ ] Guía: ¿4 pasos en grid 2x2?

### 6.2 Viewport Mediano (Tablet: 768x1024)

- [ ] Configura: 768x1024
- [ ] Navbar: ¿Sigue visible?
- [ ] Header card: ¿Botones se adaptan?
- [ ] Calendario: ¿Se adapta sin romperse?
- [ ] Guía: ¿Sigue siendo 2x2 o pasa a columna?

### 6.3 Viewport Pequeño (Mobile: 375x667)

- [ ] Configura: 375x667
- [ ] Navbar: ¿Hamburger menu o enlaces apilados?
- [ ] Header card: ¿Botones apilados verticalmente?
- [ ] Calendario: ¿Legible en mobile?
- [ ] Modal: ¿Se ajusta a pantalla pequeña?
- [ ] Config. Rápida: ¿Cards se apilan?

---

## ⚠️ FASE 7: Casos Edge y Validaciones

### 7.1 Validaciones de Horario

**Horario inválido:**

- [ ] Intenta agregar horario: Inicio 18:00, Fin 09:00
- [ ] ¿Muestra error "La hora de fin debe ser posterior a la hora de inicio"?

**Horarios superpuestos:**

- [ ] Agrega: 09:00 - 12:00
- [ ] Intenta agregar: 10:00 - 13:00
- [ ] ¿Permite o previene superposición?
- [ ] ¿Muestra mensaje adecuado?

**Horario duplicado:**

- [ ] Agrega: 09:00 - 12:00
- [ ] Intenta agregar exactamente el mismo
- [ ] ¿Previene duplicado?

### 7.2 Navegación entre Meses

- [ ] Haz clic en "Siguiente →" (cambiar a próximo mes)
- [ ] ¿El calendario muestra el mes correcto?
- [ ] ¿Los días configurados del mes anterior NO aparecen?
- [ ] Haz clic en "← Anterior" (volver)
- [ ] ¿Vuelve al mes actual con los días configurados?
- [ ] Agrega horarios a día en mes siguiente
- [ ] Vuelve al mes actual
- [ ] Vuelve al mes siguiente: ¿siguen los horarios?

### 7.3 Límites de Slots

- [ ] Intenta agregar 10+ slots al mismo día
- [ ] ¿Permite o hay límite?
- [ ] ¿El UI se degrada o maneja bien muchos slots?

### 7.4 Días del Pasado

- [ ] Navega a mes anterior
- [ ] ¿Puedes editar días del pasado?
- [ ] ¿Hay alguna indicación visual de que son días pasados?

### 7.5 Cambio de Año

- [ ] Si estás en Diciembre, navega a Enero del año siguiente
- [ ] ¿El año se actualiza correctamente?
- [ ] ¿Los horarios se guardan con el año correcto?

---

## � MÓDULO 4: CALENDAR (EVENTOS)

### 4.1 Acceso y Vista Inicial

- [ ] Navega a `/calendar` (puede requerir botón en Navbar o URL directa)
- [ ] Página carga correctamente
- [ ] Sin errores en consola

### 4.2 Estructura Visual

**Navbar:**

- [ ] Navbar visible con todos los links

**Contenido:**

- [ ] Título "Calendario de Eventos" o similar
- [ ] Calendario mensual visible (react-big-calendar)
- [ ] Toolbar con navegación: ← Anterior, Hoy, Siguiente →
- [ ] Botón "Crear Evento" o similar

### 4.3 Crear Evento

**Abrir Modal:**

- [ ] Haz clic en un día del calendario
- [ ] ¿Se abre modal "Crear Evento"?
- [ ] Modal tiene campos: Título, Descripción, Fecha inicio, Fecha fin, Color

**Evento Simple:**

- [ ] Título: "Reunión de Equipo"
- [ ] Descripción: "Discutir proyecto Q1"
- [ ] Fecha inicio: Hoy a las 10:00
- [ ] Fecha fin: Hoy a las 11:00
- [ ] Color: Azul
- [ ] Haz clic en "Guardar"
- [ ] ¿Modal se cierra?
- [ ] ¿Evento aparece en el calendario?

**Evento de Todo el Día:**

- [ ] Crea evento "Conferencia"
- [ ] Marca checkbox "Todo el día"
- [ ] ¿Fecha fin se ajusta automáticamente?
- [ ] Guarda
- [ ] ¿Aparece correctamente en el calendario?

**Evento Multi-día:**

- [ ] Crea evento "Vacaciones"
- [ ] Fecha inicio: Día 20
- [ ] Fecha fin: Día 25
- [ ] ¿El evento se extiende por múltiples días en el calendario?

### 4.4 Editar Evento

- [ ] Haz clic en el evento "Reunión de Equipo"
- [ ] ¿Se abre modal en modo edición?
- [ ] ¿Los campos están pre-llenados?
- [ ] Cambia título a "Reunión Importante"
- [ ] Cambia hora a 14:00 - 15:00
- [ ] Guarda
- [ ] ¿El evento se actualiza en el calendario?

### 4.5 Eliminar Evento

- [ ] Abre el evento "Conferencia"
- [ ] ¿Hay botón "Eliminar" en el modal?
- [ ] Haz clic en "Eliminar"
- [ ] ¿Pide confirmación?
- [ ] Confirma eliminación
- [ ] ¿El evento desaparece del calendario?

### 4.6 Navegación entre Meses

- [ ] Haz clic en "Siguiente →"
- [ ] ¿Cambia al mes siguiente?
- [ ] ¿Los eventos del mes anterior no se muestran?
- [ ] Crea evento en este mes
- [ ] Vuelve con "← Anterior"
- [ ] Vuelve al mes siguiente
- [ ] ¿El evento sigue ahí?

### 4.7 Validaciones

- [ ] Intenta crear evento sin título
  - ¿Muestra error?
- [ ] Intenta crear evento con fecha fin antes de fecha inicio
  - ¿Muestra error?
- [ ] Intenta crear evento con fechas inválidas
  - ¿Valida correctamente?

---

## 👥 MÓDULO 5: GROUPS (GRUPOS)

### 5.1 Acceso y Vista Inicial

- [ ] Con Usuario A logueado, navega a `/groups`
- [ ] Página carga correctamente
- [ ] Sin errores en consola

### 5.2 Vista Vacía (Sin Grupos)

**Primera vez:**

- [ ] ¿Hay mensaje "No tienes grupos aún" o similar?
- [ ] ¿Hay botón "Crear Grupo"?
- [ ] ¿Hay botón o sección "Unirse a Grupo"?

### 5.3 Crear Primer Grupo

**Abrir Modal:**

- [ ] Haz clic en "Crear Grupo"
- [ ] ¿Se abre modal "Crear Nuevo Grupo"?
- [ ] Campos: Nombre, Descripción

**Crear Grupo:**

- [ ] Nombre: "Amigos Universidad"
- [ ] Descripción: "Grupo para organizar salidas"
- [ ] Haz clic en "Crear"
- [ ] ¿Modal se cierra?
- [ ] ¿Aparece card del grupo en la lista?
- [ ] ¿Muestra código de invitación?

**Verificar Card del Grupo:**

- [ ] Card muestra nombre "Amigos Universidad"
- [ ] Card muestra descripción
- [ ] Card muestra número de miembros: "1 miembro"
- [ ] Card tiene botón "Ver Detalles" o click directo

### 5.4 Código de Invitación

- [ ] En el card del grupo, ¿hay un código visible (ej: "ABC123")?
- [ ] ¿Hay botón "Copiar Código"?
- [ ] Haz clic en "Copiar Código"
- [ ] ¿Muestra mensaje "Código copiado"?
- [ ] Pega en notepad: ¿está copiado correctamente?
- [ ] **GUARDA ESTE CÓDIGO** para testeo posterior

### 5.5 Crear Más Grupos

- [ ] Crea segundo grupo: "Familia"
  - Descripción: "Reuniones familiares"
- [ ] Crea tercer grupo: "Trabajo"
  - Descripción: "Equipo de desarrollo"
- [ ] ¿Los 3 grupos aparecen en la lista?

### 5.6 Ver Detalles del Grupo

**Navegar a Detalle:**

- [ ] Haz clic en "Amigos Universidad" (o botón "Ver Detalles")
- [ ] ¿Redirige a `/groups/:id`?
- [ ] URL contiene ID del grupo

**Estructura Visual:**

- [ ] Navbar visible
- [ ] Título del grupo: "Amigos Universidad"
- [ ] Descripción del grupo
- [ ] Código de invitación visible
- [ ] Sección "Miembros del Grupo"
- [ ] Sección "Disponibilidad Grupal" o "Calendario Grupal"

**Miembros:**

- [ ] Lista muestra "Usuario Prueba A (Tú)" o similar
- [ ] Indica que eres el creador/admin
- [ ] Muestra avatar o iniciales

### 5.7 Unirse a Grupo (Usuario B)

**Preparación:**

- [ ] Abre **segundo navegador (Firefox o Chrome Incógnito)**
- [ ] Login con Usuario B (`usuarioB@test.com`, `Test123!`)
- [ ] Navega a `/groups`

**Unirse con Código:**

- [ ] ¿Hay input o botón "Unirse a Grupo"?
- [ ] Haz clic en "Unirse a Grupo"
- [ ] ¿Se abre modal o campo para código?
- [ ] Ingresa código copiado anteriormente
- [ ] Haz clic en "Unirse"
- [ ] ¿Muestra mensaje "Te has unido exitosamente"?
- [ ] ¿El grupo "Amigos Universidad" aparece en la lista de grupos?

**Verificar Miembros (Usuario A):**

- [ ] Vuelve al navegador del Usuario A
- [ ] Recarga página de detalles del grupo
- [ ] ¿Ahora muestra "2 miembros"?
- [ ] ¿Usuario B aparece en la lista de miembros?

### 5.8 Disponibilidad Grupal

**Con Usuario A:**

- [ ] En detalle de "Amigos Universidad"
- [ ] ¿Hay sección "Disponibilidad Grupal"?
- [ ] ¿Muestra calendario con disponibilidad combinada?

**Configurar Horarios Primero:**

- [ ] Usuario A: Navega a `/schedule`
- [ ] Configura disponibilidad en 5 días:

  - Lunes: 9:00-12:00, 14:00-18:00
  - Martes: 9:00-12:00
  - Miércoles: Todo el día
  - Jueves: 19:00-22:00
  - Viernes: 9:00-12:00, 19:00-22:00

- [ ] Usuario B (navegador 2): Navega a `/schedule`
- [ ] Configura disponibilidad en 5 días:

  - Lunes: 14:00-18:00
  - Martes: 9:00-12:00, 14:00-18:00
  - Miércoles: 9:00-12:00
  - Sábado: Todo el día
  - Domingo: 19:00-22:00

**Volver a Grupo:**

- [ ] Usuario A: Vuelve a detalle de grupo
- [ ] ¿El calendario grupal muestra disponibilidad combinada?
- [ ] ¿Lunes 14:00-18:00 aparece como "disponible para ambos"?
- [ ] ¿Martes 9:00-12:00 aparece como "disponible para ambos"?
- [ ] ¿Días sin coincidencia se muestran diferente?

**Colores o Indicadores:**

- [ ] ¿Hay leyenda explicando los colores?
- [ ] ¿Verde = Todos disponibles?
- [ ] ¿Amarillo = Algunos disponibles?
- [ ] ¿Rojo/Gris = Nadie disponible?

### 5.9 Unirse Tercer Usuario

- [ ] Abre **tercer navegador** (Edge o Chrome Incógnito 2)
- [ ] Login con Usuario C
- [ ] Navega a `/groups`
- [ ] Únete a "Amigos Universidad" con código
- [ ] Configura horarios en Schedule
- [ ] Verifica que aparece en miembros del grupo
- [ ] Verifica disponibilidad grupal con 3 miembros

### 5.10 Salir de Grupo

**Con Usuario B:**

- [ ] En detalle de "Amigos Universidad"
- [ ] ¿Hay botón "Salir del Grupo"?
- [ ] Haz clic
- [ ] ¿Pide confirmación?
- [ ] Confirma
- [ ] ¿Redirige a `/groups`?
- [ ] ¿El grupo ya no aparece en la lista?

**Verificar con Usuario A:**

- [ ] Recarga detalle del grupo
- [ ] ¿Usuario B ya no aparece en miembros?
- [ ] ¿Contador de miembros es correcto?

### 5.11 Eliminar Grupo (Solo Admin)

**Con Usuario A (creador):**

- [ ] Navega a grupo "Trabajo"
- [ ] ¿Hay botón "Eliminar Grupo" (solo para admin)?
- [ ] Haz clic
- [ ] ¿Pide confirmación clara?
- [ ] Confirma
- [ ] ¿Redirige a `/groups`?
- [ ] ¿El grupo "Trabajo" ya no existe?

**Con Usuario C (no admin):**

- [ ] ¿NO puede ver botón "Eliminar Grupo"?
- [ ] Solo ve "Salir del Grupo"

---

## 👤 MÓDULO 6: PROFILE (PERFIL)

### 6.1 Acceso

- [ ] Con Usuario A, navega a `/profile`
- [ ] Página carga correctamente
- [ ] Sin errores en consola

### 6.2 Visualización de Datos

**Información Actual:**

- [ ] Muestra Username: `usuarioA`
- [ ] Muestra Email: `usuarioA@test.com`
- [ ] Muestra Full Name: `Usuario Prueba A`
- [ ] Muestra Fecha de creación
- [ ] ¿Hay botón "Editar Perfil"?

### 6.3 Editar Perfil

**Abrir Modo Edición:**

- [ ] Haz clic en "Editar Perfil"
- [ ] ¿Los campos se vuelven editables?
- [ ] ¿Hay botones "Guardar" y "Cancelar"?

**Editar Información:**

- [ ] Cambia Full Name a "Usuario A Actualizado"
- [ ] Intenta cambiar Email a email inválido
  - ¿Muestra error de validación?
- [ ] Cambia Email a `usuarioA.nuevo@test.com`
- [ ] Haz clic en "Guardar"
- [ ] ¿Muestra mensaje "Perfil actualizado"?
- [ ] ¿Los cambios se reflejan inmediatamente?

**Verificar Persistencia:**

- [ ] Navega a Dashboard
- [ ] Vuelve a Profile
- [ ] ¿Los cambios siguen ahí?
- [ ] Recarga página (F5)
- [ ] ¿Los cambios persisten?

### 6.4 Cambiar Contraseña

- [ ] ¿Hay sección "Cambiar Contraseña"?
- [ ] Campos: Contraseña Actual, Nueva Contraseña, Confirmar Nueva
- [ ] Ingresa contraseña actual incorrecta
  - ¿Muestra error?
- [ ] Ingresa contraseña actual correcta: `Test123!`
- [ ] Nueva contraseña: `NewTest456!`
- [ ] Confirmar: `NewTest456!`
- [ ] Guarda
- [ ] ¿Muestra mensaje "Contraseña actualizada"?

**Verificar Nueva Contraseña:**

- [ ] Cierra sesión
- [ ] Intenta login con contraseña anterior
  - ¿Falla?
- [ ] Login con nueva contraseña `NewTest456!`
  - ¿Funciona?

### 6.5 Eliminar Cuenta

- [ ] ¿Hay sección "Eliminar Cuenta" (opcional)?
- [ ] Si existe, ¿tiene advertencia clara?
- [ ] ¿Pide confirmación múltiple?
- [ ] **NO TESTEAR** si no quieres perder la cuenta

---

## 🔄 MÓDULO 7: SINCRONIZACIÓN MULTI-USUARIO

- [ ] Configura 5 días con horarios variados
- [ ] Recarga la página (F5)
- [ ] ¿Los días siguen configurados?
- [ ] ¿Los colores se mantienen?
- [ ] ¿Las estadísticas son correctas?

---

## 🔄 MÓDULO 7: SINCRONIZACIÓN MULTI-USUARIO

### 7.1 Cambios en Tiempo Real (Grupos)

**Setup:**

- [ ] Usuario A y Usuario B en grupo "Amigos Universidad"
- [ ] Ambos tienen la página de detalle del grupo abierta

**Prueba 1: Nuevo Miembro**

- [ ] Usuario C se une al grupo
- [ ] Usuario A: ¿Se actualiza automáticamente la lista de miembros?
- [ ] Usuario B: ¿Se actualiza automáticamente?
- [ ] Si no es automático, recarga y verifica

**Prueba 2: Cambio de Disponibilidad**

- [ ] Usuario A cambia su disponibilidad en Schedule (agrega/quita días)
- [ ] Usuario B en grupo: Recarga disponibilidad grupal
- [ ] ¿Los cambios se reflejan correctamente?

### 7.2 Persistencia de Datos

**Schedule:**

- [ ] Usuario A configura 10 días con horarios
- [ ] Cierra navegador
- [ ] Vuelve a abrir y login
- [ ] Navega a Schedule
- [ ] ¿Los 10 días siguen configurados?

**Grupos:**

- [ ] Usuario A crea grupo
- [ ] Cierra navegador
- [ ] Vuelve a abrir y login
- [ ] ¿El grupo sigue en la lista?
- [ ] ¿Los miembros siguen ahí?

**Eventos:**

- [ ] Usuario A crea 5 eventos
- [ ] Cierra navegador
- [ ] Vuelve a abrir y login
- [ ] ¿Los 5 eventos siguen en el calendario?

---

## 📱 MÓDULO 8: RESPONSIVE DESIGN (TODAS LAS PÁGINAS)

### 8.1 Desktop (1920x1080)

**Abre DevTools (F12) → Responsive Mode → 1920x1080**

**Login/Register:**

- [ ] Formularios centrados y bien espaciados
- [ ] Botones de buen tamaño
- [ ] Sin scroll horizontal

**Dashboard:**

- [ ] Cards en grid 3 columnas
- [ ] Navbar horizontal
- [ ] Contenido no excede ancho

**Schedule:**

- [ ] Calendario se ve completo
- [ ] Header en una fila
- [ ] Botones en fila horizontal
- [ ] Guía en grid 2x2

**Groups:**

- [ ] Cards de grupos en grid (2-3 columnas)
- [ ] Detalle de grupo: layout balanceado

**Calendar:**

- [ ] Calendario mensual completo visible
- [ ] Toolbar accesible

**Profile:**

- [ ] Formulario bien espaciado
- [ ] Botones alineados

### 8.2 Tablet (768x1024)

**Configura: 768x1024**

**Todas las Páginas:**

- [ ] Navbar sigue siendo horizontal o se adapta
- [ ] Contenido no se corta
- [ ] Botones accesibles
- [ ] Formularios legibles
- [ ] Calendarios adaptados
- [ ] Modales se ajustan

### 8.3 Mobile (375x667)

**Configura: 375x667 (iPhone SE)**

**Login/Register:**

- [ ] Formularios apilados verticalmente
- [ ] Inputs ocupan ancho completo
- [ ] Botones táctiles (min 44px altura)
- [ ] Texto legible sin zoom

**Dashboard:**

- [ ] Cards apiladas (1 columna)
- [ ] Navbar: ¿Hamburger menu?
- [ ] Nombre de usuario visible o icono

**Schedule:**

- [ ] Header apilado verticalmente
- [ ] Botones apilados
- [ ] Calendario: días pequeños pero legibles
- [ ] Modal: ocupa pantalla completa o casi
- [ ] Guía: 1 columna (4 pasos apilados)

**Groups:**

- [ ] Cards apiladas (1 columna)
- [ ] Botones accesibles
- [ ] Código de invitación visible

**Calendar:**

- [ ] Calendario ajustado a pantalla
- [ ] Eventos legibles
- [ ] Modal: pantalla completa

**Profile:**

- [ ] Formulario apilado
- [ ] Botones apilados
- [ ] Todo accesible con un dedo

---

## ⚠️ MÓDULO 9: CASOS EDGE Y VALIDACIONES

### 9.1 Autenticación

**Token Expirado:**

- [ ] (Requiere backend config) Deja sesión abierta por tiempo prolongado
- [ ] ¿Token expira y redirige a login?
- [ ] ¿Muestra mensaje "Sesión expirada"?

**Token Inválido:**

- [ ] En DevTools → Application → localStorage
- [ ] Modifica el token manualmente
- [ ] Recarga página
- [ ] ¿Redirige a login?

### 9.2 Rutas Protegidas

**Sin Autenticación:**

- [ ] Cierra sesión completamente
- [ ] Navega directamente a `/dashboard`
  - ¿Redirige a `/login`?
- [ ] Navega a `/schedule`
  - ¿Redirige a `/login`?
- [ ] Navega a `/groups`
  - ¿Redirige a `/login`?
- [ ] Navega a `/profile`
  - ¿Redirige a `/login`?

### 9.3 Validaciones de Formularios

**Campos Vacíos:**

- [ ] Register: Envía formulario vacío
  - ¿Muestra errores en todos los campos?
- [ ] Login: Envía formulario vacío
  - ¿Muestra errores?
- [ ] Crear Grupo: Envía sin nombre
  - ¿Muestra error?
- [ ] Crear Evento: Envía sin título
  - ¿Muestra error?

**Formatos Inválidos:**

- [ ] Email sin @: `testtest.com`
- [ ] Email sin dominio: `test@`
- [ ] Password muy corta: `123`
- [ ] Caracteres especiales en username: `user@123`

### 9.4 Límites de Datos

**Strings Largos:**

- [ ] Nombre de grupo con 200 caracteres
  - ¿Hay límite? ¿Se trunca en UI?
- [ ] Descripción con 1000 caracteres
  - ¿Hay límite?
- [ ] Título de evento con 100 caracteres
  - ¿Se muestra correctamente en calendario?

**Muchos Elementos:**

- [ ] Crea 20 grupos
  - ¿El UI sigue siendo usable?
  - ¿Hay paginación o scroll?
- [ ] Crea 50 eventos en un mes
  - ¿El calendario se satura?
  - ¿Sigue siendo legible?
- [ ] Agrega 20 slots al mismo día (Schedule)
  - ¿Hay límite?
  - ¿El UI se degrada?

### 9.5 Códigos de Invitación

**Código Inválido:**

- [ ] Intenta unirte a grupo con código: `INVALID123`
- [ ] ¿Muestra error "Código inválido"?

**Código Expirado:** (si aplica)

- [ ] ¿Hay códigos con expiración?
- [ ] Testear con código viejo

**Código de Grupo Propio:**

- [ ] Usuario A intenta unirse a su propio grupo
- [ ] ¿Muestra error "Ya eres miembro"?

**Ya Unido:**

- [ ] Usuario A intenta usar el mismo código dos veces
- [ ] ¿Muestra error "Ya estás en este grupo"?

### 9.6 Fechas y Horarios

**Fechas Pasadas:**

- [ ] Crea evento con fecha del año pasado
- [ ] ¿Permite o previene?
- [ ] Crea horario en Schedule en mes pasado
- [ ] ¿Permite? ¿Tiene sentido?

**Fechas Futuras Lejanas:**

- [ ] Crea evento para año 2030
- [ ] ¿Permite?
- [ ] Navega en calendario hasta 2030
- [ ] ¿El evento está ahí?

**Horarios Nocturnos:**

- [ ] Agrega slot: 23:00 - 02:00 (cruza medianoche)
- [ ] ¿Cómo se maneja?
- [ ] ¿Se divide en dos días?

---

## 🐛 MÓDULO 10: ERRORES Y DEBUGGING

### 10.1 Consola del Navegador

**Por Cada Página:**

- [ ] Login: Abre DevTools → Console → ¿Errores rojos?
- [ ] Register: ¿Errores rojos?
- [ ] Dashboard: ¿Errores rojos?
- [ ] Schedule: ¿Errores rojos?
- [ ] Calendar: ¿Errores rojos?
- [ ] Groups: ¿Errores rojos?
- [ ] Profile: ¿Errores rojos?

**Por Cada Acción:**

- [ ] Crear evento: ¿Errores en console?
- [ ] Guardar horario: ¿Errores?
- [ ] Unirse a grupo: ¿Errores?
- [ ] Exportar schedule: ¿Errores?

**Warnings:**

- [ ] Anota todos los warnings (amarillos)
- [ ] ¿Son críticos o solo informativos?

### 10.2 Network Tab

**Llamadas API:**

- [ ] Abre DevTools → Network → Filtra XHR/Fetch
- [ ] Login: ¿POST a `/auth/login` retorna 200?
- [ ] Register: ¿POST a `/auth/register` retorna 201?
- [ ] Get Schedule: ¿GET exitoso?
- [ ] Update Schedule: ¿PUT exitoso?
- [ ] Create Group: ¿POST exitoso?
- [ ] Get Events: ¿GET exitoso?

**Errores de Red:**

- [ ] ¿Alguna llamada retorna 400?
  - Documenta cuál y por qué
- [ ] ¿Alguna llamada retorna 401 (No autorizado)?
  - Documenta contexto
- [ ] ¿Alguna llamada retorna 500 (Error de servidor)?
  - Documenta y reporta

### 10.3 Simulación de Fallo de Red

**Modo Offline:**

- [ ] DevTools → Network → Throttling → Offline
- [ ] Intenta guardar horario: ¿Muestra error claro?
- [ ] Intenta crear evento: ¿Muestra error?
- [ ] ¿El UI se rompe o maneja gracefully?
- [ ] Activa red: ¿La app se recupera?

**Slow 3G:**

- [ ] Throttling → Slow 3G
- [ ] Carga cada página: ¿Hay spinners de carga?
- [ ] ¿Timeout después de mucho tiempo?

---

## ⚡ MÓDULO 11: PERFORMANCE

### 11.1 Lighthouse Audit

**Por Página Importante:**

**Dashboard:**

- [ ] DevTools → Lighthouse → Run Audit
- [ ] Performance: ¿Score > 90?
- [ ] Accessibility: ¿Score > 90?
- [ ] Best Practices: ¿Score > 80?
- [ ] FCP (First Contentful Paint): ¿< 1.8s?
- [ ] LCP (Largest Contentful Paint): ¿< 2.5s?

**Schedule:**

- [ ] Lighthouse Audit
- [ ] Performance: ¿> 85?
- [ ] Accessibility: ¿> 85?

**Groups:**

- [ ] Lighthouse Audit
- [ ] Performance: ¿> 85?

### 11.2 Tiempos de Carga

**Inicial:**

- [ ] Limpia caché: DevTools → Application → Clear storage
- [ ] Recarga Dashboard: ¿< 3s?
- [ ] Recarga Schedule: ¿< 3s?
- [ ] Recarga Groups: ¿< 3s?

**Con Caché:**

- [ ] Segunda carga Dashboard: ¿< 1s?
- [ ] Segunda carga Schedule: ¿< 1s?

### 11.3 Interactividad

**Tiempo de Respuesta:**

- [ ] Click en botón: ¿Feedback visual instantáneo (< 100ms)?
- [ ] Abrir modal: ¿< 200ms?
- [ ] Guardar formulario: ¿< 1s?
- [ ] Cambiar mes en calendario: ¿< 300ms?

**Animaciones:**

- [ ] ¿Transiciones suaves (sin lag)?
- [ ] ¿Modales se abren/cierran fluidamente?
- [ ] ¿Hover effects son inmediatos?

---

## 🌐 MÓDULO 12: CROSS-BROWSER TESTING

### 12.1 Chrome (Principal)

- [ ] Todas las pruebas anteriores realizadas en Chrome
- [ ] Sin errores críticos
- [ ] UI se ve correcta

### 12.2 Firefox

**Testeo Rápido:**

- [ ] Abre Firefox
- [ ] Login → ¿Funciona?
- [ ] Dashboard → ¿Se ve igual que Chrome?
- [ ] Schedule:
  - [ ] Calendario se renderiza
  - [ ] Editar día funciona
  - [ ] Guardar funciona
- [ ] Groups:
  - [ ] Crear grupo funciona
  - [ ] Unirse funciona
- [ ] Calendar:
  - [ ] Eventos se ven correctos
  - [ ] Crear/Editar funciona
- [ ] Profile → Editar funciona
- [ ] ¿Estilos se ven correctos?
- [ ] ¿Colores y gradientes iguales?

### 12.3 Safari (Si disponible en Mac)

- [ ] Login funciona
- [ ] Calendarios se renderizan
- [ ] Modales se ven bien
- [ ] Date pickers funcionan correctamente

### 12.4 Edge

- [ ] Login funciona
- [ ] Testeo básico de funcionalidades
- [ ] UI consistente

---

## 📸 MÓDULO 13: DOCUMENTACIÓN VISUAL

### 13.1 Screenshots Requeridos

**Captura de Cada Página:**

- [ ] Login (desktop)
- [ ] Register (desktop)
- [ ] Dashboard (desktop)
- [ ] Schedule - calendario vacío
- [ ] Schedule - calendario con datos
- [ ] Schedule - modal de edición
- [ ] Schedule - config rápida
- [ ] Calendar - vista mensual
- [ ] Calendar - modal de evento
- [ ] Groups - lista de grupos
- [ ] Groups - detalle de grupo
- [ ] Groups - disponibilidad grupal
- [ ] Profile - vista normal
- [ ] Profile - modo edición

**Mobile Screenshots:**

- [ ] Dashboard (375px)
- [ ] Schedule (375px)
- [ ] Groups (375px)

### 13.2 Videos (Opcional)

- [ ] Grabar flujo completo: Register → Dashboard → Schedule → Crear horarios
- [ ] Grabar flujo: Crear grupo → Invitar amigo → Ver disponibilidad grupal
- [ ] Grabar flujo: Crear múltiples eventos en calendario

---

## 📊 CHECKLIST FINAL Y REPORTE

### Funcionalidades Críticas

**Autenticación:**

- [ ] Register funciona
- [ ] Login funciona
- [ ] Logout funciona
- [ ] Sesión persiste

**Schedule:**

- [ ] Agregar horarios funciona
- [ ] Editar horarios funciona
- [ ] Eliminar horarios funciona
- [ ] Config Rápida funciona
- [ ] Exportar/Importar funciona
- [ ] Colores según slots funciona

**Calendar:**

- [ ] Crear eventos funciona
- [ ] Editar eventos funciona
- [ ] Eliminar eventos funciona
- [ ] Navegación entre meses funciona

**Groups:**

- [ ] Crear grupo funciona
- [ ] Unirse con código funciona
- [ ] Ver miembros funciona
- [ ] Ver disponibilidad grupal funciona
- [ ] Salir de grupo funciona

**Profile:**

- [ ] Ver perfil funciona
- [ ] Editar perfil funciona
- [ ] Cambiar contraseña funciona

### UX/UI

- [ ] Navbar visible en todas las páginas
- [ ] Botones tienen hover effects
- [ ] Modales se abren/cierran correctamente
- [ ] Formularios tienen validación clara
- [ ] Mensajes de éxito/error visibles
- [ ] Loading spinners cuando hay operaciones asíncronas
- [ ] Responsive en mobile/tablet/desktop
- [ ] Colores y gradientes consistentes
- [ ] Tipografía legible
- [ ] Iconos descriptivos

### Performance

- [ ] Páginas cargan en < 3s
- [ ] Interacciones responden en < 1s
- [ ] Sin lag en animaciones
- [ ] Sin memory leaks (DevTools → Memory)

### Bugs Críticos Encontrados

**Formato de Reporte:**

```
BUG-001
Severidad: CRÍTICA / ALTA / MEDIA / BAJA
Título: [Breve descripción]
Descripción: [Detalle completo]
Pasos para Reproducir:
1. ...
2. ...
3. ...
Comportamiento Esperado: [...]
Comportamiento Actual: [...]
Navegador: Chrome 120.x.x
Screenshot: [Adjuntar]
```

---

## 📝 RESUMEN EJECUTIVO

**Total de Casos de Prueba**: ~300+
**Tiempo Estimado Total**: 4-6 horas
**Navegadores Testeados**: Chrome, Firefox, Edge
**Dispositivos**: Desktop (1920x1080), Tablet (768x1024), Mobile (375x667)

**Módulos Testeados:**

1. ✅ Autenticación (Login/Register)
2. ✅ Dashboard
3. ✅ Schedule (Mi Horario)
4. ✅ Calendar (Eventos)
5. ✅ Groups (Grupos)
6. ✅ Profile (Perfil)
7. ✅ Sincronización Multi-Usuario
8. ✅ Responsive Design
9. ✅ Casos Edge y Validaciones
10. ✅ Errores y Debugging
11. ✅ Performance
12. ✅ Cross-Browser
13. ✅ Documentación Visual

**Resultado Final**:

- ✅ **APROBADO**: Todas las funcionalidades críticas funcionan sin bugs
- ⚠️ **APROBADO CON OBSERVACIONES**: Bugs menores que no bloquean uso
- ❌ **RECHAZADO**: Bugs críticos que impiden uso normal

**Métricas de Calidad:**

- Bugs Críticos: \_\_\_
- Bugs Altos: \_\_\_
- Bugs Medios: \_\_\_
- Bugs Bajos: \_\_\_
- Funcionalidades OK: **_/_**
- Score de Performance (promedio): \_\_\_
- Score de Accessibility (promedio): \_\_\_

---

## 🚀 PRÓXIMOS PASOS

Después del testeo:

1. Compilar reporte completo de bugs
2. Priorizar bugs críticos para fix inmediato
3. Documentar features funcionando correctamente
4. Crear backlog para mejoras y bugs menores
5. Re-testear después de fixes

**¡Testeo completo de toda la aplicación! 🎉**

- [ ] ¿Los horarios siguen ahí?

### 8.3 Logout y Login

- [ ] Configura horarios
- [ ] Cierra sesión
- [ ] Inicia sesión nuevamente
- [ ] Navega a Schedule
- [ ] ¿Los horarios persisten entre sesiones?

---

## 🌐 FASE 9: Cross-Browser Testing

### 9.1 Firefox

- [ ] Abre Firefox
- [ ] Navega a `http://localhost:5174/schedule`
- [ ] Repite testeo de Fase 2 (Edición de días)
- [ ] Repite testeo de Fase 3 (Config. Rápida)
- [ ] ¿Todos los estilos se ven correctos?
- [ ] ¿Las funcionalidades funcionan igual?

### 9.2 Edge (Opcional)

- [ ] Abre Edge
- [ ] Navega a página Schedule
- [ ] Testeo rápido de funcionalidades básicas
- [ ] Verifica estilos

---

## 🐛 FASE 10: Errores y Logs

### 10.1 Consola del Navegador

- [ ] Abre DevTools → Console
- [ ] Realiza todas las operaciones principales
- [ ] ¿Hay errores en rojo?
- [ ] ¿Hay warnings en amarillo?
- [ ] Si hay errores: documentar y reportar

### 10.2 Network Tab

- [ ] Abre DevTools → Network
- [ ] Filtra por XHR/Fetch
- [ ] Al guardar un horario, ¿hay llamada API exitosa (200)?
- [ ] Al exportar, ¿hay llamada API exitosa?
- [ ] ¿Alguna llamada falla (4xx, 5xx)?

### 10.3 Manejo de Errores de Red

**Simular fallo de red:**

- [ ] Abre DevTools → Network → Throttling → Offline
- [ ] Intenta guardar un horario
- [ ] ¿Muestra mensaje de error claro?
- [ ] ¿El UI no se rompe?
- [ ] Activa red nuevamente
- [ ] ¿Se puede seguir usando la app?

---

## ⚡ FASE 11: Performance

### 11.1 Lighthouse Audit

- [ ] Abre DevTools → Lighthouse
- [ ] Categorías: Performance, Accessibility, Best Practices
- [ ] Ejecuta audit en modo Desktop
- [ ] **Performance score**: ¿Mayor a 90?
- [ ] **Accessibility**: ¿Mayor a 90?
- [ ] Anota métricas: FCP, LCP, TBT, CLS

### 11.2 Tiempo de Respuesta

- [ ] Al abrir modal: ¿Menos de 100ms?
- [ ] Al guardar: ¿Menos de 500ms?
- [ ] Al cambiar mes: ¿Instantáneo?

---

## 📸 FASE 12: Screenshots y Documentación

### 12.1 Capturas de Pantalla

Toma screenshots de:

- [ ] Vista inicial del calendario (sin horarios)
- [ ] Modal de edición de día
- [ ] Calendario con 10+ días configurados
- [ ] Modal de Config. Rápida
- [ ] Vista mobile (375px)
- [ ] Leyenda de colores

### 12.2 Reporte de Bugs

Para cada bug encontrado, documentar:

- **ID del Bug**: BUG-001
- **Severidad**: Crítico / Alto / Medio / Bajo
- **Descripción**: Qué pasó
- **Pasos para Reproducir**: Lista numerada
- **Comportamiento Esperado**: Qué debería pasar
- **Comportamiento Actual**: Qué pasa realmente
- **Navegador y Versión**: Chrome 120, Firefox 121, etc.
- **Screenshot**: Adjuntar imagen

---

## ✅ CHECKLIST FINAL

### Funcionalidades Críticas

- [ ] Navbar visible y funcional
- [ ] Header con gradiente y estadísticas correctas
- [ ] Calendario se renderiza correctamente
- [ ] Modal de edición se abre y cierra
- [ ] Agregar horarios con presets funciona
- [ ] Agregar horarios personalizados funciona
- [ ] Eliminar slots individuales funciona
- [ ] Eliminar todo el día funciona
- [ ] Guardar cambios persiste los datos
- [ ] Config. Rápida permite aplicar plantillas
- [ ] Exportar descarga archivo JSON
- [ ] Importar carga horarios desde JSON
- [ ] Colores de días según número de slots
- [ ] Responsive: funciona en mobile y tablet
- [ ] Sin errores en consola
- [ ] Llamadas API exitosas

### UX/UI

- [ ] Animaciones suaves
- [ ] Feedback visual en botones (hover, active)
- [ ] Mensajes de éxito/error claros
- [ ] Carga rápida (< 2 segundos)
- [ ] Tipografía legible
- [ ] Contraste de colores adecuado
- [ ] Iconos coherentes y descriptivos

---

## 📊 RESUMEN DE TESTEO

**Total de Casos de Prueba**: ~150+
**Tiempo Estimado**: 2-3 horas
**Navegadores**: Chrome, Firefox, Edge
**Dispositivos**: Desktop, Tablet, Mobile

**Resultado Final**:

- ✅ **APROBADO**: Todos los tests críticos pasan
- ⚠️ **APROBADO CON OBSERVACIONES**: Algunos bugs menores
- ❌ **RECHAZADO**: Bugs críticos que bloquean uso

---

## 📝 NOTAS ADICIONALES

- Si encuentras más de 3 bugs críticos, detén el testeo y reporta inmediatamente
- Prioriza testeo de funcionalidades críticas antes que estética
- Documenta TODOS los bugs, incluso los menores
- Si algo no está claro, pregunta antes de marcar como bug

**¡Buen testeo! 🚀**
