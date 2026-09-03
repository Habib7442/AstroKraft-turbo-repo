export interface ShippingAddress {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
}

export const EMPTY_SHIPPING_ADDRESS: ShippingAddress = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: ""
};

export function isShippingAddressComplete(address: ShippingAddress): boolean {
  return Boolean(
    address.fullName.trim() &&
      address.phone.trim() &&
      address.line1.trim() &&
      address.city.trim() &&
      address.state.trim() &&
      address.pincode.trim()
  );
}

const inputClassName =
  "w-full rounded-lg border border-surface-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/30";
const labelClassName = "mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-body";

interface ShippingAddressFormProps {
  value: ShippingAddress;
  onChange: (value: ShippingAddress) => void;
}

export function ShippingAddressForm({ value, onChange }: ShippingAddressFormProps) {
  const set = (field: keyof ShippingAddress) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [field]: e.target.value });

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-surface-border bg-surface-card p-5">
      <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">Shipping Address</h2>

      <div>
        <label className={labelClassName}>Full Name</label>
        <input type="text" value={value.fullName} onChange={set("fullName")} placeholder="Full name" className={inputClassName} />
      </div>

      <div>
        <label className={labelClassName}>Phone Number</label>
        <input
          type="tel"
          value={value.phone}
          onChange={set("phone")}
          placeholder="10-digit mobile number"
          className={inputClassName}
        />
      </div>

      <div>
        <label className={labelClassName}>Address Line 1</label>
        <input
          type="text"
          value={value.line1}
          onChange={set("line1")}
          placeholder="House no., street, area"
          className={inputClassName}
        />
      </div>

      <div>
        <label className={labelClassName}>Address Line 2 (optional)</label>
        <input
          type="text"
          value={value.line2}
          onChange={set("line2")}
          placeholder="Landmark, apartment, etc."
          className={inputClassName}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClassName}>City</label>
          <input type="text" value={value.city} onChange={set("city")} placeholder="City" className={inputClassName} />
        </div>
        <div>
          <label className={labelClassName}>State</label>
          <input type="text" value={value.state} onChange={set("state")} placeholder="State" className={inputClassName} />
        </div>
        <div>
          <label className={labelClassName}>Pincode</label>
          <input
            type="text"
            inputMode="numeric"
            value={value.pincode}
            onChange={set("pincode")}
            placeholder="6-digit PIN"
            className={inputClassName}
          />
        </div>
      </div>
    </div>
  );
}
