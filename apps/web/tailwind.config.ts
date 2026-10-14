import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          deep: '#063B4C',
          blue: '#087EA4',
          green: '#16A085',
          coral: '#FF7660',
          sand: '#F5E9D5',
          foam: '#F8FCFC',
          navy: '#082A38',
          light: '#E8F4F8',
          muted: '#94A3B8',
          border: '#E2E8F0',
          surface: '#FFFFFF',
          text: '#1E293B',
          'text-secondary': '#64748B',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          info: '#3B82F6',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'fade-in-down': 'fadeInDown 0.4s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.2s ease-out',
        'slide-in-up': 'slideInUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse-slow 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'wave': 'wave 3s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          from: { opacity: '0', transform: 'translateY(-24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-10px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        slideInUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        wave: {
          '0%, 100%': { transform: 'translateX(0) translateY(0)' },
          '25%': { transform: 'translateX(5px) translateY(-3px)' },
          '50%': { transform: 'translateX(0) translateY(-5px)' },
          '75%': { transform: 'translateX(-5px) translateY(-3px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      boxShadow: {
        'ocean': '0 4px 14px rgba(8, 126, 164, 0.15)',
        'ocean-lg': '0 8px 30px rgba(8, 126, 164, 0.2)',
        'float': '0 12px 40px rgba(0, 0, 0, 0.1)',
        'glow': '0 0 20px rgba(8, 126, 164, 0.3)',
      },
      backgroundImage: {
        'ocean-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 Q40 15 30 25 Q20 35 30 45 Q40 55 30 55' stroke='%23087EA4' stroke-width='0.5' fill='none' opacity='0.08'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};

export default config;
