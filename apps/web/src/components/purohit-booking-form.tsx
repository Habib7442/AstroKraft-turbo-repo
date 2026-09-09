"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";

const RITUAL_TYPES = [
  "Griha Pravesh",
  "Satyanarayan Puja",
  "Wedding / Vivah",
  "Naming Ceremony (Namkaran)",
  "Mundan",
  "Engagement",
  "Havan",
  "Rudrabhishek",
  "Other"
];

const LANGUAGES = ["Hindi", "Sanskrit", "Bengali", "Assamese", "English", "Other"];

const MATERIALS_OPTIONS: { value: "purohit_only" | "purohit_and_samagri"; label: string }[] = [
  { value: "purohit_only", label: "Purohit only" },
  { value: "purohit_and_samagri", label: "Purohit + Samagri" }
];

const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

function todayISODate() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
}

export function PurohitBookingForm() {
  const { isSignedIn } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [ritualType, setRitualType] = useState("");
  const [ritualTypeOther, setRitualTypeOther] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [languagePreference, setLanguagePreference] = useState("");
  const [languageOther, setLanguageOther] = useState("");
  const [materialsOption, setMaterialsOption] = useState<"purohit_only" | "purohit_and_samagri" | "">("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const minDate = useMemo(() => todayISODate(), []);

  const resolvedRitualType = ritualType === "Other" ? ritualTypeOther.trim() : ritualType;
  const resolvedLanguage = languagePreference === "Other" ? languageOther.trim() : languagePreference;

  const canSubmit = Boolean(
    name.trim() &&
      phone.trim().length >= 10 &&
      location.trim() &&
      resolvedRitualType &&
      preferredDate &&
      resolvedLanguage &&
      materialsOption
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    if (selected && !ALLOWED_FILE_TYPES.includes(selected.type)) {
      setError("Please attach a JPEG, PNG, WEBP, or PDF file.");
      return;
    }
    setError(null);
    setFile(selected);
  };

  // If the upload fails, the booking still submits successfully without the
  // attachment (AC-5) — a failed upload never blocks the create call.
  const uploadAttachment = async (): Promise<string | undefined> => {
    if (!file) return undefined;
    try {
      const res = await fetch("/api/purohit-bookings/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, contentType: file.type })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const putRes = await fetch(data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file
      });
      if (!putRes.ok) throw new Error("Upload failed");

      return data.publicUrl as string;
    } catch (err) {
      console.error("purohit booking attachment upload failed:", err);
      return undefined;
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setLoading(true);
    setError(null);

    try {
      const attachmentUrl = await uploadAttachment();

      const res = await fetch("/api/purohit-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          location: location.trim(),
          ritualType: resolvedRitualType,
          preferredDate,
          preferredTime: preferredTime || undefined,
          languagePreference: resolvedLanguage,
          materialsOption,
          message: message.trim() || undefined,
          attachmentUrl,
          website
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not submit your request.");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Could not submit your request.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-3xl">✅</div>
        <h2 className="font-serif text-xl font-bold text-green-800">Request Received!</h2>
        <p className="mt-2 text-sm text-green-700">
          Thank you, {name}. Our team will call you shortly to confirm the priest, materials, and price.
        </p>
      </div>
    );
  }

  const fieldLabelClass = "mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-body";
  const fieldInputClass =
    "w-full rounded-lg border border-surface-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="rounded-2xl border border-surface-border bg-surface-card p-6 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={fieldLabelClass}>Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" className={fieldInputClass} />
          </div>
          <div>
            <label className={fieldLabelClass}>Mobile / WhatsApp Number</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile number" className={fieldInputClass} />
          </div>
        </div>

        <div>
          <label className={fieldLabelClass}>Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Where should the puja take place?"
            className={fieldInputClass}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={fieldLabelClass}>Ritual Type</label>
            <select value={ritualType} onChange={(e) => setRitualType(e.target.value)} className={fieldInputClass}>
              <option value="">Select a ritual</option>
              {RITUAL_TYPES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {ritualType === "Other" ? (
              <input
                type="text"
                value={ritualTypeOther}
                onChange={(e) => setRitualTypeOther(e.target.value)}
                placeholder="Tell us the ritual you need"
                className={`${fieldInputClass} mt-2`}
              />
            ) : null}
          </div>
          <div>
            <label className={fieldLabelClass}>Language Preference</label>
            <select value={languagePreference} onChange={(e) => setLanguagePreference(e.target.value)} className={fieldInputClass}>
              <option value="">Select a language</option>
              {LANGUAGES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {languagePreference === "Other" ? (
              <input
                type="text"
                value={languageOther}
                onChange={(e) => setLanguageOther(e.target.value)}
                placeholder="Tell us your preferred language"
                className={`${fieldInputClass} mt-2`}
              />
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={fieldLabelClass}>Preferred Date</label>
            <input type="date" value={preferredDate} min={minDate} onChange={(e) => setPreferredDate(e.target.value)} className={fieldInputClass} />
          </div>
          <div>
            <label className={fieldLabelClass}>Preferred Time (optional)</label>
            <input type="time" value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} className={fieldInputClass} />
          </div>
        </div>

        <div>
          <label className={fieldLabelClass}>Materials</label>
          <div className="flex gap-3">
            {MATERIALS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setMaterialsOption(option.value)}
                className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors ${
                  materialsOption === option.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-surface-border bg-background text-ink-body"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={fieldLabelClass}>Message (optional)</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Anything else the team should know?"
            rows={3}
            className={fieldInputClass}
          />
        </div>

        <div>
          <label className={fieldLabelClass}>Attachment (optional)</label>
          <input
            type="file"
            accept={ALLOWED_FILE_TYPES.join(",")}
            onChange={handleFileChange}
            className="w-full text-sm text-ink-body file:mr-3 file:rounded-lg file:border-0 file:bg-surface-tint file:px-4 file:py-2 file:text-xs file:font-semibold file:text-foreground"
          />
          <p className="mt-1 text-xs text-ink-muted">Puja list, invitation, horoscope, or muhurat details.</p>
        </div>

        {/* Hidden honeypot field — a real visitor never sees or fills this. */}
        <input
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          className="absolute h-0 w-0 opacity-0"
          aria-hidden="true"
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || loading}
          className="mt-2 w-full rounded-full bg-gold py-3.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Submitting…" : "Request Booking"}
        </button>
        {!isSignedIn ? (
          <p className="text-center text-xs text-ink-muted">You don&rsquo;t need an account — we&rsquo;ll call you to confirm details.</p>
        ) : null}
        {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}
