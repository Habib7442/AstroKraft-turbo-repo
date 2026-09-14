import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import { astroKraftTheme } from "@astrokraft/theme";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: astroKraftTheme.colors.background,
        foreground: astroKraftTheme.colors.foreground,
        surface: astroKraftTheme.colors.surface,
        primary: astroKraftTheme.colors.primary,
        gold: astroKraftTheme.colors.gold,
        saffron: astroKraftTheme.colors.saffron,
        ink: astroKraftTheme.colors.ink,
        destructive: astroKraftTheme.colors.destructive
      },
      fontFamily: astroKraftTheme.typography.fontFamily,
      borderRadius: astroKraftTheme.borderRadius,
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" }
        }
      },
      animation: {
        // The track's content is duplicated once in TestimonialsShowcase, so
        // -50% is exactly one full copy — the loop point is seamless instead
        // of snapping back to the start.
        marquee: "marquee 40s linear infinite"
      }
    }
  },
  plugins: [tailwindcssAnimate]
};

export default config;
