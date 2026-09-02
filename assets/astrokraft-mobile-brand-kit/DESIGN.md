# AstroKraft — Mobile Brand Kit & Design Tokens

**Source of truth:** `astrokraft_logo.png` (1247 × 1261 RGBA). Every colour below was
sampled from the logo's actual pixels — 537,980 opaque samples, k-means clustered, then
verified per element of the mark. Contrast ratios are computed, not estimated.

- Version `1.0.0` · derived 2026-08-31
- Mark: a faceted gem whose negative space forms an **A**
- 97 files · iOS · Android · watchOS · PWA · store listings

---

## 1. What the mark actually is

The logo is built from three separable parts, which is what makes a real icon set possible
rather than just a pile of resizes:

| Part | Share of mark | Role |
|---|---|---|
| Emerald facets | 79.0% | the gem body — carries the silhouette |
| Cream strokes (`#E8FAF3`) | 11.9% | the two legs of the **A** |
| Coral (`#FA542C`) | 9.0% | the apex wedge + the A's crossbar |

I isolated each as a mask before generating anything. That mattered for three decisions
further down: the monochrome layer, the notification icon, and the small-size behaviour.

### Measured palette

| Sampled | Hex | HSL | Share |
|---|---|---|---|
| Emerald 700 | `#039C73` | H 164 · S 97% · L 31% | 23.6% |
| Emerald 800 | `#02664F` | H 166 · S 95% · L 20% | 23.6% |
| Emerald 900 | `#023C31` | H 168 · S 95% · L 12% | 20.1% |
| Emerald 50 | `#E8FAF3` | H 158 · S 63% · L 95% | 12.1% |
| Emerald 400 | `#28D19E` | H 162 · S 68% · L 49% | 11.3% |
| Coral 400 | `#FB7B52` | H 14 · S 96% · L 65% | 4.6% |
| Coral 500 | `#FA542C` | H 12 · S 95% · L 58% | 4.5% |

Two hues, and they are almost exactly **151° apart** — a split-complementary pair, not a
random accent. Emerald sits at H 164 ± 4 across every facet, so the gem is one hue on a
lightness ladder (12% → 20% → 31% → 49% → 95%). The coral is the only other hue in the
brand and it occupies **9% of the mark**. That ratio is the brand: coral is a punctuation
mark, never a surface.

A third ramp, **`night-*`**, is an addition — the emerald hue held at 9–22% saturation. The
logo contains no neutrals, and an app needs surfaces and body text. Deriving them from
H 165 instead of importing a generic grey keeps the UI coherent with the mark.

---

## 2. The icon background — a measured decision, not a taste call

An iOS app icon **cannot have transparency**, so the mark has to sit on something. I
measured the 5th-percentile contrast between the mark's boundary pixels and each candidate
background, which is what determines whether the gem's silhouette survives against a
crowded home screen:

| Background | min | **p05** | median | Verdict |
|---|---|---|---|---|
| `#041C17` emerald-950 | 1.00 | **3.03** | 5.09 | **default — brand-derived** |
| `#0B1020` night-indigo | 1.03 | **3.24** | 5.43 | alternate — best score |
| `#0A0F14` slate-950 | 1.05 | 3.29 | 5.52 | alternate |
| `#14101F` deep-plum | 1.02 | 3.20 | 5.36 | alternate |
| `#023C31` emerald-900 | 1.00 | 2.12 | 3.56 | usable, flatter |
| `#FFFFFF` white | 1.00 | **1.92** | 3.49 | **weak — not recommended** |
| `#F0FBF6` mint | 1.00 | **1.82** | 3.29 | **weak — not recommended** |

**White loses.** The gem's upper-left highlight facets and the near-white A strokes are
already at L 95%, so on a white plate the top third of the mark dissolves and the icon
reads as a bottom-heavy green blob. Every dark option is roughly **1.7× better** at the
5th percentile.

I shipped **`#041C17` (emerald-950)** as the default: it is pulled straight from the
logo's own darkest facet family, and it passes. `night-indigo` scores marginally higher
and suits an astrology app's night-sky register — it's in `/alt-background` if you prefer
it, and it is a defensible swap. Light variants are included for completeness but are
labelled weak for a reason.

---

## 3. Three judgement calls I made in the assets

### 3.1 The monochrome silhouette keeps the apex solid

Android's themed icons (13+), notification icons, and iOS template icons all need a
**single-colour** version. A plain alpha silhouette of this logo is a featureless
diamond — the A vanishes, because the A is made of *lighter* colour, not of shape.

