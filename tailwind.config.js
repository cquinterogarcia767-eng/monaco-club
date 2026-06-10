/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        monaco: {
          black:  '#0A0A0A',
          dark:   '#141414',
          card:   '#1E1E1E',
          red:    '#C41E3A',
          redDim: '#8B1628',
          silver: '#A8A8A8',
          white:  '#F5F5F5',
        }
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body:    ['"DM Sans"', 'sans-serif'],
      },
      animation: {
        'fade-up':   'fadeUp 0.4s ease forwards',
        'pulse-red': 'pulseRed 2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp:   { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pulseRed: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.6 } }
      }
    }
  },
  plugins: []
}