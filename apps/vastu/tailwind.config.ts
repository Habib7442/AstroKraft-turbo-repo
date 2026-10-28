import type { Config } from "tailwindcss";

// VASTU by Biprangshu is its own brand (blue & white with gold CTAs),
// deliberately not wired to @astrokraft/theme. The token names date from the
// original black & gold theme: `night-*` are the page/surface shades, `cream`
// is the main text colour, `navy` is used for the dark hero/CTA bands.
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        night: { DEFAULT: "#FFFFFF", 900: "#F4F6FA", 800: "#F4F6FA", 700: "#EEF2F8", 600: "#D6DEEA" },
        navy: { DEFAULT: "#0B2545", 800: "#13315C" },
        gold: { DEFAULT: "#9A7419", soft: "#8C6A17", deep: "#7A5C12", line: "#E3E8F0", bright: "#E2B857" },
        cream: "#0B2545",
        muted: "#3F4B63",
        crimson: "#D62828"
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"]
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #F3DD8E 0%, #D4AF37 45%, #A8841F 100%)"
      }
    }
  },
  plugins: []
};

export default config;
