/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'burgundy-950': '#150305',
        'burgundy-900': '#1a0508',
        'burgundy-800': '#2d0b11',
        'burgundy-700': '#4a121a',
        'gold-primary': '#ffb703',
        'gold-secondary': '#d4af37',
      },
      boxShadow: {
        'glow-gold': '0 0 15px rgba(255, 183, 3, 0.3)',
        'glow-burgundy': '0 0 15px rgba(128, 0, 32, 0.4)',
      },
      animation: {
        'gradient-x': 'gradient-x 4s ease infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        }
      }
    },
  },
  plugins: [],
}
