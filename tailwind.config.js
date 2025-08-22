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
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        // Earthy blues - sky and water
        primary: {
          50: '#f0f8ff',
          100: '#e0f1fe',
          200: '#b9e1fc',
          300: '#7cc8f8',
          400: '#36adf2',
          500: '#0d91e3',
          600: '#0174c2',
          700: '#035d9d',
          800: '#084f82',
          900: '#0d426c',
        },
        // Forest greens
        secondary: {
          50: '#f3f8f3',
          100: '#e4f0e4',
          200: '#cae1ca',
          300: '#a1cba1',
          400: '#70b070',
          500: '#4a954a',
          600: '#367936',
          700: '#2d612d',
          800: '#264e26',
          900: '#214121',
        },
        // Warm earth tones
        accent: {
          50: '#faf8f5',
          100: '#f3ede6',
          200: '#e6d7c7',
          300: '#d4bba1',
          400: '#c19974',
          500: '#b07d56',
          600: '#a3694a',
          700: '#87563f',
          800: '#6e4738',
          900: '#5a3b30',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Inter', 'serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
        adventure: ['Outfit', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}