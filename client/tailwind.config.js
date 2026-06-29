/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // YS Creations brand palette
        cream: '#F8F4EF', // primary
        sand: '#EADBC8', // secondary
        gold: '#D4A373', // accent
        ink: '#2C2C2C', // dark
        graphite: '#3A3A3A', // text
        forest: '#2D6A4F', // success
        // tonal helpers
        'gold-soft': '#E4C8A8',
        'gold-deep': '#B07F4F',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        button: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 40px -12px rgba(44,44,44,0.18)',
        card: '0 20px 50px -20px rgba(44,44,44,0.25)',
        glow: '0 0 0 1px rgba(212,163,115,0.25), 0 18px 40px -16px rgba(212,163,115,0.45)',
      },
      borderRadius: {
        xl2: '1.5rem',
        '4xl': '2rem',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'spin-slow': {
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 1.6s infinite',
        'spin-slow': 'spin-slow 26s linear infinite',
      },
      transitionTimingFunction: {
        lux: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
