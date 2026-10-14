export const COLORS = {
  deepOcean: '#063B4C',
  oceanBlue: '#087EA4',
  seaGreen: '#16A085',
  coral: '#FF7660',
  sand: '#F5E9D5',
  foam: '#F8FCFC',
  deepNavy: '#082A38',
  white: '#FFFFFF',
  black: '#000000',
  lightBlue: '#E0F2FE',
  lightGreen: '#ECFDF5',
  lightCoral: '#FFF5F5',
  lightSand: '#FEF9EF',
  background: '#F8FCFC',
  card: '#FFFFFF',
  border: '#E5E7EB',
  text: '#111827',
  textSecondary: '#6B7280',
  primary: '#087EA4',
  success: '#16A085',
  error: '#FF7660',
  warning: '#F59E0B',
  info: '#E0F2FE',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
} as const;

export const GRADIENTS = {
  ocean: ['#063B4C', '#087EA4', '#16A085'],
  oceanSoft: ['#E0F2FE', '#F8FCFC'],
  coral: ['#FF7660', '#FF9A8B'],
  green: ['#16A085', '#2DD4BF'],
  deep: ['#082A38', '#063B4C'],
  sunset: ['#FF7660', '#F59E0B'],
  card: ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)'],
  glass: ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)'],
  heroOverlay: ['rgba(6,59,76,0.85)', 'rgba(8,46,56,0.95)'],
} as const;

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  xl: {
    shadowColor: '#087EA4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
  },
  ocean: {
    shadowColor: '#087EA4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
} as const;

export const GLASS = {
  light: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    backdropFilter: 'blur(12px)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  dark: {
    backgroundColor: 'rgba(6,59,76,0.75)',
    backdropFilter: 'blur(12px)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tinted: {
    backgroundColor: 'rgba(8,126,164,0.1)',
    backdropFilter: 'blur(12px)',
    borderWidth: 1,
    borderColor: 'rgba(8,126,164,0.2)',
  },
} as const;

export const ANIMATION = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 400,
    verySlow: 600,
  },
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  easing: {
    ease: [0.25, 0.1, 0.25, 1],
    easeIn: [0.4, 0, 1, 1],
    easeOut: [0, 0, 0.2, 1],
    easeInOut: [0.4, 0, 0.2, 1],
    bounce: [0.68, -0.55, 0.265, 1.55],
  },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  hero: 36,
} as const;
