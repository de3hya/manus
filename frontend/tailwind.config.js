/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyan: '#7dd3fc',
        lavender: '#c4b5fd',
        mint: '#6ee7b7',
        rose: '#fda4af',
      },
    },
  },
  plugins: [],
}
