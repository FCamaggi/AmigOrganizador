/**
 * Sistema de Diseño Centralizado - AmigOrganizador
 * Configuración única de estilos, tokens y variantes
 */

// ========== TOKENS DE COLOR ==========
export const colors = {
  primary: {
    50: '#f0f4ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },
  accent: {
    50: '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef',
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
  },
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
};

// ========== TOKENS DE ESPACIADO ==========
export const spacing = {
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '1rem', // 16px
  lg: '1.5rem', // 24px
  xl: '2rem', // 32px
  '2xl': '3rem', // 48px
  '3xl': '4rem', // 64px
};

// ========== COLORES SEMÁNTICOS DE TEXTO ==========
export const textColors = {
  // Texto principal sobre fondo claro (cards, modales)
  primary: 'text-neutral-900',
  secondary: 'text-neutral-700',
  tertiary: 'text-neutral-600',
  disabled: 'text-neutral-400',
  
  // Texto sobre fondo oscuro/gradientes
  onDark: 'text-white',
  onDarkSecondary: 'text-white/90',
  
  // Labels y títulos de formularios
  label: 'text-neutral-900',
  heading: 'text-neutral-900',
  
  // Estados
  error: 'text-danger-600',
  success: 'text-success-600',
  warning: 'text-warning-600',
  info: 'text-primary-600',
};

// ========== TOKENS DE TIPOGRAFÍA ==========
export const typography = {
  fontFamily: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'Fira Code', 'Courier New', monospace",
  },
  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
};

// ========== TOKENS DE BORDES ==========
export const borders = {
  radius: {
    none: '0',
    sm: '0.375rem', // 6px
    md: '0.5rem', // 8px
    lg: '0.75rem', // 12px
    xl: '1rem', // 16px
    '2xl': '1.5rem', // 24px
    full: '9999px',
  },
  width: {
    thin: '1px',
    normal: '2px',
    thick: '3px',
  },
};

// ========== TOKENS DE SOMBRAS ==========
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
  glow: '0 0 20px rgba(99, 102, 241, 0.2)',
};

