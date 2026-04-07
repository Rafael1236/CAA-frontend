/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/components/FlightPrepModal/**/*.{js,jsx}',
    './src/components/flightprep/**/*.{js,jsx}',
  ],
  corePlugins: {
    preflight: false, // No reset CSS — Bootstrap mantiene el control
  },
  theme: {
    extend: {},
  },
  plugins: [],
}
