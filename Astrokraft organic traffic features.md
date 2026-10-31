# AstroKraft — Organic Traffic Features (Build Brief)

Site: astrokraft.online (Next.js) · For: Claude Code agent · Prepared 21 Sep 2026

## Goal
Add free astrology tools + daily-refreshing content that people search every
day (horoscope, kundli, gemstone recommendation). These bring habitual organic
traffic, give Google a reason to crawl the site daily, and funnel visitors into
gemstone sales and paid consultations.

## Priority order
1. Daily Horoscope (Tier 1 — highest daily search volume)
2. Free Kundli / Birth Chart generator (Tier 1 — the main front door / lead magnet)
3. Gemstone Recommendation tool (Tier 2 — highest commercial intent, sells our products)

Ship these three first. Panchang, Rahu Kaal, Kundli Matching, blog = later phase
(listed at the end).

---

## Shared technical notes (read first)

**Astrology calculation options — pick one and use it across all three tools:**

- **Free / self-hosted (recommended, no per-call cost):**
  - `swisseph` (Swiss Ephemeris) — the industry-standard ephemeris. Node wrapper:
    `swisseph` or `sweph` on npm. Gives exact planetary positions, houses, ascendant.
    Everything below (chart, dashas, matching, gemstone logic) can be computed from this.
  - `astronomia` / `astronomy-engine` — lighter JS libraries for planetary positions
    if swisseph native build is a hassle on the host.
- **Paid API (faster to ship, ongoing cost):**
  - VedicAstroAPI, Prokerala API, or AstrologyAPI.com — hosted endpoints for
    kundli, matching, horoscope, gemstone. Good if we want to launch fast and
    swap to self-hosted later.

**Licensing (must be settled before choosing an engine):** self-hosting removes
per-call fees, not licence obligations.
- **Swiss Ephemeris (`swisseph` / `sweph`) is dual-licensed: AGPL-3.0 or the paid
  Swiss Ephemeris Professional License.** AGPL's network clause means that serving
  it from our website would oblige us to publish the source of the whole app that
  uses it (`apps/web`) under an AGPL-compatible licence. Otherwise we must buy the
  Professional License from Astrodienst (check astro.com for current terms and price).
- **`astronomy-engine` is MIT-licensed** (free for commercial use, attribution in
  the licence notice only) and is **already a dependency of `apps/web`**, used by
  the current Kundli tool.

**Decision:** default to `astronomy-engine` (MIT) for all three tools, so there's
no per-request cost, no rate limits, no licence obligations and no new native build.
Switch to Swiss Ephemeris only if we need precision it can't give us, **and only
after** we either buy the Professional License or deliberately accept AGPL for
`apps/web`. Fall back to a paid API if neither works.

**SEO rules that apply to ALL three (critical — this is the whole point):**
- Each tool gets its own indexable URL and a real server-rendered `<h1>`.
- Add unique `<title>` + meta description per page (and per sign / per stone
  where applicable).
- Add `FAQPage` and/or `WebApplication` structured data (JSON-LD) where relevant.
- Every generated result page must be crawlable (SSR/SSG), not client-only.
- Add each new URL to `sitemap.xml`.
- Interlink: every tool result links to relevant products and to "Book a Consultation".

**Language:** provide English + Bengali + Hindi where feasible. Bengali is our
local Barak Valley audience and has far less competition — big opportunity.

---

## 1. Daily Horoscope

**What:** Daily horoscope for all 12 zodiac signs, refreshed automatically every day.

**Why:** Highest-volume daily search in Indian astrology ("aries horoscope today",
"aaj ka rashifal"). Footer already promises this ("coming soon") — ship it.

**Build:**
- One landing page listing all 12 signs: `/en/horoscope`
- One page PER sign so each ranks individually:
  `/en/horoscope/aries`, `/en/horoscope/taurus`, … (all 12)
- Show: today's date, the sign, and sections — General, Love, Career, Health,
  Lucky colour/number. Optionally Weekly and Monthly tabs later.
- **Must auto-update daily.** Do NOT hand-write. Options:
  - Generate from a templated content engine keyed to date + sign (planetary
    transits from the chosen engine (sidereal Lahiri, see Chart convention) → mapped to templated readings), OR
  - Pull from a horoscope API on a daily cron and cache.
