/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        corporate: {
          DEFAULT: '#0f4c81',
          dark: '#0a365c',
          light: '#e6f0fa',
        }
      }
    },
  },
  plugins: [],
}