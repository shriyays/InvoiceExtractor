/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#1a1d27",
        base: "#0f1117",
      },
    },
  },
  plugins: [],
};
