import { useEffect, useState } from "react";

/**
 * Gates rendering of anything that reads client-only state (localStorage,
 * the skipHydration-ed cart store, etc.) until after the first client
 * render. Returns false on the server AND on the client's first paint
 * (matching exactly), then flips true in a useEffect — a normal
 * post-hydration update rather than a hydration mismatch.
 */
export function useHasMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
