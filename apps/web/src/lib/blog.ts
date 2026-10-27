import type { BlogBlock, BlogPost } from "@astrokraft/db";
import { getSupabaseClient } from "@/lib/supabase";

export type BlogPostSummary = Pick<
  BlogPost,
  "id" | "slug" | "title" | "excerpt" | "cover_image_url" | "cover_image_alt" | "tags" | "author_name" | "published_at" | "updated_at"
>;

const SUMMARY_COLUMNS = "id, slug, title, excerpt, cover_image_url, cover_image_alt, tags, author_name, published_at, updated_at";

// The anon client only sees status = 'published' through RLS; the explicit
// filter keeps the query on the partial index either way.
export async function getPublishedPosts(limit?: number): Promise<BlogPostSummary[]> {
  let query = getSupabaseClient()
    .from("blog_posts")
    .select(SUMMARY_COLUMNS)
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data } = await query;
  return (data as BlogPostSummary[] | null) ?? [];
}

export async function getPublishedPost(slug: string): Promise<BlogPost | null> {
  const { data } = await getSupabaseClient()
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data as BlogPost | null;
}

/** Strips the paragraph markup (**bold**, *italic*, [label](url)) down to readable text. */
export function stripInlineMarkup(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1");
}

function blockText(block: BlogBlock): string {
  switch (block.type) {
    case "heading":
    case "quote":
      return block.text;
    case "paragraph":
      return stripInlineMarkup(block.text);
    case "list":
      return block.items.map(stripInlineMarkup).join(" ");
    case "images":
      return block.images.map((img) => img.caption ?? "").join(" ");
    case "embed":
      return block.caption ?? "";
  }
}

export function countWords(blocks: BlogBlock[]): number {
  return blocks.map(blockText).join(" ").split(/\s+/).filter(Boolean).length;
}

export function readingMinutes(wordCount: number): number {
  return Math.max(1, Math.round(wordCount / 200));
}

/** Stable, URL-safe id for a heading so the table of contents can deep-link to it. */
export function headingId(text: string, index: number): string {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || `section-${index + 1}`;
}

export interface TocEntry {
  id: string;
  text: string;
  level: 2 | 3;
}

export function tableOfContents(blocks: BlogBlock[]): TocEntry[] {
  const seen = new Map<string, number>();
  const entries: TocEntry[] = [];
  blocks.forEach((block, index) => {
    if (block.type !== "heading") return;
    let id = headingId(block.text, index);
    const count = seen.get(id) ?? 0;
    seen.set(id, count + 1);
    if (count > 0) id = `${id}-${count + 1}`;
    entries.push({ id, text: block.text, level: block.level });
  });
  return entries;
}

export function formatBlogDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
}
