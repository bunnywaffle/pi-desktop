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
          950: 'var(--color-dark-950, #09090b)',
          900: 'var(--color-dark-900, #121214)',
          850: 'var(--color-dark-850, #18181b)',
          800: 'var(--color-dark-800, #202024)',
          750: 'var(--color-dark-750, #27272a)',
          700: 'var(--color-dark-700, #2e2e36)',
          600: 'var(--color-dark-600, #3f3f46)',
          500: 'var(--color-dark-500, #52525b)',
          400: 'var(--color-dark-400, #71717a)',
          300: 'var(--color-dark-300, #a1a1aa)',
          200: 'var(--color-dark-200, #e4e4e7)',
          100: 'var(--color-dark-100, #f4f4f5)'
        },
        pi: {
          accent: 'var(--color-pi-accent, #10a37f)',
          hover: 'var(--color-pi-accent-hover, #0d8a6a)',
          subtle: 'var(--color-pi-accent-subtle, rgba(16, 163, 127, 0.15))',
          orange: '#f97316',
          emerald: '#10b981',
          purple: '#8b5cf6'
        }
      }
    },
  },
  plugins: [],
}
