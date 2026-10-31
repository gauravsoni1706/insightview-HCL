/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F3F5F9",
        sidebar: "#FFFFFF",
        card: "#FFFFFF",
        primaryText: "#20232B",
        secondaryText: "#858B98",
        primaryBlue: "#465CF5",
        lightBlue: "#E9EDFF",
        borderGrey: "#EAECF0",
        successGreen: "#42B994",
        warningOrange: "#F4B65E",
        dangerRed: "#F07882",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      borderRadius: {
        'card': '16px',
        'subtle': '12px',
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        'card-hover': '0 4px 12px 0 rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
