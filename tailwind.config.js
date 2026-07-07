/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0F',
        violet: {
          DEFAULT: '#7B2FBE',
          light: '#9B59D0',
        },
        lila: '#C084FC',
        text: {
          DEFAULT: '#F8F8FF',
          secondary: '#A0A0B8',
        },
        border: 'rgba(123, 47, 190, 0.2)',
        glow: 'rgba(123, 47, 190, 0.3)',
        success: '#10B981',
        error: '#EF4444',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['Inter', 'sans-serif'],
        luxury: ['"Cormorant Garamond"', 'serif'],
      },
    },
  },
  plugins: [],
};
