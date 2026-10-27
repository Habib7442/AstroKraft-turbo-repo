import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/lib/locales";
import {
  blogPostingSchema,
  breadcrumbSchema,
  constructMetadata,
  faqSchema,
  toJsonLdString
} from "@/lib/seo";
import {
  countWords,
  formatBlogDate,
  getPublishedPost,
  getPublishedPosts,
  readingMinutes,
  tableOfContents
} from "@/lib/blog";
import { BlogContent } from "@/components/blog/blog-content";

// Same window as product pages - see blog/page.tsx.
export const revalidate = 300;

// Without this the route renders on every request (ƒ) instead of ISR.
// Posts published after the build are rendered on first visit, then cached.
export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ locale: "en", slug: post.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc = isValidLocale(locale) ? locale : "en";
  const post = await getPublishedPost(slug);

  if (!post) {
    return constructMetadata({ title: "Article Not Found", path: `/blog/${slug}`, locale: loc, noIndex: true });
  }

  return constructMetadata({
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt,
    path: `/blog/${post.slug}`,
    locale: loc,
    image: post.cover_image_url,
    imageAlt: post.cover_image_alt,
    imageSize: null,
    keywords: post.tags,
    article: {
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      authors: [post.author_name],
      tags: post.tags
    }
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) notFound();

  const post = await getPublishedPost(slug);
  if (!post) notFound();

  const blocks = post.content ?? [];
  const faqs = post.faqs ?? [];
  const toc = tableOfContents(blocks);
  const wordCount = countWords(blocks) + post.excerpt.split(/\s+/).length;
  const published = post.published_at ?? post.created_at;
  // Only show "Updated" for a real later edit, not the publish save itself.
  const wasUpdated = new Date(post.updated_at).getTime() - new Date(published).getTime() > 24 * 60 * 60 * 1000;

  const related = (await getPublishedPosts(4)).filter((p) => p.id !== post.id).slice(0, 3);
  const path = `/blog/${post.slug}`;

  const jsonLd = [
    blogPostingSchema({
      title: post.title,
      description: post.seo_description || post.excerpt,
      path,
      image: post.cover_image_url,
      imageAlt: post.cover_image_alt,
      authorName: post.author_name,
      datePublished: published,
      dateModified: post.updated_at,
      wordCount,
      keywords: post.tags,
      articleSection: toc.filter((t) => t.level === 2).map((t) => t.text)
    }),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Blog", path: "/blog" },
      { name: post.title, path }
    ]),
    ...(faqs.length > 0 ? [faqSchema(faqs)] : [])
  ];

  return (
    <main className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLdString(jsonLd) }} />

      <article className="mx-auto w-full max-w-3xl px-6 pb-16 pt-8">
        <nav aria-label="Breadcrumb" className="text-xs text-ink-muted">
          <Link href={`/${locale}`} className="hover:text-primary">
            Home
          </Link>{" "}
          /{" "}
          <Link href={`/${locale}/blog`} className="hover:text-primary">
            Blog
          </Link>
        </nav>

        <header className="mt-4">
          {post.tags.length > 0 ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{post.tags.slice(0, 3).join(" · ")}</p>
          ) : null}
          <h1 className="mt-2 font-serif text-3xl font-bold leading-tight text-foreground sm:text-[42px] sm:leading-[1.15]">
            {post.title}
          </h1>
          <p className="mt-4 text-sm text-ink-muted">
            By <span className="font-semibold text-ink-body">{post.author_name}</span>
            {" · "}
            <time dateTime={published}>{formatBlogDate(published)}</time>
            {wasUpdated ? (
              <>
                {" · Updated "}
                <time dateTime={post.updated_at}>{formatBlogDate(post.updated_at)}</time>
              </>
            ) : null}
            {" · "}
            {readingMinutes(wordCount)} min read
          </p>
        </header>

        <div className="relative mt-6 aspect-[1.91/1] overflow-hidden rounded-xl border border-surface-border bg-surface-tint">
          <Image
            src={post.cover_image_url}
            alt={post.cover_image_alt}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 720px"
            className="object-cover"
          />
        </div>

        {/* Answer-first summary: the passage search and AI engines quote most. */}
        <div className="mt-8 rounded-xl border border-surface-border bg-surface-card p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gold">In short</p>
          <p className="mt-2 text-base leading-relaxed text-foreground">{post.excerpt}</p>
        </div>

        {toc.length >= 3 ? (
          <nav aria-label="Table of contents" className="mt-8 rounded-xl bg-surface-tint p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">In this article</p>
            <ol className="mt-3 space-y-1.5 text-sm">
              {toc.map((entry) => (
                <li key={entry.id} className={entry.level === 3 ? "pl-4" : ""}>
                  <a href={`#${entry.id}`} className="text-primary hover:underline">
                    {entry.text}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        <div className="mt-4">
          <BlogContent blocks={blocks} />
        </div>

        {faqs.length > 0 ? (
          <section className="mt-14" aria-labelledby="faq-heading">
            <h2 id="faq-heading" className="font-serif text-2xl font-bold text-foreground">
              Frequently asked questions
            </h2>
            <div className="mt-5 divide-y divide-surface-border rounded-xl border border-surface-border bg-surface-card">
              {faqs.map((faq, i) => (
                <details key={i} className="group p-5" open={i === 0}>
                  <summary className="cursor-pointer list-none font-semibold text-foreground marker:hidden">
                    <span className="flex items-start justify-between gap-4">
                      {faq.question}
                      <span className="text-primary transition-transform group-open:rotate-45">+</span>
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-ink-body">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}

        <aside className="mt-14 rounded-xl bg-primary-band p-6 text-white sm:p-8">
          <p className="font-serif text-xl font-bold">Not sure which stone or remedy suits your chart?</p>
          <p className="mt-2 text-sm text-white/75">
            Talk to an AstroKraft astrologer — a fixed-price consultation, matched to your question.
          </p>
          <Link
            href={`/${locale}/consultation`}
            className="mt-5 inline-block rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-gold-soft hover:text-foreground"
          >
            Book a consultation
          </Link>
        </aside>
      </article>

      {related.length > 0 ? (
        <section className="border-t border-surface-border bg-surface-card px-6 py-12">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-serif text-2xl font-bold text-foreground">More from the blog</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              {related.map((p) => (
                <Link key={p.id} href={`/${locale}/blog/${p.slug}`} className="group">
                  <div className="relative aspect-[1.91/1] overflow-hidden rounded-lg border border-surface-border bg-surface-tint">
                    <Image src={p.cover_image_url} alt={p.cover_image_alt} fill sizes="(max-width: 640px) 100vw, 384px" className="object-cover" />
                  </div>
                  <p className="mt-3 font-serif text-base font-bold leading-snug text-foreground group-hover:text-primary">{p.title}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