So the mono layer knocks the A out of the gem. But *which* parts:

| Knockout | Result |
|---|---|
| legs + apex + crossbar | The apex wedge detaches — the icon reads as two floating masses |
| legs only | Reads as **Λ**, not **A** — no crossbar |
| **legs + crossbar, apex solid** | **Shipped.** Gem stays one connected mass, A reads properly |

### 3.2 Small sizes get a widened knockout

The A's legs are 7.7% of the mark's width. At 24 dp that's ~1.7 px, and naïve downscaling
closes the gaps into mush. Every mono asset is generated with **size-compensated
dilation** — the knockout is widened before downscaling, more at smaller sizes:

| Target | ≤28 px | ≤40 px | ≤56 px | ≤80 px | ≤128 px | larger |
|---|---|---|---|---|---|---|
| Dilation | 26 px | 18 px | 12 px | 6 px | 3 px | 0 |

Result: the A is legible in the status bar at 24 dp. My first pass used a plain silhouette
below 48 px on the assumption the strokes couldn't survive; I tested it, the assumption was
wrong, and the knockout ships at every size.

### 3.3 Edges use the original soft alpha

The masks are binary, but the exported alpha is not: every mono asset multiplies the
logo's **original anti-aliased alpha** by a Gaussian-softened knockout. A hard binary
threshold produced visible stair-stepping on the gem's diagonal edges at icon sizes.

---

## 4. Colour ramps

### `emerald-*` — the brand hue (H 165)

| Token | Hex | on white | on `#041C17` |
|---|---|---|---|
| `emerald-50` | `#E8FAF3` | 1.08 | **16.39** |
| `emerald-100` | `#D6F5ED` | 1.16 | 15.33 |
| `emerald-200` | `#94E6D1` | 1.45 | **12.25** |
| `emerald-300` | `#61DBBD` | 1.70 | 10.46 |
| `emerald-400` | `#28D19E` | 1.96 | **9.04** |
| `emerald-500` | `#12B58C` | 2.62 | 6.77 |
| `emerald-600` | `#049A75` | 3.57 | 4.97 |
| `emerald-700` | `#039C73` | 3.50 | 5.07 |
| `emerald-800` | `#02664F` | **6.96** | 2.55 |
| `emerald-900` | `#023C31` | **12.40** | 1.43 |
| `emerald-950` | `#041C17` | **17.74** | 1.00 |

### `coral-*` — the accent (H 13) · 9% of the mark, keep it that way

| Token | Hex | on white | on `#041C17` |
|---|---|---|---|
| `coral-200` | `#FDC0AF` | 1.57 | 11.27 |
| `coral-300` | `#FC997D` | 2.10 | 8.44 |
| `coral-400` | `#FB7B52` | 2.61 | **6.81** |
| `coral-500` | `#FA542C` | 3.30 | **5.38** |
| `coral-600` | `#E63D0F` | 4.17 | 4.26 |
| `coral-700` | `#B23310` | **6.22** | 2.85 |
| `coral-800` | `#85280F` | **9.10** | 1.95 |

### `night-*` — neutral, emerald hue at low saturation

| Token | Hex | on white | on `#041C17` |
|---|---|---|---|
| `night-50` | `#F7FAF9` | 1.05 | 16.89 |
| `night-200` | `#DCE4E2` | 1.29 | **13.72** |
| `night-300` | `#C1CDCA` | 1.63 | 10.86 |
| `night-400` | `#94A8A3` | 2.50 | **7.09** |
| `night-500` | `#687D78` | 4.38 | 4.05 |
| `night-600` | `#4E5F5B` | **6.75** | 2.63 |
| `night-700` | `#384744` | 9.75 | 1.82 |
| `night-800` | `#25312E` | 13.48 | 1.32 |
| `night-900` | `#17211F` | 16.49 | 1.08 |
| `night-950` | `#0D1412` | 18.65 | 1.05 |

---

## 5. The trap in this palette

**White text does not work on the brand greens.** This is the single most important
practical finding, and it is counter-intuitive because the greens *look* dark:

| Pair | Ratio | Verdict |
|---|---|---|
| White on `emerald-700` `#039C73` | **3.50** | ❌ AA-large only — **not for body text** |
| White on `emerald-600` | 3.57 | ❌ AA-large only |
| White on `coral-600` | 4.17 | ❌ just misses AA |
| White on `coral-500` | 3.30 | ❌ AA-large only |

