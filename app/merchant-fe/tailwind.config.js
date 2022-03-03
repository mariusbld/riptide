module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: "#27272a",
          dark: "#fafafa",
        },
        secondary: {
          light: "#52525b",
          dark: "#a1a1aa",
        },
        input: {
          dark: "#fafafa",
          bg: {
            dark: "#52525b",
            hv: {
              dark: "#71717a"
            }
          },
        },
        btn: {
          dark: "#27272a",
          hv: {
            dark: "#ffffff",
          },
          bg: {
            dark: "#70EC9D",
            hv: {
              dark: "#70EC9D",
            }
          }
        }
      }
    },
    fontFamily: {
      'mono': ['Helvetica Neue', 'Arial', 'sans-serif'],
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
