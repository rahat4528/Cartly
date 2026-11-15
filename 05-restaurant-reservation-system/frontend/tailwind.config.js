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
        wine: {
          50: '#fcf8f8',
          100: '#f7eeef',
          200: '#edd8db',
          300: '#deb8bf',
          400: '#c88c99',
          500: '#b16374',
          600: '#9b4759',
          700: '#813645',
          800: '#6d2f3b',
          900: '#4a1e27',
          950: '#2b0f15',
        },
      },
    },
  },
  plugins: [],
}
