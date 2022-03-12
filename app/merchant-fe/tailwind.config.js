module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
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
            light: "#e4e4e7",
            dark: "#52525b",
            hv: {
              dark: "#71717a",
            },
          },
        },
        modal: {
          light: "#2C2A2A",
          dark: "#fafafa",
          bg: {
            light: "#fafafa",
            dark: "#2C2A2A",
          },
        },
        btn: {
          light: "#27272a",
          dark: "#27272a",
          hv: {
            dark: "#ffffff",
            light: "#ffffff",
          },
          bg: {
            light: "#70EC9D",
            dark: "#70EC9D",
            hv: {
              dark: "#70EC9D",
            },
          },
          destr: {
            light: "#EC7A70",
            dark: "#EC7A70",
            bg: {
              light: "#EC7A70",
              dark: "#EC7A70",
            },
          },
        },
      },
    },
    fontFamily: {
      mono: ["Helvetica Neue", "Arial", "sans-serif"],
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
