/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          gold: '#e8b44b',
          blue: '#1d4ed8',
          navy: '#0f1e2e',
        }
      }
    },
  },
  plugins: [],
}
