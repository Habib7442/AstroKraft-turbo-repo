import crypto from "crypto";
import Razorpay from "razorpay";

export interface RazorpayOrderOptions {
  amount: number; // in paise
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export function formatPaiseToINR(paise: number): number {
  return paise / 100;
}

export function formatINRToPaise(inr: number): number {
  return Math.round(inr * 100);
}

function getRazorpayCredentials() {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured (NEXT_PUBLIC_RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET).");
  }

  return { keyId, keySecret };
}

export function getRazorpayClient(): Razorpay {
  const { keyId, keySecret } = getRazorpayCredentials();
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export async function createRazorpayOrder(options: RazorpayOrderOptions) {
  if (options.amount < 100) {
    throw new Error("Amount must be at least 100 paise (₹1).");
  }

  const client = getRazorpayClient();
  return client.orders.create({
    amount: options.amount,
    currency: options.currency,
    receipt: options.receipt,
    notes: options.notes
  });
}

export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const { keySecret } = getRazorpayCredentials();

  const expected = crypto.createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");

  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(signature, "hex");

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}
