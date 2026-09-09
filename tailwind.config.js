/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#09090b',
          900: '#121214',
          850: '#18181b',
          800: '#202024',
          700: '#27272a',
          600: '#3f3f46',
          500: '#52525b',
          400: '#71717a',
          300: '#a1a1aa',
          200: '#e4e4e7',
          100: '#f4f4f5'
        },
        pi: {
          accent: '#3b82f6',
          hover: '#2563eb',
          subtle: 'rgba(59, 130, 246, 0.12)',
          orange: '#f97316',
          emerald: '#10b981',
          purple: '#8b5cf6'
        }
      }
    },
  },
  plugins: [],
}
