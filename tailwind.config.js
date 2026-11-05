/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fredoka"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        ink: '#181226',
        cream: '#FFFDF7',
        paper: '#F6F0E2',
        p1: '#2563EB',
        p1Light: '#DBEAFE',
        p2: '#FF4757',
        p2Light: '#FFE4E6',
        gold: '#FFB800',
        mint: '#10B981',
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
