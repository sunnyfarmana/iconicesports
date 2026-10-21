/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgmi: {
          dark: '#07090e',
          surface: '#0d121c',
          card: '#121824',
          cardHover: '#182132',
          border: '#1f2a3f',
          borderLight: '#2c3b57',
          gold: '#d97706',
          goldLight: '#f59e0b',
          goldGlow: 'rgba(217, 119, 6, 0.25)',
          red: '#dc2626',
          redDark: '#991b1b',
          redLight: '#ef4444',
          charcoal: '#151d2c',
          muted: '#8b9bb4'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Rajdhani', 'Chakra Petch', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      backgroundImage: {
        'radial-gradient': 'radial-gradient(circle at center, var(--tw-gradient-stops))',
        'esports-grid': "radial-gradient(rgba(245, 158, 11, 0.05) 1px, transparent 1px)"
      },
      boxShadow: {
        'gold-sm': '0 1px 3px 0 rgba(217, 119, 6, 0.2), 0 1px 2px -1px rgba(217, 119, 6, 0.2)',
        'gold-lg': '0 4px 20px -2px rgba(217, 119, 6, 0.3)',
        'red-sm': '0 1px 3px 0 rgba(220, 38, 38, 0.25)',
        'red-lg': '0 4px 20px -2px rgba(220, 38, 38, 0.35)',
        'tactical': '0 4px 24px -2px rgba(0, 0, 0, 0.65)'
      }
    },
  },
  plugins: [],
}
