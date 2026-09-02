/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: '#EDEAE0',
        ink: '#1C1A16',
        verified: '#1E5945',
        pending: '#B8802E',
        critical: '#9A3B2C',
        rule: '#C9C4B4',
        // Keeping primary for some generic button states if needed, but styling mostly with new tokens
        primary: {
          50: '#e6f6ef',
          100: '#ccecd4',
          200: '#99d9aa',
          300: '#66c57f',
          400: '#33b255',
          500: '#008751',
          600: '#007a49',
          700: '#00613a',
          800: '#00482b',
          900: '#003620',
        }
      },
      fontFamily: {
        serif: ['Merriweather', 'Georgia', 'serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
