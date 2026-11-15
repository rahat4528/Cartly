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
        cinema: {
          950: '#090a0f',
          900: '#10121a',
          800: '#1b1e2b',
          700: '#282d3f',
          gold: '#f59e0b',
        },
      },
    },
  },
  plugins: [],
}
