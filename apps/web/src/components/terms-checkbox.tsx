import Link from "next/link";

interface ConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  locale: string;
}

function PolicyLink({ locale, path, label }: { locale: string; path: string; label: string }) {
  return (
    <Link href={`/${locale}/${path}`} target="_blank" className="font-semibold text-primary underline underline-offset-2">
      {label}
    </Link>
  );
}

function ConsentCheckbox({ checked, onChange, children }: Omit<ConsentCheckboxProps, "locale"> & { children: React.ReactNode }) {
  return (
    <label className="flex items-start gap-2.5 text-xs text-ink-body">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-surface-border text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <span>{children}</span>
    </label>
  );
}

export function TermsCheckbox({ checked, onChange, locale }: ConsentCheckboxProps) {
  return (
    <ConsentCheckbox checked={checked} onChange={onChange}>
      I confirm I am 18 or older, and I have read and agree to the{" "}
      <PolicyLink locale={locale} path="terms-conditions" label="Terms & Conditions" /> and{" "}
      <PolicyLink locale={locale} path="privacy-policy" label="Privacy Policy" />.
    </ConsentCheckbox>
  );
}

export function PurohitConsentCheckbox({ checked, onChange, locale }: ConsentCheckboxProps) {
  return (
    <ConsentCheckbox checked={checked} onChange={onChange}>
      I confirm I am 18 or older, and I agree that AstroKraft may use these details (including any attachment) to
      contact me and arrange this puja, as described in the{" "}
      <PolicyLink locale={locale} path="privacy-policy" label="Privacy Policy" />.
    </ConsentCheckbox>
  );
}

export function TestimonialConsentCheckbox({ checked, onChange, locale }: ConsentCheckboxProps) {
  return (
    <ConsentCheckbox checked={checked} onChange={onChange}>
      I confirm I am 18 or older, and I agree that my name, rating and review may be shown publicly on AstroKraft
      once approved. See our <PolicyLink locale={locale} path="privacy-policy" label="Privacy Policy" />.
    </ConsentCheckbox>
  );
}
