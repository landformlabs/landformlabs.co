/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Landform Labs Brand Colors
        "summit-sage": "#7A8471",
        "desert-stone": "#A6947C",
        "slate-storm": "#4A5568",
        "alpine-mist": "#F7F9F7",
        basalt: "#2D3142",
        // Semantic color mappings
        primary: "#7A8471",
        secondary: "#A6947C",
        accent: "#4A5568",
        background: "#F7F9F7",
        foreground: "#2D3142",
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        trispace: ["Trispace", "monospace"],
        "eb-garamond": ["EB Garamond", "serif"],
        sans: ["Trispace", "monospace"], // Override default sans-serif with body font
        headline: ["Trispace", "monospace"], // Semantic alias for headlines
        body: ["Trispace", "monospace"], // Semantic alias for body text
      },
      typography: {
        DEFAULT: {
          css: {
            color: "#2D3142",
            fontFamily: "Trispace, monospace",
            h1: {
              fontFamily: "Trispace, monospace",
              fontWeight: "700",
            },
            h2: {
              fontFamily: "Trispace, monospace",
              fontWeight: "700",
            },
            h3: {
              fontFamily: "Trispace, monospace",
              fontWeight: "700",
            },
            h4: {
              fontFamily: "Trispace, monospace",
              fontWeight: "700",
            },
            h5: {
              fontFamily: "Trispace, monospace",
              fontWeight: "700",
            },
            h6: {
              fontFamily: "Trispace, monospace",
              fontWeight: "700",
            },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};
