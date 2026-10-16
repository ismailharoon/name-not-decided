/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#EE8200',
          600: '#D47100',
          700: '#B05C00',
          800: '#8C4800',
          900: '#6E3800',
        },
        obsidian: {
          DEFAULT: '#0B0A09',
          800: '#1C1917',
          900: '#12100E',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Outfit"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'executive': '0 10px 30px -10px rgba(238, 130, 0, 0.14)',
        'executive-lg': '0 20px 45px -15px rgba(238, 130, 0, 0.25)',
      }
    },
  },
  plugins: [],
};
