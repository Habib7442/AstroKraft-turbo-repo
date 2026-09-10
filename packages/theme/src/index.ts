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
      // Darkened from #B8860B — that shade only gives ~3.3:1 contrast
      // against white (both as text-gold on a card, and as bg-gold with
      // white text), below WCAG AA's 4.5:1 minimum for normal-size text.
      // #8B6508 gives ~5.3:1 either way (verified via the WCAG relative
      // luminance formula), while staying recognizably the same gold hue.
      DEFAULT: "#8B6508",
      deep: "#8B6508",
      soft: "#C9A24B",
      line: "#ECE7F7"
    },
    saffron: "#E8973A",
    ink: {
      DEFAULT: "#221A3D",
      body: "#4A4566",
      // Darkened from #6E698A — passed against a plain white/background
      // card (~5.2:1) but fell to ~4.36:1 (below WCAG AA's 4.5:1) against
      // the primary/10 tint used behind a *selected* gemstone tier button,
      // the tightest realistic background this color sits on. #635E7D
      // clears that case at ~5.1:1 with margin.
      muted: "#635E7D"
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
