import { createClient } from "npm:@supabase/supabase-js@2";
import { jwtVerify, createRemoteJWKSet } from "npm:jose@5";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID")!;
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;
const CLERK_JWKS_URL = Deno.env.get("CLERK_JWKS_URL")!;

const clerkJwks = createRemoteJWKSet(new URL(CLERK_JWKS_URL));

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type"
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
  });
}

// Only order rows sitting in "refund_requested" may be refunded here — the
// admin app moves an order into that state as a plain, cheap DB write first
// (mirrors ORDER_TRANSITIONS in packages/core), then this function performs
// the actual, irreversible Razorpay refund call and finalizes the status.
const REFUNDABLE_STATUS = "refund_requested";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    return jsonResponse({ error: "Missing authorization" }, 401);
  }

  let role: unknown;
  try {
    const { payload } = await jwtVerify(token, clerkJwks);
    role = (payload.metadata as { role?: string } | undefined)?.role;
  } catch (err) {
    return jsonResponse({ error: `Invalid token: ${err instanceof Error ? err.message : "verification failed"}` }, 401);
  }

  if (role !== "admin") {
    return jsonResponse({ error: "Forbidden" }, 403);
  }

  let body: { orderId?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { orderId } = body;
  if (!orderId) {
    return jsonResponse({ error: "orderId is required" }, 400);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, status, razorpay_payment_id, total_amount")
    .eq("id", orderId)
    .maybeSingle();

  if (fetchError) {
    return jsonResponse({ error: fetchError.message }, 500);
  }
  if (!order) {
    return jsonResponse({ error: "Order not found" }, 404);
  }
  if (order.status !== REFUNDABLE_STATUS) {
    return jsonResponse({ error: `Order must be in "${REFUNDABLE_STATUS}" status to refund (currently "${order.status}").` }, 400);
  }
  if (!order.razorpay_payment_id) {
    return jsonResponse({ error: "Order has no Razorpay payment ID — cannot refund." }, 400);
  }

  const basicAuth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
  const refundRes = await fetch(`https://api.razorpay.com/v1/payments/${order.razorpay_payment_id}/refund`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ notes: { order_id: order.id } })
  });

  const refundData = await refundRes.json().catch(() => null);
  if (!refundRes.ok) {
    return jsonResponse({ error: refundData?.error?.description || "Razorpay refund request failed." }, refundRes.status);
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({ status: "refunded", updated_at: new Date().toISOString() })
    .eq("id", orderId);

  if (updateError) {
    return jsonResponse(
      { error: `Refund succeeded on Razorpay but failed to update order status: ${updateError.message}`, refund: refundData },
      500
    );
  }

  return jsonResponse({ success: true, refund: refundData });
});
