# Registro de Cambios - AmigOrganizador

## [No Publicado] - 2024

### ✨ Nuevas Características

#### Colores Personalizados para Eventos

- **Selector de color** en el editor de franjas horarias
- Cada evento puede tener su propio color personalizado (formato hex #RRGGBB)
- Los colores se guardan y persisten en la base de datos
- Compatible con importación/exportación de horarios

#### Mejora de Visualización del Calendario

- **Eventos como lista**: Cada evento ahora se muestra como un elemento separado en el calendario
- **Indicador "+X más"**: Cuando un día tiene más de 3 eventos, se muestran los primeros 3 y se indica cuántos más hay
- **Colores visuales**: Cada evento se muestra con su color personalizado
- Leyenda simplificada para mejor comprensión

### 🐛 Correcciones

#### Lógica de Disponibilidad Invertida (v1)

- **Problema**: Los eventos/ocupaciones se marcaban como "disponible" en lugar de "no disponible"
- **Solución**: Invertida la lógica - miembros SIN eventos = disponibles, miembros CON eventos = no disponibles
- Actualizado tanto backend como frontend para reflejar la lógica correcta

#### Persistencia de Horarios Importados (v2 y v3)

- **Problema 1**: Al importar horarios, después de recargar se mostraban datos antiguos
- **Intento 1**: Agregado fetch después de importar → sobreescribía con datos viejos ❌
- **Intento 2**: Removido fetch duplicado → calendario no se actualizaba al mes importado ❌
- **Solución final**: Sincronización de `currentDate` del calendario con `selectedDate` del store usando `useEffect` ✅

### 🎨 Mejoras de UX

#### Títulos de Eventos

- Agregado campo opcional `title` para nombrar eventos
- Ejemplos: "Trabajo", "Clase", "Reunión", etc.
- Alternativa visual a mostrar solo rangos horarios
- Límite de 100 caracteres

#### Branding

- Cambiado favicon de Vite a emoji 📅
- Actualizado título de la aplicación a "AmigOrganizador"
- Mejoradas meta tags para SEO

### 🔧 Técnico

#### TypeScript Build Fixes

- Renombrado `FormData` → `LoginFormData` y `RegisterFormData` (conflicto con tipo del navegador)
- Agregadas anotaciones de tipo faltantes en parámetros de función
- Corregido mismatch de interfaz login: `email` vs `emailOrUsername`
- Agregadas firmas de índice a interfaces de errores

#### Repositorio Git

- Inicializado repositorio con 118 archivos
- Conectado a GitHub: `FCamaggi/AmigOrganizador`
- Configuraciones de deployment creadas (Netlify + Render)

#### Validaciones Backend

- Color hex validado con regex: `/^#[0-9A-Fa-f]{6}$/`
- Título de evento: máximo 100 caracteres
- Formato de hora: HH:MM con validación

### 📁 Archivos Modificados

#### Frontend

- `src/components/common/TimeSlotPicker.tsx`

  - Agregado selector de color
  - Layout en grid para título + color
  - Handler actualizado para soportar campo 'color'

- `src/components/schedule/ScheduleCalendar.tsx`

  - Creación de eventos individuales por slot
  - Lógica de "+X más" para días con >3 eventos
  - Estilos personalizados por color de evento
  - Leyenda simplificada

- `src/services/scheduleService.ts`

  - Interface `TimeSlot` actualizada con `color?: string`

- `src/store/scheduleStore.ts`
  - Removido fetch duplicado en `importSchedule`
  - Sincronización de `selectedDate` con fecha importada

#### Backend

- `src/models/Schedule.js`

  - Agregado campo `color` a slots con validación hex
  - Agregado campo `title` con límite de caracteres

- `src/controllers/availabilityController.js`
  - Invertida lógica de disponibilidad
  - Procesamiento de todos los días del mes
  - Agregado de slots a miembros no disponibles

### 🚀 Próximos Pasos

- [ ] Deployment completo a Netlify (frontend)
- [ ] Deployment completo a Render (backend)
- [ ] Configuración de CORS para servicios desplegados
- [ ] Testing end-to-end en producción
- [ ] Selector de colores predefinidos (palette)
- [ ] Vista modal para ver todos los eventos cuando hay +3

### 📊 Estadísticas

- **Bugs Críticos Resueltos**: 2 (disponibilidad, persistencia)
- **Nuevas Features**: 2 (colores, mejora visualización)
- **Mejoras UX**: 2 (títulos, branding)
- **Fixes TypeScript**: 4
- **Archivos Modificados**: 8+
- **Iteraciones de Bug Fixing**: 3 (persistencia de importación)

---

## Notas de Desarrollo

### Lecciones Aprendidas

1. **State Management**: La sincronización entre componentes y stores requiere `useEffect` cuidadoso
2. **Import/Export**: No re-fetch después de operaciones de escritura si ya tienes los datos
3. **TypeScript**: Conflictos de nombres con tipos del navegador requieren renombrado
4. **Visualización**: Separar eventos en lista es mejor UX que concatenar

### Decisiones de Diseño

- **Color por defecto**: `#6366f1` (indigo/primary)
- **Límite de eventos visibles**: 3 (balance entre información y limpieza visual)
- **Formato de color**: Hex (#RRGGBB) para simplicidad y compatibilidad
- **Indicador "+X"**: Estilo dashed para diferenciarlo de eventos reales
