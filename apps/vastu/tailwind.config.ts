import type { Config } from "tailwindcss";

// VASTU by Biprangshu is its own brand (black & gold, from the ad poster),
// deliberately not wired to @astrokraft/theme.
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        night: { DEFAULT: "#0A0A0C", 900: "#0A0A0C", 800: "#121215", 700: "#1A1A1F", 600: "#26262D" },
        gold: { DEFAULT: "#D4AF37", soft: "#E9CF7A", deep: "#A8841F", line: "#3A3220" },
        cream: "#F4ECD8",
        muted: "#A9A39A",
        crimson: "#E5383B"
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
