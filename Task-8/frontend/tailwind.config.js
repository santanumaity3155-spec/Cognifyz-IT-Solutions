/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        workspace: '#1B2638',
        nav: '#172235',
        rail: '#121B2A',
        card: '#1D2A3D',
        'card-subtle': '#223249',
        'card-hover': '#263852',
        borderSubtle: '#34435B',
        borderMuted: '#26364D',
        accentPurple: '#6257F5',
        accentBlue: '#5379F5',
        accentLavender: '#A99CFB',
        accentGreen: '#65DDA5',
        accentAmber: '#F5B94C',
        accentRed: '#F16C80',
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6257f5',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
      },
      boxShadow: {
        'workspace': '0 25px 70px -15px rgba(10, 16, 28, 0.45)',
        'card': '0 4px 20px -2px rgba(10, 16, 28, 0.25)',
        'glow-purple': '0 0 20px -3px rgba(98, 87, 245, 0.35)',
        'glow-green': '0 0 20px -3px rgba(101, 221, 165, 0.35)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'monospace'],
      },
    },
  },
  plugins: [],
};
