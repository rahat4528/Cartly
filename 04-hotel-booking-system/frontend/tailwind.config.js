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
        sand: {
          50: '#fbfaf8',
          100: '#f5f3ee',
          200: '#eae5dc',
          300: '#ded7c9',
          400: '#c5b59e',
          500: '#ac9475',
          600: '#947a59',
          700: '#7a6144',
          800: '#644e37',
          900: '#523f2d',
        },
        navy: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
        }
      },
    },
  },
  plugins: [],
}
