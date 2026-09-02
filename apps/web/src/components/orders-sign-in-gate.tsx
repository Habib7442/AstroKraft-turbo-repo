"use client";

import { SignInButton } from "@clerk/nextjs";

export function OrdersSignInGate() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl border border-dashed border-surface-border bg-surface-card px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl">🔒</div>
      <h2 className="font-serif text-lg font-bold text-foreground">Sign in to see your orders</h2>
      <p className="text-sm text-ink-body">Sign in to view your order history and consultation bookings.</p>
      <SignInButton mode="modal">
        <button
          type="button"
          className="mt-2 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
        >
          Sign In
        </button>
      </SignInButton>
    </div>
  );
}