- Use ISR / scheduled revalidation (Next.js `revalidate`) or a daily cron to
  regenerate so pages are fresh but still statically served (fast + SEO-friendly).
- Show "Last updated: <today's date>" so users and Google see freshness.

**SEO:** page per sign, title like "Aries Horoscope Today (<date>) | AstroKraft".
Add `FAQPage` schema. Internal link each horoscope to the matching gemstone
("Aries → Red Coral") and to consultation.

**Funnel:** end each horoscope with a soft CTA — "Want a personal reading? Talk
to an astrologer" + "Your lucky gemstone → shop now".

---

## 2. Free Kundli / Birth Chart Generator

**What:** User enters name, date of birth, time, and place → gets their Vedic
birth chart (Janam Kundli) free.

**Why:** Massive evergreen search ("free kundli", "janam kundli online",
"birth chart"). This is the main lead magnet — someone who makes their kundli
is a warm lead for a paid consultation and gemstone purchase.

**Build:**
- Route: `/en/free-kundli` (form) → `/en/free-kundli/result` (chart output)
- Form inputs: name, DOB, time of birth, place (with lat/long lookup — use a
  free geocoding source or a bundled India city list).
- **Birth time → UTC (required, before any calculation).** The form captures
  *local* clock time; the ephemeris needs the exact UTC moment, and neither
  Swiss Ephemeris nor astronomy-engine works out a place's time zone.
  1. Resolve the birthplace to an IANA time zone (India-only: always
     `Asia/Kolkata`; if non-Indian places are ever allowed, look it up from
     lat/long, e.g. `geo-tz` / `tz-lookup`).
  2. Convert the local date + time to UTC **using that zone's rules for the
     birth date**, via the IANA tz database (`Intl.DateTimeFormat`, Luxon or
     `date-fns-tz`), never a hard-coded +5:30. India was not always +5:30:
     `Asia/Kolkata` is +6:30 (war time) for parts of 1941–1945 (verified with
     Node's Intl: e.g. 1942-03 and 1943-06 → GMT+06:30), so a fixed +5:30
     shifts those charts by an hour (and outside India, DST matters too).
  3. Test with a 1942–1945 birth (expect +6:30) and a post-1945 one (+5:30);
     if non-Indian places are allowed, also ones inside DST transitions.
  - Note: the current `/api/kundli` route converts with a fixed IST offset
    (`IST_OFFSET_MINUTES`), so it has exactly this gap for 1941–1945 births;
    fix it as part of this work.
- Compute (with the engine chosen above — `astronomy-engine` by default): ascendant
  (lagna), planetary positions, house placements, and render the North-Indian style
  chart (SVG). Include basic dasha (Vimshottari) and a short auto-generated summary.
- **Chart convention (fixed — must match the existing tool in
  `apps/web/src/lib/astro/core.ts`, so every AstroKraft tool gives the same chart):**
  - **Sidereal zodiac, Lahiri (Chitrapaksha) ayanamsa.** Never tropical positions,
    and never another ayanamsa.
  - **Rahu/Ketu: mean node** (Ketu = Rahu + 180°), the convention most printed
    panchangs follow.
  - **Houses: whole-sign** (the lagna's sign is house 1; each following sign is the
    next house), which is what the North-Indian chart displays.
  - **Dasha: Vimshottari** (120-year cycle) from the Moon's sidereal longitude.
  - With `astronomy-engine`: subtract the Lahiri ayanamsa from tropical
    longitudes, as `core.ts` already does (`lahiriAyanamsa()`).
  - With Swiss Ephemeris (only if adopted, see Licensing): call
    `swe_set_sid_mode(SE_SIDM_LAHIRI, 0, 0)` **and** pass `SEFLG_SIDEREAL` on every
    position/house call; use `SE_MEAN_NODE` for Rahu. Without the sidereal mode set,
    it defaults to Fagan/Bradley, and without the flag it returns tropical
    positions. Both silently give a non-Vedic chart.
  - Acceptance check: a few known birth details must produce the same lagna, signs
    and houses as the existing Kundli tool (and match a reference such as a
    published Lahiri panchang).
- Keep the heavy output behind the result view, but ALSO create indexable,
  content-rich landing/explainer pages ("What is a Kundli?", "How to read your
  birth chart") that rank and feed the tool.
- Result page: mostly client-computed is fine, but the tool's LANDING page and
  explainer content must be SSR/SSG for SEO.

**Funnel (important):** the free chart shows the basics. Add a clear CTA:
"Get your full detailed reading — Book a Consultation (₹499+)" and
"Recommended gemstone based on your chart → shop". This is how the free tool
pays for itself.

**SEO:** target "free kundli online", "janam kundli by date of birth",
"free birth chart". Add `WebApplication` + `FAQPage` schema.

---

## 3. Gemstone Recommendation Tool

**What:** User enters birth details (or just sun sign for a lite version) →
tool recommends which gemstone(s) they should wear, with reasons.

**Why:** Highest commercial intent on the whole site — the tool's OUTPUT is
literally our product. Recommend a stone → link straight to that product →
sale. Searched as "which gemstone should I wear", "gemstone by date of birth",
"lucky stone for <sign>".

**Build:**
- Route: `/en/gemstone-recommendation`
- Two modes:
  - **Lite:** pick your rashi/sun sign → instant stone suggestion (no birth time
    needed; low friction, great for casual searchers).
  - **Full:** DOB + time + place → compute lagna/planetary strengths with the chosen engine, using the same Chart convention as the Kundli tool
    → recommend primary + secondary stones with astrological reasoning.
- Map each recommendation to an ACTUAL product on the site. Output card:
  stone name (English + Hindi, e.g. "Blue Sapphire / Neelam"), why it's advised,
  which finger/day/metal to wear, and a big "Shop this gemstone → " button
  linking to the product page.
- Add a disclaimer line: recommendations are guidance; consult an astrologer
  before wearing certain stones (blue sapphire etc.) — this is both responsible
  and a consultation funnel.

**SEO:** also build a page per sign — "Lucky Gemstone for Aries",
"Gemstone for Taurus" … (12 pages) — each ranking and linking to the tool + the
product. Target "lucky gemstone for <sign>", "which gemstone to wear".

**Funnel:** recommendation → product page (sale) OR "not sure? Book a
consultation for a personal recommendation" (consult revenue).

---

## Later phase (after the top 3 are live)

- **Kundli Matching / Guna Milan** (`/en/kundli-matching`) — huge marriage-season
  search; boy + girl details → 36-guna score → "book full matching report".
- **Today's Panchang** (`/en/panchang`) — tithi, nakshatra, yoga, karana, daily.
  Do a **Bengali Panchang** version — low competition, local audience.
- **Rahu Kaal / Choghadiya** (`/en/rahu-kaal`) — today's auspicious/inauspicious
  timings, auto-calculated daily.
- **Muhurat pages** — "griha pravesh muhurat 2026", "marriage dates 2026",
  "vehicle purchase muhurat" — seasonal, ties to Purohit booking.
- **Festival calendar** — dates + significance of each Hindu festival; evergreen.
- **Blog** — answer real searches: "which finger to wear blue sapphire",
  "5 mukhi rudraksha benefits", "amethyst benefits". Each article links to the
  matching product.

---

## Cross-cutting requirements

- Add all new routes to `sitemap.xml` and submit in Google Search Console.
- Every tool result links to (a) a relevant product and (b) Book a Consultation.
- Freshness: horoscope, panchang, rahu kaal MUST auto-refresh daily (cron / ISR).
  A stale "daily" page hurts trust and SEO — automate, never hand-update.
- Keep current site colours, layout, and branding.
- Do NOT mention EMI anywhere (we don't offer it yet).
- Mobile-first: all tools and forms must work cleanly on phones.

## Do-first summary
1. Daily Horoscope (12 sign pages, auto-refresh) — daily habitual traffic.
2. Free Kundli generator — the lead magnet / front door.
3. Gemstone Recommendation tool — converts traffic into gemstone sales.
Build on the chosen engine (`astronomy-engine`, MIT, already in apps/web; see Licensing and Chart convention) so there's no per-call cost or licence obligation. Everything else stacks on top.