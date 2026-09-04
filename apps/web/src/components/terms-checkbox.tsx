import Link from "next/link";

interface TermsCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  locale: string;
}

export function TermsCheckbox({ checked, onChange, locale }: TermsCheckboxProps) {
  return (
    <label className="flex items-start gap-2.5 text-xs text-ink-body">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-surface-border text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <span>
        I have read and agree to the{" "}
        <Link
          href={`/${locale}/terms-conditions`}
          target="_blank"
          className="font-semibold text-primary underline underline-offset-2"
        >
          Terms &amp; Conditions
        </Link>{" "}
        and{" "}
        <Link
          href={`/${locale}/privacy-policy`}
          target="_blank"
          className="font-semibold text-primary underline underline-offset-2"
        >
          Privacy Policy
        </Link>
        .
      </span>
    </label>
  );
}
