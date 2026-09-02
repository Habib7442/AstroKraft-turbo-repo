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
      borderRadius: astroKraftTheme.borderRadius
    }
  },
  plugins: [tailwindcssAnimate]
};

export default config;
