"use client";

import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";
import { useHasMounted } from "@/hooks/use-has-mounted";

interface AuthHeaderControlsProps {
  locale: string;
}

/**
 * The homepage is statically prerendered (generateStaticParams + ISR), so
 * there is no per-visitor auth cookie available at build time — Clerk's
 * <Show>/<UserButton> can only resolve the real signed-in/out state on the
 * client. Rendering them directly causes a hydration mismatch (server HTML
 * always guesses one state, the client then corrects it).
 *
 * Gating on a `mounted` flag makes the server AND the client's first paint
 * render the exact same placeholder, then swaps to the real auth UI in a
 * normal post-hydration update instead of a mismatch.
 */
export function AuthHeaderControls({ locale }: AuthHeaderControlsProps) {
  const mounted = useHasMounted();

  if (!mounted) {
    return <Skeleton className="h-8 w-20 sm:h-9 sm:w-24 rounded-lg bg-white/10 shrink-0" />;
  }

  return (
    <>
      <Show when="signed-out">
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <SignInButton mode="modal">
            <button className="whitespace-nowrap px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white/90 hover:text-[#E2C27A] transition-colors">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="whitespace-nowrap px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium bg-[#5B21B6] text-white rounded-lg hover:bg-[#6D28D9] transition-colors shadow-sm">
              Sign Up
            </button>
          </SignUpButton>
        </div>
      </Show>
      <Show when="signed-in">
        <UserButton>
          <UserButton.MenuItems>
            <UserButton.Link label="My Orders" labelIcon={<span aria-hidden>📦</span>} href={`/${locale}/orders`} />
          </UserButton.MenuItems>
        </UserButton>
      </Show>
    </>
  );
}
