module.exports = {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
      extend: {
        fontFamily: {
          inter: ['"Inter"', 'sans-serif'],
        },
        boxShadow: {
          '3xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        },
      },
    },
    plugins: [require("tailwindcss-animate")],
};