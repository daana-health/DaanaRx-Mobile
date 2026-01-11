// Theme configuration matching shadcn design tokens
export const colors = {
  // Primary colors
  primary: '#2563eb',
  primaryForeground: '#ffffff',

  // Destructive/Error colors
  destructive: '#dc2626',
  destructiveForeground: '#ffffff',

  // Success colors
  success: '#10b981',
  successForeground: '#ffffff',

  // Warning colors
  warning: '#f59e0b',
  warningForeground: '#ffffff',

  // Secondary colors
  secondary: '#6b7280',
  secondaryForeground: '#ffffff',

  // Accent colors
  accent: '#f3f4f6',
  accentForeground: '#111827',

  // Muted colors
  muted: '#f9fafb',
  mutedForeground: '#6b7280',

  // Background colors
  background: '#ffffff',
  foreground: '#111827',

  // Card colors
  card: '#ffffff',
  cardForeground: '#111827',

  // Border & Input
  border: '#e5e7eb',
  input: '#e5e7eb',
  ring: '#2563eb',

  // Text colors
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',

  // State colors
  info: '#3b82f6',
  infoForeground: '#ffffff',
};

// Apple HIG-inspired spacing scale (base unit: 4pt)
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
  '5xl': 64,
};

// Apple-style border radius
export const borderRadius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
};

// Typography scale following Apple's SF Pro hierarchy
export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 34,
  '5xl': 40,
};

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};

// Line heights for optimal readability (Apple HIG standards)
export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};

// Standard layout dimensions
export const layout = {
  screenPadding: 16, // Standard horizontal screen padding
  cardPadding: 16,   // Standard card padding
  sectionSpacing: 24, // Space between major sections
  itemSpacing: 12,    // Space between list items
  headerHeight: 44,   // Standard navigation bar height
  tabBarHeight: 49,   // Standard tab bar height
};

export const shadows = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};
