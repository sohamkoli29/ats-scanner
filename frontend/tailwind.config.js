/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Syne'", "sans-serif"],
        body: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        ink: "#0D0D0D",
        paper: "#F5F2ED",
        cream: "#EDE8DF",
        accent: "#C8F135",
        teal: "#1A6B5C",
        rust: "#C44B2B",
        muted: "#8A8478",
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease forwards",
        "score-fill": "scoreFill 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        shimmer: "shimmer 1.5s infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: 0, transform: "translateY(16px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        scoreFill: {
          "0%": { "stroke-dashoffset": "440" },
          "100%": { "stroke-dashoffset": "var(--offset)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
}
