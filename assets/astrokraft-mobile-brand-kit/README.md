ASTROKRAFT — MOBILE BRAND KIT v1.0.0
====================================
Generated from astrokraft_logo.png. See DESIGN.md for the palette, the contrast
data behind each decision, and the usage rules.

DEFAULT ICON BACKGROUND: #041C17 (emerald-950)
Measured: dark plates hold this mark's silhouette ~1.7x better than white.
Do not ship the white variant as your app icon. Details in DESIGN.md §2.


INSTALL — iOS (Xcode)
---------------------
1. Drag  ios/AppIcon.appiconset  into your asset catalogue, replacing the
   existing AppIcon. Contents.json is included and already wired, including
   the iOS 18 dark and tinted entries.
2. Launch screen: set the background colour to #041C17 and centre
   logo/astrokraft-mark-1024h.png, or use a prebuilt image from ios/launch/.
3. Tab bar / toolbar: ios/tabbar/ak-tab{,@2x,@3x}.png are template images.
   Set Render As = Template Image so the system tints them.
4. watchOS: ios/watch/ — opaque, the system applies the circular mask.

Note: App Store icons must have NO alpha channel. Icon-1024.png is flattened
RGB already. Do not re-export it with transparency.


INSTALL — Android
-----------------
1. Adaptive icon (API 26+):
     android/adaptive/ic_launcher_foreground.png   -> res/mipmap-xxxhdpi/
     android/adaptive/ic_launcher_monochrome.png   -> res/mipmap-xxxhdpi/
     android/res/ic_launcher.xml                   -> res/mipmap-anydpi-v26/
     android/res/colors.xml                        -> merge into res/values/
   The background is a flat colour (@color/ic_launcher_background), so no
   background PNG is needed — ic_launcher_background.png is included only if
   you prefer a drawable.
2. Legacy launcher icons: copy android/mipmap-*/ into res/ as-is.
3. Notification icons: copy android/notification/drawable-*/ into res/.
   Android renders these as a white mask — that is why they are white with
   the A knocked out. Set them via setSmallIcon(R.drawable.ic_stat_astrokraft).
4. Android 12+ splash: android/res/themes_splash.xml plus
   android/splash/splash_icon_1152.png -> res/mipmap-xxxhdpi/splash_icon.png
5. Play Store listing: android/play/play-store-icon-512.png (32-bit, no alpha)
   and store/play-feature-graphic-1024x500.png.


INSTALL — Flutter
-----------------
flutter_launcher_icons in pubspec.yaml:

  flutter_launcher_icons:
    image_path: "logo/astrokraft-mark-1024h.png"
    android: true
    adaptive_icon_background: "#041C17"
    adaptive_icon_foreground: "android/adaptive/ic_launcher_foreground.png"
    adaptive_icon_monochrome: "android/adaptive/ic_launcher_monochrome.png"
    ios: true
    remove_alpha_ios: true
    web:
      generate: true
      background_color: "#041C17"
      theme_color: "#041C17"

Colours: tokens/ak_colors.dart


INSTALL — React Native / Expo
-----------------------------
app.json:

  "icon": "./assets/ios/AppIcon.appiconset/Icon-1024.png",
  "backgroundColor": "#041C17",
  "splash": { "image": "./assets/logo/astrokraft-mark-1024h.png",
              "resizeMode": "contain", "backgroundColor": "#041C17" },
  "android": {
    "adaptiveIcon": {
      "foregroundImage": "./assets/android/adaptive/ic_launcher_foreground.png",
      "monochromeImage": "./assets/android/adaptive/ic_launcher_monochrome.png",
      "backgroundColor": "#041C17" } }

Colours: tokens/tokens.ts


INSTALL — PWA / web
-------------------
Copy web/* to your web root, then in <head>:

  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  <link rel="shortcut icon" href="/favicon.ico">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-180.png">
  <link rel="manifest" href="/manifest.webmanifest">
  <meta name="theme-color" content="#041C17">
  <meta property="og:image" content="https://.../og-image-1200x630.png">


FOLDER MAP
----------
logo/            master mark + single-colour and knockout versions
ios/             AppIcon.appiconset (+ Contents.json), launch, tabbar, watch
android/         adaptive, mipmap-*, notification, splash, play, res (XML)
web/             favicons, PWA icons, maskable, manifest
store/           App Store 1024, Play feature graphic, OG image, avatars
alt-background/  indigo / mint / emerald-700 icon plates
tokens/          tokens.json, colors.xml, Swift, Kotlin, Dart, TypeScript
DESIGN.md        palette, contrast data, decisions, rules


TWO THINGS TO WATCH
-------------------
1. Never set white body text on emerald-600/700 — measured 3.50:1, fails AA.
   Use dark text on a bright emerald-400 fill (9.04:1) instead. DESIGN.md §5.
2. Never regenerate the mono/notification icons from the colour artwork by
   flattening to a silhouette. The A is made of colour, not shape, so you
   will get a featureless diamond. Use logo/astrokraft-mark-knockout-*.png.


LIMIT
-----
Source was a 1247 px raster, so this kit is raster. Sufficient for every
mobile and web surface here. Commission a vector (SVG) redraw before print,
signage, or any large-format use — it would also let you regenerate any
future size losslessly.
