import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import type { Order, OrderItem, Consultation } from "@astrokraft/db";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { isValidLocale } from "@/lib/locales";
import { constructMetadata } from "@/lib/seo";
import { StatusBadge } from "@/components/status-badge";
import { OrdersSignInGate } from "@/components/orders-sign-in-gate";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return constructMetadata({
    title: "My Orders",
    description: "View your AstroKraft order history and consultation bookings.",
    path: "/orders",
    locale: isValidLocale(locale) ? locale : "en",
    noIndex: true
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatPrice(price: number) {
  return `₹${price.toLocaleString("en-IN")}`;
}

interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

interface ConsultationWithJoins extends Consultation {
  astrologers: { photo_url: string | null } | null;
  consultation_categories: { name: string } | null;
}

export default async function OrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const { userId } = await auth();

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-4xl px-6 py-12 sm:py-16">
        <div className="mb-10 text-center">
          <h1 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">My Orders & Consultations</h1>
          <p className="mt-2 text-sm text-ink-body sm:text-base">
            Track your gemstone orders and astrology consultation bookings.
          </p>
        </div>

        {!userId ? <OrdersSignInGate /> : <OrdersContent userId={userId} locale={locale} />}
      </div>
    </main>
  );
}

async function OrdersContent({ userId, locale }: { userId: string; locale: string }) {
  const supabase = getSupabaseAdminClient();

  const [{ data: orders }, { data: consultations }] = await Promise.all([
    supabase.from("orders").select("*, order_items(*)").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase
      .from("consultations")
      .select("*, astrologers(photo_url), consultation_categories(name)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
  ]);

  const orderRows = (orders as OrderWithItems[] | null) ?? [];
  const consultationRows = (consultations as ConsultationWithJoins[] | null) ?? [];

  return (
    <div className="flex flex-col gap-12">
      <section>
        <div className="mb-4 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-gold" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">Orders</h2>
        </div>

        {orderRows.length === 0 ? (
          <EmptyState message="You haven't placed any orders yet." href={`/${locale}`} label="Start Shopping" />
        ) : (
          <div className="flex flex-col gap-4">
            {orderRows.map((order) => (
              <div key={order.id} className="rounded-2xl border border-surface-border bg-surface-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-foreground">Order #{order.order_number}</p>
                    <p className="text-xs text-ink-muted">{formatDate(order.created_at)}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <div className="mt-3 flex flex-col gap-1.5 border-t border-surface-border pt-3">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-ink-body">
                        {item.title} × {item.quantity}
                      </span>
                      <span className="font-medium text-foreground">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-surface-border pt-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Total</span>
                  <span className="text-sm font-bold text-gold">{formatPrice(order.total_amount)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-gold" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">Consultations</h2>
        </div>

        {consultationRows.length === 0 ? (
          <EmptyState
            message="You haven't booked any consultations yet."
            href={`/${locale}/consultation`}
            label="Book a Consultation"
          />
        ) : (
          <div className="flex flex-col gap-4">
            {consultationRows.map((consultation) => (
              <div
                key={consultation.id}
                className="flex items-center gap-4 rounded-2xl border border-surface-border bg-surface-card p-5"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-surface-tint">
                  {consultation.astrologers?.photo_url ? (
                    <Image
                      src={consultation.astrologers.photo_url}
                      alt={consultation.astrologer_name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl">🔮</div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold text-foreground">{consultation.astrologer_name}</p>
                    <StatusBadge status={consultation.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {consultation.consultation_categories?.name ? `${consultation.consultation_categories.name} · ` : ""}
                    {formatDate(consultation.created_at)}
                  </p>
                </div>

                <span className="shrink-0 text-sm font-bold text-gold">{formatPrice(consultation.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyState({ message, href, label }: { message: string; href: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-surface-border bg-surface-card px-6 py-10 text-center">
      <p className="text-sm text-ink-body">{message}</p>
      <Link
        href={href}
        className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
      >
        {label}
      </Link>
    </div>
  );
}
