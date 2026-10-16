/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#06040D',
        violet: {
          DEFAULT: '#7B2FBE',
          light: '#9B59D0',
        },
        lila: '#C084FC',
        text: {
          DEFAULT: '#F8F4FF',
          secondary: '#9A90B8',
        },
        border: 'rgba(147, 51, 234, 0.18)',
        glow: 'rgba(139, 51, 208, 0.4)',
        success: '#10B981',
        error: '#EF4444',
      },
      fontFamily: {
        display: ['Outfit', 'system-ui', 'sans-serif'],
        body: ['Manrope', 'system-ui', 'sans-serif'],
        luxury: ['Cinzel', 'Georgia', 'serif'],
        logo: ['"Playfair Logo"', 'Georgia', 'serif'],
      },
      letterSpacing: {
        luxury: '0.25em',
        wide2: '0.15em',
        widest: '0.3em',
      },
      animation: {
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'fade-in': 'fade-in 1s ease-out forwards',
        'fade-up': 'fade-up 0.8s ease-out forwards',
        entrada: 'fade-up 0.45s cubic-bezier(0.32, 0.72, 0, 1) both',
        'gradient-shift': 'gradient-shift 3s ease-in-out infinite',
        // Curvas tipo resorte (sobrepasan apenas y vuelven), solo con transform
        // y opacity para que corran en el compositor.
        hoja: 'hoja 0.38s cubic-bezier(0.32, 0.72, 0, 1)',
        panel: 'panel 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
        bump: 'bump 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'orb-1': 'orb-1 22s ease-in-out infinite',
        'orb-2': 'orb-2 26s ease-in-out infinite',
        'orb-3': 'orb-3 19s ease-in-out infinite',
      },
      keyframes: {
        hoja: {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        panel: {
          from: { opacity: '0', transform: 'translateX(24px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateX(0) scale(1)' },
        },
        bump: {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.35)' },
          '100%': { transform: 'scale(1)' },
        },
        'orb-1': {
          '0%, 100%': { transform: 'translate(-10%, -10%)' },
          '50%': { transform: 'translate(20%, 15%)' },
        },
        'orb-2': {
          '0%, 100%': { transform: 'translate(15%, -15%)' },
          '50%': { transform: 'translate(-15%, 10%)' },
        },
        'orb-3': {
          '0%, 100%': { transform: 'translate(-15%, 15%)' },
          '50%': { transform: 'translate(10%, -10%)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.5', boxShadow: '0 0 20px rgba(139, 51, 208, 0.3)' },
          '50%': { opacity: '1', boxShadow: '0 0 40px rgba(139, 51, 208, 0.6)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      backdropBlur: {
        xs: '2px',
        '3xl': '64px',
      },
      backgroundSize: {
        '200': '200%',
      },
    },
  },
  plugins: [],
};
