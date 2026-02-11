/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design system colors from spec
        background: {
          primary: '#0d1117',
          secondary: '#161b22',
          elevated: '#1c2128',
        },
        border: {
          primary: '#30363d',
          accent: '#58a6ff',
        },
        text: {
          primary: '#c9d1d9',
          secondary: '#8b949e',
          accent: '#58a6ff',
        },
        status: {
          idle: '#6e7681',
          running: '#3fb950',
          waiting: '#d29922',
          error: '#f85149',
        },
        priority: {
          critical: '#f85149',
          high: '#d29922',
          medium: '#58a6ff',
          low: '#8b949e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
