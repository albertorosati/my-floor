/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Baloo 2"', 'cursive', 'sans-serif'],
        sans: ['"Nunito"', 'sans-serif'],
      },
      colors: {
        bg: '#1B1B3A',
        ink: '#14121F',
        paper: '#FFFDF5',
        yellow: '#FFC933',
        blue: '#2F6BFF',
        red: '#FF3D6E',
        green: '#19C37D',
        p1: '#2F6BFF',
        p2: '#FF3D6E',
        gold: '#FFC933',
        mint: '#19C37D',
        cream: '#FFFDF5',
      },
      boxShadow: {
        hard: '4px 4px 0 #14121F',
        'hard-sm': '2px 2px 0 #14121F',
        'hard-pressed': '1px 1px 0 #14121F',
        chunky: '4px 4px 0 #14121F',
        'chunky-sm': '2px 2px 0 #14121F',
      },
      borderRadius: {
        card: '16px',
        pill: '999px',
      },
    },
  },
  plugins: [],
};
