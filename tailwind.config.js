/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Chakra Petch"', '"Fredoka"', 'sans-serif'],
        arcade: ['"Fredoka"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        ink: '#080a12',
        carbon: '#0c0e18',
        surface: '#121624',
        surfaceBorder: '#232b3e',
        cream: '#FFFDF7',
        paper: '#F2EDE4',
        p1: '#0066FF',
        p1Light: '#D8E8FF',
        p1Cyan: '#00D2FF',
        p2: '#FF0055',
        p2Light: '#FFE0EB',
        p2Flame: '#FF2A4B',
        gold: '#FFB800',
        goldBright: '#FFE600',
        mint: '#00E5A3',
      },
      boxShadow: {
        chunky: '0 6px 0 #0D0917',
        'chunky-sm': '0 4px 0 #0D0917',
        'chunky-lg': '0 10px 0 #0D0917',
        'card-hover': '0 12px 0 #0D0917',
      },
      animation: {
        'bounce-soft': 'bounceSoft 2.4s ease-in-out infinite',
        'pop-in': 'popIn 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      },
      keyframes: {
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.92) translateY(8px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
