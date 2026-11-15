/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        pwa: {
          dark: '#0F172A',
          card: '#1E293B',
          accent: '#06B6D4',
          accentHover: '#0891B2',
          purple: '#8B5CF6'
        }
      }
    },
  },
  plugins: [],
}
