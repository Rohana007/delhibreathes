/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // AQI Level Colors - CPCB Standard
        aqi: {
          good: '#00B050',
          satisfactory: '#92D050',
          moderate: '#FFC107',
          poor: '#FF9900',
          veryPoor: '#DC2626',
          severe: '#7E0023',
        },
        // Brand Colors
        primary: {
          50: '#e6f7f7',
          100: '#b3e6e6',
          200: '#80d4d4',
          300: '#4dc3c3',
          400: '#26b5b5',
          500: '#00a6a6',
          600: '#009999',
          700: '#008585',
          800: '#007272',
          900: '#005252',
        },
        dark: {
          50: '#f4f6f7',
          100: '#e3e7ea',
          200: '#c8d1d7',
          300: '#a0aeb9',
          400: '#718494',
          500: '#566779',
          600: '#4a5667',
          700: '#404956',
          800: '#383f4a',
          900: '#1a1f2e',
          950: '#0d1117',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 166, 166, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 166, 166, 0.8)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

