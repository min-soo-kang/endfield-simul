/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0a0e17',
          panel: '#111827',
          hover: '#1a2332',
        },
        border: {
          DEFAULT: '#1e293b',
          light: '#334155',
        },
        accent: {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
        },
        highlight: {
          DEFAULT: '#f59e0b',
          hover: '#d97706',
        },
        text: {
          DEFAULT: '#e2e8f0',
          muted: '#94a3b8',
          dim: '#64748b',
        },
      },
    },
  },
  plugins: [],
};
