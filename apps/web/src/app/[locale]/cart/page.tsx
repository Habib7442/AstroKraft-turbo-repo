"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCartStore } from "@astrokraft/core";
import { CheckoutButton } from "@/components/checkout-button";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { Skeleton } from "@/components/ui/skeleton";

function formatPrice(price: number) {
  return `₹${price.toLocaleString("en-IN")}`;
}

export default function CartPage() {
  const { locale } = useParams<{ locale: string }>();
  const mounted = useHasMounted();
  const storeItems = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const totalAmount = useCartStore((state) => state.getTotalAmount());
  // The cart store is skipHydration-ed (it only knows what's in localStorage
  // after mount), so its real content must not affect the very first client
  // render — otherwise that render won't match the server's, and React
  // throws a hydration mismatch. Show a fixed "empty" shape until mounted.
  const items = mounted ? storeItems : [];

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <Link href={`/${locale}`} className="text-xs font-semibold text-primary hover:underline">
          ← Continue shopping
        </Link>

        <h1 className="mt-4 font-serif text-3xl font-bold text-foreground">
          Your Cart{items.length > 0 ? ` (${items.length} ${items.length === 1 ? "item" : "items"})` : ""}
        </h1>

        {!mounted ? (
          <div className="mt-6 flex flex-col gap-3">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        ) : items.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-surface-border bg-surface-card px-6 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl">🛒</div>
            <h2 className="font-serif text-lg font-bold text-foreground">Your cart is empty</h2>
            <p className="max-w-sm text-sm text-ink-body">
              Looks like you haven&rsquo;t added any gemstones yet. Explore our collection to find the right stone for
              you.
            </p>
            <Link
              href={`/${locale}/vedic-gemstones`}
              className="mt-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              Explore Gemstones
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 rounded-lg border border-surface-border bg-surface-card p-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-surface-tint">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.title} fill sizes="64px" className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl">💎</div>
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    {item.subtitle ? <p className="text-xs text-ink-muted">{item.subtitle}</p> : null}
                    <p className="mt-1 text-sm font-bold text-gold">{formatPrice(item.price)}</p>
                  </div>

                  <div className="flex items-center rounded-lg border border-surface-border">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-2.5 py-1.5 text-ink-body hover:text-primary"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-semibold text-foreground">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-2.5 py-1.5 text-ink-body hover:text-primary"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    aria-label="Remove item"
                    className="text-ink-muted transition-colors hover:text-destructive"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="h-fit rounded-lg border border-surface-border bg-surface-card p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-body">Subtotal</span>
                <span className="font-bold text-foreground">{formatPrice(totalAmount)}</span>
              </div>
              <p className="mt-1 text-xs text-ink-muted">Shipping & taxes calculated at payment.</p>

              <div className="mt-4">
                <CheckoutButton />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
