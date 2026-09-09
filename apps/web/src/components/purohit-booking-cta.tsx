import Link from "next/link";

interface PurohitBookingCtaProps {
  locale: string;
}

export function PurohitBookingCta({ locale }: PurohitBookingCtaProps) {
  return (
    <section className="w-full" style={{ background: "linear-gradient(120deg, #E8973A 0%, #D9720F 55%, #B8860B 100%)" }}>
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-5 px-6 py-14 text-center sm:py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-4xl shadow-lg ring-4 ring-white/30">
          🪔
        </div>
        <h2 className="font-serif text-3xl font-extrabold text-white drop-shadow-sm sm:text-4xl">Book a Purohit for Your Puja</h2>
        <p className="max-w-xl text-sm font-medium text-white/95 sm:text-base">
          Griha Pravesh, Satyanarayan Puja, weddings, and more — tell us what you need and our team will call you
          back to confirm the priest, materials, and price. No payment required now.
        </p>
        <Link
          href={`/${locale}/purohit-booking`}
          className="mt-1 whitespace-nowrap rounded-full bg-white px-8 py-3.5 text-sm font-extrabold uppercase tracking-wide text-[#B8541A] shadow-lg transition-transform hover:-translate-y-0.5 hover:shadow-xl sm:text-base"
        >
          Request a Booking →
        </Link>
      </div>
    </section>
  );
}
