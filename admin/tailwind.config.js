/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#F8F4EF',
        sand: '#EADBC8',
        gold: '#D4A373',
        'gold-deep': '#B07F4F',
        ink: '#2C2C2C',
        graphite: '#3A3A3A',
        forest: '#2D6A4F',
        panel: '#FFFFFF',
        canvas: '#F3EEE7',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        button: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 30px -16px rgba(44,44,44,0.18)',
        card: '0 18px 44px -22px rgba(44,44,44,0.28)',
      },
    },
  },
  plugins: [],
}
