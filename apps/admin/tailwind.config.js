const { astroKraftTheme } = require("@astrokraft/theme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
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
  plugins: []
};
