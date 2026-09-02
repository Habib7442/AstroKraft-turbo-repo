import React from "react";
import fs from "fs";
import path from "path";
import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { SITE } from "@/lib/seo";

// Read once at module load and inline as a data URI — react-pdf renders
// server-side with no browser fetch, so a local file path/URL won't resolve.
const LOGO_DATA_URI = (() => {
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    return `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}`;
  } catch (e) {
    console.error("[invoice-pdf] Failed to load logo:", e);
    return null;
  }
})();

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#221A3D" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  brandRow: { flexDirection: "row", alignItems: "center" },
  logo: { width: 34, height: 34, marginRight: 10 },
  brand: { fontSize: 20, fontWeight: 700 },
  brandGold: { color: "#B8860B" },
  muted: { color: "#6E698A", fontSize: 9 },
  titleBlock: { alignItems: "flex-end" },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  section: { marginBottom: 18 },
  sectionLabel: { fontSize: 8, color: "#6E698A", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  divider: { borderBottomWidth: 1, borderBottomColor: "#ECE7F7", marginVertical: 14 },
  table: { marginTop: 6 },
  tableHeader: { flexDirection: "row", backgroundColor: "#F1ECFA", paddingVertical: 6, paddingHorizontal: 8 },
  tableRow: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: "#F1ECFA" },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: "center" },
  colAmount: { flex: 1, textAlign: "right" },
  th: { fontSize: 8, fontWeight: 700, textTransform: "uppercase", color: "#6E698A" },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 14 },
  totalLabel: { fontSize: 11, fontWeight: 700, marginRight: 20 },
  totalAmount: { fontSize: 14, fontWeight: 700 },
  footer: { position: "absolute", bottom: 40, left: 40, right: 40, fontSize: 8, color: "#9a9aa8", textAlign: "center" }
});

export interface InvoiceLineItem {
  title: string;
  subtitle?: string | null;
  price: number;
  quantity: number;
}

export interface InvoiceOrder {
  /** Full order/consultation UUID — used to derive the invoice number. */
  id: string;
  /** Human-facing reference, e.g. order_number or a synthetic consultation ref. */
  reference: string;
  amount: number;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  status: string;
  created_at: string;
  items: InvoiceLineItem[];
}

export interface InvoiceCustomer {
  name: string | null;
  email: string | null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function InvoiceDocument({ order, customer }: { order: InvoiceOrder; customer: InvoiceCustomer }) {
  const invoiceNumber = `AK-${order.id.slice(0, 8).toUpperCase()}`;

  return (
    <Document title={`Invoice ${invoiceNumber}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.brandRow}>
            {LOGO_DATA_URI ? <Image src={LOGO_DATA_URI} style={styles.logo} /> : null}
            <View>
              <Text style={styles.brand}>
                Astro<Text style={styles.brandGold}>Kraft</Text>
              </Text>
              <Text style={styles.muted}>{SITE.contact.address.display}</Text>
              <Text style={styles.muted}>
                {SITE.contact.email} · {SITE.contact.phoneDisplay}
              </Text>
            </View>
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Payment Receipt</Text>
            <Text style={styles.muted}>Invoice #{invoiceNumber}</Text>
            <Text style={styles.muted}>Ref: {order.reference}</Text>
            <Text style={styles.muted}>Date: {formatDate(order.created_at)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Billed To</Text>
          <Text>{customer.name || "AstroKraft Customer"}</Text>
          {customer.email ? <Text style={styles.muted}>{customer.email}</Text> : null}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.colDesc]}>Item</Text>
            <Text style={[styles.th, styles.colQty]}>Qty</Text>
            <Text style={[styles.th, styles.colAmount]}>Amount (INR)</Text>
          </View>
          {order.items.map((item, idx) => (
            <View style={styles.tableRow} key={idx}>
              <View style={styles.colDesc}>
                <Text>{item.title}</Text>
                {item.subtitle ? <Text style={styles.muted}>{item.subtitle}</Text> : null}
              </View>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colAmount}>{formatCurrency(item.price * item.quantity)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Paid</Text>
          <Text style={styles.totalAmount}>{formatCurrency(order.amount)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Payment Details</Text>
          <View style={styles.row}>
            <Text style={styles.muted}>Payment Status</Text>
            <Text>{order.status === "paid" || order.status === "booked" ? "Paid" : order.status}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.muted}>Payment Method</Text>
            <Text>Razorpay</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.muted}>Razorpay Order ID</Text>
            <Text>{order.razorpay_order_id || "—"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.muted}>Razorpay Payment ID</Text>
            <Text>{order.razorpay_payment_id || "—"}</Text>
          </View>
        </View>

        <View style={styles.divider} />
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Business Registration</Text>
          <View style={styles.row}>
            <Text style={styles.muted}>Udyam Registration No.</Text>
            <Text>{SITE.business.udyamNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.muted}>Shop & Establishment No.</Text>
            <Text>{SITE.business.shopEstablishmentNumber}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          This receipt confirms a successful payment processed via Razorpay. AstroKraft{"™"} · {SITE.url}
        </Text>
      </Page>
    </Document>
  );
}

// Shared by every payment-verification route, so every invoice email always
// renders the exact same PDF layout from the same order/customer data.
export async function renderInvoicePdf(order: InvoiceOrder, customer: InvoiceCustomer): Promise<Buffer> {
  const element = React.createElement(InvoiceDocument, { order, customer });
  // react-pdf's renderToBuffer types expect a <Document> element directly;
  // InvoiceDocument wraps one, which is fine at runtime but not structurally
  // assignable to DocumentProps, hence the cast.
  return renderToBuffer(element as Parameters<typeof renderToBuffer>[0]);
}
