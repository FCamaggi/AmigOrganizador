# 🎨 Sistema de Diseño - AmigOrganizador

## 📖 Guía de Uso

Este documento describe cómo usar el sistema de diseño centralizado de AmigOrganizador.

## 🚀 Inicio Rápido

```typescript
import { cn, getButtonClasses, colors } from '@/styles/design-system';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
```

## 🎯 Componentes Base

### Button

```tsx
// Uso básico
<Button>Click aquí</Button>

// Con variantes
<Button variant="primary">Primario</Button>
<Button variant="secondary">Secundario</Button>
<Button variant="danger">Peligro</Button>
<Button variant="success">Éxito</Button>
<Button variant="outline">Contorno</Button>
<Button variant="ghost">Fantasma</Button>

// Con tamaños
<Button size="xs">Extra pequeño</Button>
<Button size="sm">Pequeño</Button>
<Button size="md">Mediano</Button>
<Button size="lg">Grande</Button>
<Button size="xl">Extra grande</Button>

// Con íconos
<Button icon={<Icon />}>Con ícono izquierdo</Button>
<Button icon={<Icon />} iconPosition="right">Con ícono derecho</Button>

// Con loading
<Button loading>Cargando...</Button>

// Full width
<Button fullWidth>Ancho completo</Button>
```

### Input

```tsx
// Uso básico
<Input
  label="Email"
  name="email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder="tu@email.com"
/>

// Con error
<Input
  label="Contraseña"
  name="password"
  type="password"
  value={password}
  onChange={handleChange}
  error="La contraseña debe tener al menos 8 caracteres"
  required
/>

// Con hint
<Input
  label="Nombre de usuario"
  name="username"
  value={username}
  onChange={handleChange}
  hint="Solo letras, números y guiones"
/>

// Con ícono
<Input
  label="Buscar"
  name="search"
  icon={<SearchIcon />}
  iconPosition="left"
/>

// Variante minimal
<Input variant="minimal" label="Campo simple" />
```

### Modal

```tsx
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Título del Modal"
  description="Descripción opcional"
  size="md"
  headerGradient
  footer={
    <div className="flex gap-3">
      <Button onClick={handleClose} variant="secondary">
        Cancelar
      </Button>
      <Button onClick={handleSubmit}>Guardar</Button>
    </div>
  }
>
  {/* Contenido del modal */}
</Modal>

// Tamaños disponibles: sm, md, lg, xl, full
```

### Card

```tsx
// Variantes
<Card variant="default">Tarjeta predeterminada</Card>
<Card variant="elevated">Tarjeta elevada</Card>
<Card variant="interactive">Tarjeta interactiva (hover)</Card>
<Card variant="gradient">Tarjeta con degradado</Card>

// Con onClick
<Card variant="interactive" onClick={handleClick}>
  Clickeable
</Card>
```

### Badge

```tsx
<Badge variant="primary">Primario</Badge>
<Badge variant="success">Éxito</Badge>
<Badge variant="warning">Advertencia</Badge>
<Badge variant="danger">Peligro</Badge>
<Badge variant="neutral">Neutral</Badge>

// Con ícono
<Badge icon={<Icon />} variant="success">
  Con ícono
</Badge>
```

### TimeSlotPicker

```tsx
<TimeSlotPicker
  slots={slots}
  onChange={setSlots}
  label="Horarios disponibles"
  quickPresets // Muestra plantillas rápidas
  allowOverlap // Permite solapamiento
  minDuration={30} // Duración mínima en minutos
/>
```

### LoadingSpinner

```tsx
<LoadingSpinner />
<LoadingSpinner size="sm" />
<LoadingSpinner size="lg" color="white" />
```

## 🎨 Tokens de Diseño

### Colores

```typescript
import { colors } from '@/styles/design-system';

// Uso en estilos inline
style={{ color: colors.primary[600] }}

// En Tailwind
className="bg-primary-600 text-white"
```

**Paletas disponibles:**

- `primary`: Azul índigo (50-900)
- `accent`: Púrpura (50-800)
- `success`: Verde (50-700)
- `warning`: Amarillo (50-600)
- `danger`: Rojo (50-700)
- `neutral`: Gris (50-950)

### Espaciado

```typescript
import { spacing } from '@/styles/design-system';

// xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, 2xl: 48px, 3xl: 64px
```

### Tipografía

```typescript
import { typography } from '@/styles/design-system';

// fontSize: xs, sm, base, lg, xl, 2xl, 3xl, 4xl
// fontWeight: normal, medium, semibold, bold
```