The logo's own emerald sits at L 31% — bright enough that white on top is a near-miss at
every size that matters. You have exactly two correct patterns for a filled brand button:

| Pattern | Ratio | Use |
|---|---|---|
| **`emerald-950` text on `emerald-400` fill** | **9.04** | ✅ primary CTA — bright, on-brand |
| **White text on `emerald-800` fill** | **6.96** | ✅ primary CTA — subdued |
| `emerald-950` text on `coral-500` fill | 5.38 | ✅ destructive / highlight CTA |

Dark-on-bright is the on-brand answer and it is also the accessible one. If a designer
hands you white-on-emerald-700, that is the failure mode to catch in review.

### Verified dark-mode text (app background `#041C17`)

| Foreground | Ratio | Use |
|---|---|---|
| `#FFFFFF` | **17.74** | AAA — body, headings |
| `night-200` | **13.72** | AAA — secondary text |
| `night-400` | **7.09** | AAA — tertiary, disabled, placeholders |
| `emerald-400` | **9.04** | AAA — brand accent text, links |
| `emerald-200` | **12.25** | AAA — high-emphasis accent |
| `coral-400` | **6.81** | AA — accent text |
| `coral-500` | **5.38** | AA — as shipped in the logo |

---

## 6. Semantic tokens

Ship these; don't reference the ramps directly from screens.

| Token | Value | Notes |
|---|---|---|
| `app-background` | `emerald-950` `#041C17` | also the icon plate and splash colour |
| `surface` | `night-900` `#17211F` | cards, sheets |
| `surface-raised` | `night-800` `#25312E` | modals, elevated rows |
| `text-primary` | `#FFFFFF` | 17.74 |
| `text-secondary` | `night-200` `#DCE4E2` | 13.72 |
| `text-tertiary` | `night-400` `#94A8A3` | 7.09 |
| `accent` | `emerald-400` `#28D19E` | interactive, links, primary fill |
| `accent-pressed` | `emerald-500` `#12B58C` | |
| `highlight` | `coral-500` `#FA542C` | ≤9% of any screen |
| `on-accent` | `emerald-950` | dark-on-bright — see §5 |

Provided as ready-to-drop files in `/tokens`: `tokens.json` (W3C DTCG), `colors.xml`
(Android), `AKColors.swift`, `AKColors.kt` (Compose), `ak_colors.dart` (Flutter),
`tokens.ts` (React Native).

---

## 7. Rules

**Do**

- Keep the icon plate dark. `#041C17` default; `/alt-background` if you want indigo.
- Use dark text on bright brand fills. Never white on `emerald-600/700`.
- Hold coral to roughly 9% of a screen, matching its share of the mark.
- Use `night-*` for all neutrals — it is the emerald hue desaturated, so it stays coherent.
- Use the `legs+crossbar` mono asset for notification, themed and template icons.
- Match `windowSplashScreenBackground` and `theme_color` to `#041C17` so launch is seamless.

**Don't**

- Put the mark on white for an app icon — measured 1.92 at p05, the top third dissolves.
- Set white body text on the logo's emerald.
- Use coral as a surface or a large fill. It is punctuation.
- Add a third hue. The mark is a deliberate two-hue split-complementary pair.
- Re-export the mono icons from the colour art — the A is colour, not shape, and you'll get a blank diamond.
- Scale the adaptive foreground past 58% of the 108 dp canvas or masks will clip it.

---

## 8. Provenance & limits

- Palette from 537,980 opaque pixels, k-means (k=8), verified per mask.
- Ramp stops between measured anchors are interpolated at fixed hue (165 emerald, 13 coral)
  with a tuned lightness curve. The measured values are pinned exactly at `emerald-50/400/
  700/800/900/950` and `coral-400/500`.
- Source is a **1247 px raster**. Every asset here is at or below native resolution except
  the 2732 px splash, which is upscaled — acceptable for a flat-shaded mark on a solid
  field, but **commission a vector redraw before print, signage, or large-format use.**
  A true SVG would also let you generate any future size losslessly.
- `night-*`, the status/semantic layer, spacing and radius are additions — the logo does
  not specify them. They are tuned to the extracted palette and are open to revision in a
  way the two colour ramps are not.
- I did not find or infer a wordmark. This kit is icon-only; if you have a logotype, a
  horizontal lockup should be added before store listings and the launch screen.
