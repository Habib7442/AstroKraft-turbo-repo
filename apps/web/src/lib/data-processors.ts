// Every third party that receives customer personal data. Shown in the
// privacy policy and included in each data export (DPDP s.11(1)(b)) - keep
// this list current when a new service is wired in.
export const DATA_PROCESSORS = [
  { name: "Clerk", purpose: "Sign-in and account management", data: "Name, email address, phone number" },
  {
    name: "Supabase",
    purpose: "Database hosting (servers in Tokyo, Japan)",
    data: "Account, order, consultation, booking and review records"
  },
  { name: "Cloudflare (R2 storage, CDN)", purpose: "File storage and site delivery", data: "Files attached to Purohit bookings; IP address of requests" },
  { name: "Vercel", purpose: "Website hosting", data: "IP address and request data needed to serve the site" },
  { name: "Razorpay", purpose: "Payment processing", data: "Order amount, contact details entered at checkout, payment details" },
  { name: "Resend", purpose: "Sending invoices and booking emails", data: "Name, email address, order or booking summary" },
  {
    name: "PostHog",
    purpose: "Website usage analytics",
    data: "Pages visited and clicks, and your IP address (received with each request but discarded, not stored); not linked to your name, email or phone"
  },
  { name: "Expo (push notifications)", purpose: "Alerting our staff app to new bookings", data: "Customer first name and booking type" },
  { name: "Telegram", purpose: "Internal alerts to our team", data: "Customer first name, order/booking ID and amount" }
] as const;
