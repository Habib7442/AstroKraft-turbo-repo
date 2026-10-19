// Client-side: capture the ad click's UTM / fbclid on first landing and the
// Meta cookies, so the lead row records which campaign/ad it came from.
const KEY = "vastu_attribution";
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"] as const;

export type Attribution = Partial<Record<(typeof UTM_KEYS)[number] | "fbp" | "fbc", string>>;

// Mirrors vastuLeadSchema's attribution limits. UTM values are free-text
// campaign names, so cutting one still leaves a readable value. Meta ids
// (fbclid, _fbp, _fbc) are opaque: a cut id no longer matches the ad click,
// and an over-limit one would fail validation for the whole form — so those
// are dropped instead of cut.
const OPAQUE_LIMITS: Partial<Record<keyof Attribution, number>> = { fbclid: 500, fbp: 200, fbc: 600 };

function clip(key: keyof Attribution, value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const opaqueLimit = OPAQUE_LIMITS[key];
  if (opaqueLimit) return value.length <= opaqueLimit ? value : undefined;
  return value.slice(0, 200);
}

function readCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function captureAttribution(): void {
  const params = new URLSearchParams(window.location.search);
  const fromUrl: Attribution = {};
  for (const key of UTM_KEYS) {
    const value = clip(key, params.get(key));
    if (value) fromUrl[key] = value;
  }
  if (!Object.keys(fromUrl).length) return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(fromUrl));
  } catch {
    // storage blocked — getAttribution() falls back to the current URL
  }
}

export function getAttribution(): Attribution {
  let stored: Attribution = {};
  try {
    stored = JSON.parse(sessionStorage.getItem(KEY) || "{}");
  } catch {
    stored = {};
  }
  const params = new URLSearchParams(window.location.search);
  for (const key of UTM_KEYS) {
    const value = clip(key, params.get(key));
    if (value && !stored[key]) stored[key] = value;
  }

  const fbp = clip("fbp", readCookie("_fbp"));
  // _fbc is only set by the pixel if it saw the fbclid; build it ourselves
  // otherwise, in Meta's documented fb.1.<ms>.<fbclid> format.
  const fbc = clip("fbc", readCookie("_fbc") ?? (stored.fbclid ? `fb.1.${Date.now()}.${stored.fbclid}` : undefined));
  return { ...stored, ...(fbp ? { fbp } : {}), ...(fbc ? { fbc } : {}) };
}
