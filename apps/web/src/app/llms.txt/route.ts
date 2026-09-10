import { getSupabaseClient } from "@/lib/supabase";
import { SITE, localizedUrl } from "@/lib/seo";

export const revalidate = 3600;

// https://llmstxt.org — a curated, Markdown overview for LLM crawlers/agents,
// not a full site index (that's sitemap.xml's job). Requires an H1 title and
// at least one link; a Next.js App Router folder named exactly "llms.txt"
// maps to that literal path, same trick used for robots.txt/sitemap.xml.
export async function GET() {
  const supabase = getSupabaseClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("name, slug, description")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const shopLinks = (categories ?? [])
    .map((c) => `- [${c.name}](${localizedUrl(c.slug)})${c.description ? `: ${c.description}` : ""}`)
    .join("\n");

  const body = `# ${SITE.name}

> ${SITE.description}

${SITE.name} sells lab-certified gemstones, Rudraksha, and crystal bracelets, and offers Vastu consultations, Vedic astrology consultations, and purohit (priest) booking for pujas and rituals. Based in ${SITE.contact.address.locality}, ${SITE.contact.address.region}, ${SITE.contact.address.country}, serving customers across India.

## Shop
${shopLinks}

## Services
- [Book a Consultation](${localizedUrl("consultation")}): Vedic astrology consultations with verified astrologers, by category (career, love, finance, health, and more)
- [Book a Purohit](${localizedUrl("purohit-booking")}): Book a priest for pujas and rituals, with pricing and material options

## Company
- [About Us](${localizedUrl("about")})
- [Contact Us](${localizedUrl("contact")})

## Legal
- [Privacy Policy](${localizedUrl("privacy-policy")})
- [Terms & Conditions](${localizedUrl("terms-conditions")})
- [Shipping & Exchange](${localizedUrl("shipping-policy")})
- [Refund & Cancellation Policy](${localizedUrl("refund-policy")})
`;

  return new Response(body, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" }
  });
}
