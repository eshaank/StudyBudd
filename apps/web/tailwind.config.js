// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
      './pages/**/*.{js,ts,jsx,tsx,mdx}',
      './components/**/*.{js,ts,jsx,tsx,mdx}',
      './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    mode: 'jit',
    theme: {
      extend: {
        keyframes: {
          // reveal text from 0 characters to N characters
          typing: {
            '0%':   { width: '0ch' },
            '100%': { width: 'var(--nch)' }, // use CSS var to control length
          },
          caret: {
            '0%,100%': { borderRightColor: 'transparent' },
            '50%':     { borderRightColor: 'black' }, // caret blink
          },
        },
        animation: {
          // duration & steps will use the same N as nch for crisp stepping
          typing:  'typing var(--dur,3.2s) steps(var(--steps), end) var(--delay,0s) both, caret .75s step-end infinite',
        },
      },
    },
    plugins: [],
  };
