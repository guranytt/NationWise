/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Dark Mode (Default)
        'nw-dark-bg': '#0A0F0D',
        'nw-dark-surface': '#111916',
        
        // Light Mode
        'nw-light-bg': '#F0FDF4',
        'nw-light-surface': '#FFFFFF',
        
        // Primary Brand (Emerald/Deep Green)
        'nw-primary': {
          DEFAULT: '#059669', // emerald-600
          light: '#10B981',   // emerald-500
          dark: '#065F46',    // emerald-800
        },
        
        // Text Colors
        'nw-text-dark': '#F0FDF4',
        'nw-text-dark-muted': '#9CA3AF',
        'nw-text-light': '#111827',
        'nw-text-light-muted': '#6B7280',
        
        // Semantic
        'nw-accent': '#34D399', // emerald-400
        'nw-danger': '#EF4444',
        'nw-warning': '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
