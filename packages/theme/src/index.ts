export const astroKraftTheme = {
  colors: {
    background: "#F7F5FC",
    foreground: "#221A3D",
    surface: {
      base: "#F7F5FC",
      alt: "#FFFFFF",
      muted: "#F1ECFA",
      tint: "#F1ECFA",
      card: "#FFFFFF",
      border: "#ECE7F7"
    },
    primary: {
      DEFAULT: "#5B21B6",
      bright: "#6D28D9",
      band: "#3A1A78",
      container: "#5B21B6",
      foreground: "#FFFFFF"
    },
    gold: {
      DEFAULT: "#B8860B",
      deep: "#B8860B",
      soft: "#C9A24B",
      line: "#ECE7F7"
    },
    saffron: "#E8973A",
    ink: {
      DEFAULT: "#221A3D",
      body: "#4A4566",
      muted: "#6E698A"
    },
    destructive: {
      DEFAULT: "#C0392B",
      foreground: "#FFFFFF"
    }
  },
  typography: {
    fontFamily: {
      sans: ["Rubik-Regular", "Geist", "Inter", "sans-serif"] as string[],
      rubik: ["Rubik-Regular", "sans-serif"] as string[],
      "rubik-light": ["Rubik-Light", "sans-serif"] as string[],
      "rubik-medium": ["Rubik-Medium", "sans-serif"] as string[],
      "rubik-semibold": ["Rubik-SemiBold", "sans-serif"] as string[],
      "rubik-bold": ["Rubik-Bold", "sans-serif"] as string[],
      "rubik-extrabold": ["Rubik-ExtraBold", "sans-serif"] as string[],
      serif: ["Fraunces", "Bodoni Moda", "serif"] as string[],
      mono: ["SpaceMono-Regular", "Geist Mono", "monospace"] as string[],
      spacemono: ["SpaceMono-Regular", "monospace"] as string[]
    }
  },
  borderRadius: {
    sm: "0.25rem",
    DEFAULT: "0.75rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.5rem"
  }
};

export type AstroKraftTheme = typeof astroKraftTheme;
