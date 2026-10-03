"use client";

import { useState } from "react";
import { useClerk } from "@clerk/nextjs";

export function MyDataControls({ locale }: { locale: string }) {
  const { signOut } = useClerk();
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (confirmText !== "DELETE") return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not delete your account.");
      await signOut({ redirectUrl: `/${locale}` });
    } catch (err: any) {
      setError(err.message || "Could not delete your account.");
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-surface-border bg-surface-card p-6">
        <h2 className="font-serif text-lg font-bold text-foreground">Download your data</h2>
        <p className="mt-1 text-sm text-ink-body">
          A copy of your account details, orders, consultations, reviews and Purohit bookings, plus the list of
          services we share data with.
        </p>
        <a
          href="/api/account"
          download
          className="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
        >
          Download my data (JSON)
        </a>
      </section>

      <section className="rounded-2xl border border-red-200 bg-red-50/50 p-6">
        <h2 className="font-serif text-lg font-bold text-foreground">Delete your account</h2>
        <p className="mt-1 text-sm text-ink-body">
          This withdraws your consent and permanently erases your account, consultations, reviews, Purohit bookings
          and unpaid orders. Paid order records are kept only as long as tax law requires, then deleted. This
          cannot be undone.
        </p>
        <label htmlFor="confirm-delete" className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink-body">
          Type DELETE to confirm
        </label>
        <input
          id="confirm-delete"
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          autoComplete="off"
          className="mt-1 w-full max-w-xs rounded-lg border border-surface-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-red-300"
        />
        <div>
          <button
            type="button"
            onClick={handleDelete}
            disabled={confirmText !== "DELETE" || deleting}
            className="mt-4 rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete my account"}
          </button>
        </div>
        {error ? <p className="mt-2 text-xs font-medium text-destructive">{error}</p> : null}
      </section>
    </div>
  );
}
