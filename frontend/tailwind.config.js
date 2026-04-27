/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif:  ["Playfair Display", "Georgia", "serif"],
        sans:   ["Inter", "Manrope", "Segoe UI", "sans-serif"],
      },
      colors: {
        vjti: {
          red:    "#9d2235",
          deep:   "#7f1022",
          light:  "#c3475b",
          gold:   "#d4a017",
          "gold-light": "#f0c040",
        },
      },
    },
  },
  plugins: [],
}

