/**
 * Light Theme Helper Utilities
 * Provides consistent light theme styling across all components
 */

// Theme class mappings (light mode only)
export const themeClasses = {
  // Backgrounds
  background: {
    primary: 'bg-white',
    secondary: 'bg-gray-50',
    tertiary: 'bg-gray-100',
    elevated: 'bg-white',
    overlay: 'bg-white/95',
    transparent: 'bg-transparent',
  },

  // Text colors
  text: {
    primary: 'text-gray-900',
    secondary: 'text-gray-600',
    tertiary: 'text-gray-500',
    muted: 'text-gray-400',
    inverse: 'text-white',
    accent: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
  },

  // Borders
  border: {
    default: 'border-gray-200',
    light: 'border-gray-100',
    strong: 'border-gray-300',
    accent: 'border-blue-200',
    success: 'border-green-200',
    warning: 'border-yellow-200',
    error: 'border-red-200',
  },

  // Interactive elements
  interactive: {
    default: 'hover:bg-gray-50 focus:bg-gray-100',
    subtle: 'hover:bg-gray-100',
    button: 'bg-blue-600 hover:bg-blue-700',
    buttonSecondary: 'bg-gray-200 hover:bg-gray-300',
    input: 'bg-white border-gray-300 focus:border-blue-500',
    disabled: 'bg-gray-100 text-gray-400 cursor-not-allowed',
  },

  // Shadows
  shadow: {
    sm: 'shadow-sm',
    default: 'shadow',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  },

  // Status indicators
  status: {
    active: 'bg-blue-100 text-blue-800',
    inactive: 'bg-gray-100 text-gray-600',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
  },

  // Panels and cards
  panel: {
    default: 'bg-white border-gray-200',
    elevated: 'bg-white border-gray-200 shadow-lg',
    floating: 'bg-white/95 backdrop-blur-sm border-gray-200',
  },

  // Form elements
  form: {
    label: 'text-gray-700 font-medium',
    input: 'bg-white border-gray-300 text-gray-900 placeholder-gray-500',
    select: 'bg-white border-gray-300 text-gray-900',
    checkbox: 'text-blue-600 bg-gray-100 border-gray-300',
    radio: 'text-blue-600 bg-gray-100 border-gray-300',
  },
};

/**
 * Utility function to combine theme classes
 */
export const getThemeClasses = (...classKeys: string[]): string => {
  return classKeys.map(key => {
    const keys = key.split('.');
    let current: any = themeClasses;

    for (const k of keys) {
      current = current[k];
      if (!current) return '';
    }

    return current;
  }).join(' ');
};

/**
 * Button variants
 */
export const buttonVariants = {
  primary: `${themeClasses.interactive.button} ${themeClasses.text.inverse} ${themeClasses.shadow.default}`,
  secondary: `${themeClasses.interactive.buttonSecondary} ${themeClasses.text.primary} ${themeClasses.border.default}`,
  ghost: `${themeClasses.interactive.default} ${themeClasses.text.primary}`,
  outline: `bg-transparent ${themeClasses.border.default} ${themeClasses.text.primary} ${themeClasses.interactive.default}`,
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  success: 'bg-green-600 hover:bg-green-700 text-white',
};

/**
 * Icon colors
 */
export const iconColors = {
  default: 'text-gray-600',
  primary: 'text-blue-600',
  secondary: 'text-gray-500',
  success: 'text-green-600',
  warning: 'text-yellow-600',
  error: 'text-red-600',
  muted: 'text-gray-400',
};

/**
 * Focus styles
 */
export const focusStyles = {
  default: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
  inset: 'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500',
  button: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
};

/**
 * Animation classes
 */
export const animations = {
  fadeIn: 'animate-fadeIn',
  slideIn: 'animate-slideIn',
  pulse: 'animate-pulse',
  spin: 'animate-spin',
  bounce: 'animate-bounce',
};

/**
 * Responsive design helpers
 */
export const responsive = {
  mobile: 'block sm:hidden',
  tablet: 'hidden sm:block lg:hidden',
  desktop: 'hidden lg:block',
  notMobile: 'hidden sm:block',
  mobileOnly: 'block sm:hidden',
};

/**
 * Spacing utilities
 */
export const spacing = {
  xs: 'p-1',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
  '2xl': 'p-12',
};

/**
 * Generate a complete theme class string for a component
 */
export const createThemeClass = (options: {
  background?: keyof typeof themeClasses.background;
  text?: keyof typeof themeClasses.text;
  border?: keyof typeof themeClasses.border;
  shadow?: keyof typeof themeClasses.shadow;
  interactive?: boolean;
  customClasses?: string;
}): string => {
  const classes = [];

  if (options.background) {
    classes.push(themeClasses.background[options.background]);
  }

  if (options.text) {
    classes.push(themeClasses.text[options.text]);
  }

  if (options.border) {
    classes.push(themeClasses.border[options.border]);
  }

  if (options.shadow) {
    classes.push(themeClasses.shadow[options.shadow]);
  }

  if (options.interactive) {
    classes.push(themeClasses.interactive.default);
    classes.push(focusStyles.default);
  }

  if (options.customClasses) {
    classes.push(options.customClasses);
  }

  return classes.filter(Boolean).join(' ');
};

/**
 * Common component patterns
 */
export const componentPatterns = {
  card: createThemeClass({
    background: 'elevated',
    border: 'default',
    shadow: 'lg',
    customClasses: 'rounded-lg'
  }),

  modal: createThemeClass({
    background: 'primary',
    border: 'default',
    shadow: 'xl',
    customClasses: 'rounded-lg'
  }),

  toolbar: createThemeClass({
    background: 'secondary',
    border: 'default',
    text: 'primary',
    customClasses: 'rounded-lg'
  }),

  panel: createThemeClass({
    background: 'overlay',
    border: 'default',
    shadow: 'lg',
    customClasses: 'rounded-lg backdrop-blur-sm'
  }),

  button: createThemeClass({
    interactive: true,
    customClasses: 'rounded-md px-4 py-2 font-medium transition-all duration-200'
  }),

  input: createThemeClass({
    background: 'primary',
    border: 'default',
    text: 'primary',
    customClasses: 'rounded-md px-3 py-2 transition-colors duration-200'
  }),
};