### Bordes

```typescript
import { borders } from '@/styles/design-system';

// radius: sm, md, lg, xl, 2xl, full
// width: thin, normal, thick
```

### Sombras

```typescript
import { shadows } from '@/styles/design-system';

// sm, md, lg, xl, 2xl, soft, glow
className = 'shadow-soft hover:shadow-xl';
```

## 🔧 Utilidades

### Función cn()

Combina clases CSS de manera segura:

```typescript
import { cn } from '@/styles/design-system';

className={cn(
  'base-class',
  isActive && 'active-class',
  isDisabled && 'disabled-class',
  customClassName
)}
```

### Generadores de Clases

```typescript
import {
  getButtonClasses,
  getInputClasses,
  getCardClasses,
  getBadgeClasses,
} from '@/styles/design-system';

// Generar clases de botón programáticamente
const buttonClasses = getButtonClasses('primary', 'md', true);

// Generar clases de input
const inputClasses = getInputClasses('default', hasError);
```

## 📐 Patrones de Diseño

### Layout Responsive

```tsx
// Mobile-first approach
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Contenido */}
</div>
```

### Formularios

```tsx
<form className="space-y-6">
  <Input label="Campo 1" name="field1" required />
  <Input label="Campo 2" name="field2" />

  <div className="flex gap-3 justify-end">
    <Button variant="secondary" onClick={handleCancel}>
      Cancelar
    </Button>
    <Button type="submit">Guardar</Button>
  </div>
</form>
```

### Cards Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <Card variant="elevated">{/* Contenido */}</Card>
</div>
```

## 🎯 Mejores Prácticas

### ✅ DO

```tsx
// Usar componentes del sistema
<Button variant="primary">Guardar</Button>

// Usar función cn() para clases condicionales
<div className={cn('base-class', isActive && 'active-class')} />

// Usar tokens del sistema
<div className="p-6 rounded-xl shadow-soft" />

// Mantener consistencia
<Button size="md" variant="primary">Acción 1</Button>
<Button size="md" variant="secondary">Acción 2</Button>
```

### ❌ DON'T

```tsx
// No usar estilos inline arbitrarios
<button style={{ backgroundColor: '#4f46e5' }}>Guardar</button>

// No crear variantes personalizadas sin actualizar el sistema
<button className="bg-[#123456]">Guardar</button>

// No mezclar tamaños inconsistentes
<Button size="sm">Acción 1</Button>
<Button size="xl">Acción 2</Button>

// No duplicar estilos
<div className="px-6 py-3 rounded-xl bg-white shadow-md">
  {/* Mejor usar <Card> */}
</div>
```

## 🎨 Guía de Accesibilidad

### Contraste de Color

- Texto en `primary-600` sobre fondo blanco: ✅ AAA
- Texto en `neutral-700` sobre fondo blanco: ✅ AAA
- Texto blanco sobre `primary-600`: ✅ AA

### Focus States

Todos los componentes interactivos tienen estados de focus visibles:

```tsx
// Automático en componentes del sistema
<Button>Click</Button>

// Manual en elementos custom
<div className="focus-visible:outline-2 focus-visible:outline-primary-600" />
```

### Labels

Siempre usar labels descriptivos:

```tsx
<Input label="Email" name="email" required />
// NO: <input type="email" placeholder="Email" />
```

## 🚀 Extensión del Sistema

### Agregar Nueva Variante de Botón

```typescript
// En design-system.ts
export const buttonVariants = {
  // ... variantes existentes
  custom: {
    base: 'bg-custom-color text-white',
    hover: 'hover:bg-custom-color-dark',
    active: 'active:bg-custom-color-darker',
    disabled: 'disabled:opacity-50',
    shadow: 'shadow-md hover:shadow-lg',
  },
};
```

### Agregar Nuevo Tamaño

```typescript
export const buttonSizes = {
  // ... tamaños existentes
  '2xl': 'px-12 py-6 text-2xl',
};
```

## 📚 Recursos

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Headless UI](https://headlessui.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Material Design Guidelines](https://material.io/design)

## 🔄 Versionado

**Versión actual**: 1.0.0

### Changelog

#### 1.0.0 (Inicial)

- Sistema de diseño completo
- Componentes base
- Tokens de diseño
- Utilidades y helpers

---

**Mantenido por**: Equipo de Desarrollo AmigOrganizador  
**Última actualización**: Diciembre 2024
