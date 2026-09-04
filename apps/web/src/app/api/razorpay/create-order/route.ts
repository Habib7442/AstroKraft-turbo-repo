import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createRazorpayOrder } from "@astrokraft/payments";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { ensureProfile } from "@/lib/ensure-profile";

interface CheckoutItemInput {
  variantId: string;
  quantity: number;
}

interface ShippingAddressInput {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

function isValidShippingAddress(value: unknown): value is ShippingAddressInput {
  if (!value || typeof value !== "object") return false;
  const a = value as Record<string, unknown>;
  return (
    typeof a.fullName === "string" &&
    a.fullName.trim().length > 0 &&
    typeof a.phone === "string" &&
    a.phone.trim().length > 0 &&
    typeof a.line1 === "string" &&
    a.line1.trim().length > 0 &&
    typeof a.city === "string" &&
    a.city.trim().length > 0 &&
    typeof a.state === "string" &&
    a.state.trim().length > 0 &&
    typeof a.pincode === "string" &&
    a.pincode.trim().length > 0
  );
}

interface VariantRow {
  id: string;
  title: string;
  price: number;
  stock: number;
  product_id: string;
  products: { title: string; images: string[] } | null;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Please sign in to checkout." }, { status: 401 });
    }

    // orders.user_id has a FK to profiles(id) — the Clerk webhook that
    // normally creates that row is async and not guaranteed to have run
    // yet, so make sure it exists before we ever try to insert an order.
    await ensureProfile(userId);

    const body = await req.json().catch(() => null);
    const items: CheckoutItemInput[] = Array.isArray(body?.items) ? body.items : [];

    if (items.length === 0) {
      return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
    }

    if (!isValidShippingAddress(body?.shippingAddress)) {
      return NextResponse.json({ error: "A complete shipping address is required." }, { status: 400 });
    }
    const shippingAddress = body.shippingAddress as ShippingAddressInput;

    if (body?.termsAccepted !== true) {
      return NextResponse.json({ error: "You must accept the Terms & Conditions to checkout." }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const variantIds = [...new Set(items.map((item) => item.variantId))];

    const { data: variants, error: variantsError } = await supabase
      .from("product_variants")
      .select("id, title, price, stock, product_id, products(title, images)")
      .in("id", variantIds);

    if (variantsError) throw variantsError;

    const variantRows = (variants ?? []) as unknown as VariantRow[];
    if (variantRows.length !== variantIds.length) {
      return NextResponse.json({ error: "One or more items in your cart are no longer available." }, { status: 400 });
    }

    let totalAmount = 0;
    const orderItemRows = items.map((item) => {
      const variant = variantRows.find((v) => v.id === item.variantId)!;
      const quantity = Math.max(1, Math.floor(item.quantity) || 1);
      totalAmount += variant.price * quantity;
      return {
        product_id: variant.product_id,
        variant_id: variant.id,
        title: variant.products?.title ?? variant.title,
        price: variant.price,
        quantity,
        image_url: variant.products?.images?.[0] ?? null
      };
    });

    const amountInPaise = Math.round(totalAmount * 100);
    if (amountInPaise < 100) {
      return NextResponse.json({ error: "Order amount must be at least ₹1." }, { status: 400 });
    }

    const orderNumber = `AK-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        order_number: orderNumber,
        status: "payment_pending",
        total_amount: totalAmount,
        shipping_address: shippingAddress
      })
      .select()
      .single();

    if (orderError) throw orderError;

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItemRows.map((row) => ({ ...row, order_id: order.id })));

    if (itemsError) throw itemsError;

    let razorpayOrder;
    try {
      razorpayOrder = await createRazorpayOrder({
        amount: amountInPaise,
        currency: "INR",
        receipt: order.order_number,
        notes: { orderId: order.id }
      });
    } catch (err: any) {
      await supabase.from("orders").update({ status: "payment_failed" }).eq("id", order.id);
      const status = err?.statusCode === 401 ? 401 : 500;
      return NextResponse.json(
        { error: err?.error?.description || err?.message || "Failed to create Razorpay order." },
        { status }
      );
    }

    await supabase.from("orders").update({ razorpay_order_id: razorpayOrder.id }).eq("id", order.id);

    return NextResponse.json({
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency
    });
  } catch (err: any) {
    console.error("razorpay create-order error:", err);
    return NextResponse.json({ error: err.message || "Failed to create order." }, { status: 500 });
  }
}