// ========== ANIMACIONES ==========
export const animations = {
  transition: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// ========== VARIANTES DE COMPONENTES ==========

// Variantes de botones
export const buttonVariants = {
  primary: {
    base: 'bg-gradient-to-r from-primary-600 to-primary-700 text-white',
    hover: 'hover:from-primary-700 hover:to-primary-800',
    active: 'active:from-primary-800 active:to-primary-900',
    disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
    shadow: 'shadow-lg hover:shadow-xl',
  },
  secondary: {
    base: 'bg-white text-neutral-700 border border-neutral-200',
    hover: 'hover:bg-neutral-50 hover:border-neutral-300',
    active: 'active:bg-neutral-100',
    disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
    shadow: 'shadow-md hover:shadow-lg',
  },
  outline: {
    base: 'bg-transparent text-primary-600 border-2 border-primary-500',
    hover: 'hover:bg-primary-50 hover:border-primary-600',
    active: 'active:bg-primary-100',
    disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
    shadow: '',
  },
  ghost: {
    base: 'bg-transparent text-neutral-700',
    hover: 'hover:bg-neutral-100',
    active: 'active:bg-neutral-200',
    disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
    shadow: '',
  },
  danger: {
    base: 'bg-gradient-to-r from-danger-500 to-danger-600 text-white',
    hover: 'hover:from-danger-600 hover:to-danger-700',
    active: 'active:from-danger-700 active:to-danger-800',
    disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
    shadow: 'shadow-lg hover:shadow-xl',
  },
  success: {
    base: 'bg-gradient-to-r from-success-500 to-success-600 text-white',
    hover: 'hover:from-success-600 hover:to-success-700',
    active: 'active:from-success-700 active:to-success-800',
    disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
    shadow: 'shadow-lg hover:shadow-xl',
  },
};

// Tamaños de botones
export const buttonSizes = {
  xs: 'px-3 py-1.5 text-xs',
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
  xl: 'px-10 py-5 text-xl',
};

// Variantes de inputs
export const inputVariants = {
  default: {
    base: 'w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl',
    focus: 'focus:ring-2 focus:ring-primary-500 focus:border-transparent',
    disabled: 'disabled:bg-neutral-100 disabled:cursor-not-allowed',
    error: 'border-danger-500 focus:ring-danger-500',
  },
  minimal: {
    base: 'w-full px-3 py-2 bg-transparent border-b border-neutral-300',
    focus: 'focus:border-primary-600 focus:outline-none',
    disabled: 'disabled:text-neutral-400 disabled:cursor-not-allowed',
    error: 'border-danger-500 focus:border-danger-600',
  },
};

// Variantes de cards
export const cardVariants = {
  default: {
    base: 'bg-white rounded-2xl shadow-soft p-6',
    hover: '',
  },
  elevated: {
    base: 'bg-white rounded-2xl shadow-lg p-6',
    hover: 'hover:shadow-xl transition-shadow',
  },
  interactive: {
    base: 'bg-white rounded-2xl shadow-soft p-6 cursor-pointer',
    hover: 'hover:shadow-xl hover:-translate-y-1 transition-all duration-300',
  },
  gradient: {
    base: 'bg-gradient-to-br from-primary-600 to-accent-600 rounded-2xl shadow-lg p-6 text-white',
    hover: 'hover:shadow-2xl hover:-translate-y-1 transition-all duration-300',
  },
};

// Variantes de badges
export const badgeVariants = {
  primary: 'bg-primary-100 text-primary-700 border border-primary-200',
  success: 'bg-success-100 text-success-700 border border-success-200',
  warning: 'bg-warning-100 text-warning-700 border border-warning-200',
  danger: 'bg-danger-100 text-danger-700 border border-danger-200',
  neutral: 'bg-neutral-100 text-neutral-700 border border-neutral-200',
};

// ========== UTILIDADES ==========

/**
 * Combina clases CSS eliminando duplicados
 */
export const cn = (
  ...classes: (string | undefined | null | false)[]
): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Genera clases para un botón según variante y tamaño
 */
export const getButtonClasses = (
  variant: keyof typeof buttonVariants = 'primary',
  size: keyof typeof buttonSizes = 'md',
  fullWidth: boolean = false
): string => {
  const variantStyles = buttonVariants[variant];
  return cn(
    'rounded-xl font-semibold transition-all duration-200',
    'flex items-center justify-center gap-2',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
    variantStyles.base,
    variantStyles.hover,
    variantStyles.active,
    variantStyles.disabled,
    variantStyles.shadow,
    buttonSizes[size],
    fullWidth && 'w-full'
  );
};

/**
 * Genera clases para un input según variante
 */
export const getInputClasses = (
  variant: keyof typeof inputVariants = 'default',
  hasError: boolean = false
): string => {
  const variantStyles = inputVariants[variant];
  return cn(
    'outline-none transition-all duration-200',
    'text-neutral-900 placeholder-neutral-400',
    variantStyles.base,
    variantStyles.focus,
    variantStyles.disabled,
    hasError && variantStyles.error
  );
};

/**
 * Genera clases para una card según variante
 */
export const getCardClasses = (
  variant: keyof typeof cardVariants = 'default'
): string => {
  const variantStyles = cardVariants[variant];
  return cn(variantStyles.base, variantStyles.hover);
};

/**
 * Genera clases para un badge según variante
 */
export const getBadgeClasses = (
  variant: keyof typeof badgeVariants = 'neutral'
): string => {
  return cn(
    'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold',
    badgeVariants[variant]
  );
};

// ========== BREAKPOINTS RESPONSIVOS ==========
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// ========== Z-INDEX SCALE ==========
export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

export default {
  colors,
  spacing,
  typography,
  borders,
  shadows,
  animations,
  buttonVariants,
  buttonSizes,
  inputVariants,
  cardVariants,
  badgeVariants,
  breakpoints,
  zIndex,
  cn,
  getButtonClasses,
  getInputClasses,
  getCardClasses,
  getBadgeClasses,
};
