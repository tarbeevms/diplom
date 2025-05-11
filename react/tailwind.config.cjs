// tailwind.config.cjs
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"], // you can omit content in v4, but OK to leave
  theme: {
    extend: {
      boxShadow: { '3xl': '0 25px 50px -12px rgba(0,0,0,0.25)' },
      fontFamily: { inter: ['"Inter"', 'sans-serif'] },
      colors: {
        purple: { 400: '#A78BFA' },
        pink:   { 500: '#EC4899' },
        red:    { 500: '#EF4444' },
      },
    },
  },
  plugins: [],
}