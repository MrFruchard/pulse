import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        pulse: {
          green: '#4ade80',
        },
      },
      keyframes: {
        // Battement principal — double pic comme un vrai cœur
        heartbeat: {
          '0%':   { transform: 'scale(1)',    opacity: '1' },
          '10%':  { transform: 'scale(1.25)', opacity: '1' },
          '20%':  { transform: 'scale(1.1)',  opacity: '1' },
          '30%':  { transform: 'scale(1.35)', opacity: '1' },
          '45%':  { transform: 'scale(1)',    opacity: '1' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
        // Onde qui se répand depuis le texte
        ripple: {
          '0%':   { transform: 'scale(0.8)', opacity: '0.6' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        // Fade in du texte au démarrage
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Fade out global à la fin
        fadeOut: {
          '0%':   { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },
      animation: {
        'pulse-slow':  'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'heartbeat':   'heartbeat 0.8s ease-in-out',
        'ripple':      'ripple 0.8s ease-out forwards',
        'fade-in':     'fadeIn 0.5s ease-out forwards',
        'fade-out':    'fadeOut 0.4s ease-in forwards',
      },
    },
  },
  plugins: [],
}

export default config
