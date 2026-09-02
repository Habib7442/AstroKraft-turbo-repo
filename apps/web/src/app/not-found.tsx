import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#F7F5FC] px-8 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#B8860B]">404</p>
      <h1 className="text-3xl sm:text-4xl font-bold text-[#221A3D]">Page Not Found</h1>
      <p className="text-[#4A4566] max-w-md">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Link
        href="/en"
        className="mt-2 px-6 py-3 bg-[#5B21B6] text-white font-medium text-sm rounded-lg hover:bg-[#6D28D9] transition-colors shadow-sm"
      >
        Back to Home
      </Link>
    </main>
  );
}
