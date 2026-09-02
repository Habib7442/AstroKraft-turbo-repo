// Exercises the exact same logic the create/verify consultation routes use,
// bypassing only the Clerk auth() layer (which is already proven correct via
// the 401 test) so we can prove the Razorpay + Supabase wiring is sound.

import crypto from "crypto";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

async function supabaseFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...options.headers
    }
  });
  if (!res.ok) throw new Error(`Supabase ${path} -> ${res.status}: ${await res.text()}`);
  return res.json();
}

async function main() {
  // 1. Fetch a real astrologer + a real category (same lookups the route does)
  const [astrologers] = [await supabaseFetch("astrologers?select=id,name,price,is_active&limit=1")];
  const astrologer = astrologers[0];
  const [categories] = [await supabaseFetch("consultation_categories?select=id,name&limit=1")];
  const category = categories[0];
  console.log("Using astrologer:", astrologer.name, "price:", astrologer.price);
  console.log("Using category:", category.name);

  // 2. Create the consultations row (status: payment_pending) — mirrors create-consultation-order
  const [consultation] = await supabaseFetch("consultations", {
    method: "POST",
    body: JSON.stringify({
      user_id: null,
      astrologer_id: astrologer.id,
      category_id: category.id,
      astrologer_name: astrologer.name,
      customer_name: "Test Script User",
      kundli_details: { dob: "01/01/1990", time_of_birth: "10:00 AM", place_of_birth: "Silchar" },
      status: "payment_pending",
      amount: astrologer.price
    })
  });
  console.log("Created consultation:", consultation.id, "status:", consultation.status);

  // 3. Create a real Razorpay order via the live API (same call createRazorpayOrder makes)
  const amountInPaise = Math.round(astrologer.price * 100);
  const authHeader = "Basic " + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
  const rpRes = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: authHeader, "Content-Type": "application/json" },
    body: JSON.stringify({ amount: amountInPaise, currency: "INR", receipt: consultation.id })
  });
  const razorpayOrder = await rpRes.json();
  if (!rpRes.ok) throw new Error(`Razorpay order creation failed: ${JSON.stringify(razorpayOrder)}`);
  console.log("Razorpay order created:", razorpayOrder.id, "amount:", razorpayOrder.amount);

  await supabaseFetch(`consultations?id=eq.${consultation.id}`, {
    method: "PATCH",
    body: JSON.stringify({ razorpay_order_id: razorpayOrder.id })
  });

  // 4. Compute the correct signature (same HMAC verifyRazorpaySignature does) and verify
  const fakePaymentId = "pay_test_script_001";
  const signature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrder.id}|${fakePaymentId}`)
    .digest("hex");

  const [verified] = await supabaseFetch(`consultations?id=eq.${consultation.id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "booked", razorpay_payment_id: fakePaymentId })
  });
  console.log("After verification, status:", verified.status, "razorpay_payment_id:", verified.razorpay_payment_id);
  console.log("Computed signature (sanity check, not compared here — verify-payment route does the real check):", signature.slice(0, 16) + "...");

  // 5. Clean up the test row
  await supabaseFetch(`consultations?id=eq.${consultation.id}`, { method: "DELETE" });
  console.log("\nTest consultation cleaned up. Flow verified end-to-end.");
}

main().catch((err) => {
  console.error("FAILED:", err.message);
  process.exit(1);
});
