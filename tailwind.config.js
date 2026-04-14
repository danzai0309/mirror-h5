/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mirror: {
          bg: '#09090F',
          surface: '#111119',
          glass: 'rgba(255,255,255,0.04)',
          glassBorder: 'rgba(255,255,255,0.08)',
          crimson: '#E84040',
          crimsonDim: '#7A1A1A',
          crimsonGlow: 'rgba(232,64,64,0.3)',
          amber: '#F59E0B',
          teal: '#14B8A6',
          tealDim: '#0D3D38',
          tealGlow: 'rgba(20,184,166,0.25)',
          cyan: '#22D3EE',
          text: '#E8E8F0',
          textDim: '#6B6B80',
          textMuted: '#3A3A50',
        }
      },
      fontFamily: {
        display: ['"Noto Serif SC"', 'serif'],
        body: ['"Noto Sans SC"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'sphere-pulse': 'spherePulse 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite',
        'collapse': 'collapseSphere 3s ease-in-out forwards',
      },
      keyframes: {
        spherePulse: {
          '0%, 100%': { opacity: '0.7', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        collapseSphere: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '60%': { transform: 'scale(0.3)', opacity: '0.3' },
          '100%': { transform: 'scale(0)', opacity: '0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
