/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Nunito", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Quicksand", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        cream: {
          50: "#fdfaf5",
          100: "#faf3e7",
          200: "#f3e4cd",
        },
        terracotta: {
          50: "#fdf1ec",
          100: "#fbe1d4",
          200: "#f5c7ae",
          300: "#eca47c",
          400: "#e0824f",
          500: "#c96a3a",
          600: "#b0552c",
          700: "#8f4324",
          800: "#743620",
          900: "#602e1c",
        },
        sage: {
          50: "#f5f7ee",
          100: "#e8edd6",
          200: "#d1ddb0",
          300: "#b3c586",
          400: "#96ad63",
          500: "#7c9349",
          600: "#63753a",
          700: "#4e5c30",
          800: "#404b29",
          900: "#374023",
        },
      },
    },
  },
  plugins: [],
};
