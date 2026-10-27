import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/lib/locales";
import { breadcrumbSchema, blogSchema, constructMetadata, toJsonLdString } from "@/lib/seo";
import { formatBlogDate, getPublishedPosts } from "@/lib/blog";

// Same 5-minute window as product pages - the admin app tells authors a
// newly published post goes live "within about 5 minutes".
export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return constructMetadata({
    title: "Blog — Vedic Astrology, Gemstone & Vastu Guides",
    description:
      "Practical guides on Vedic astrology, gemstones, Rudraksha and Vastu from the AstroKraft team in Silchar, Assam — which stone to wear, how to wear it, and what to expect.",
    path: "/blog",
    locale: isValidLocale(locale) ? locale : "en",
    keywords: ["astrology blog", "gemstone guide", "vastu tips", "rudraksha guide"]
  });
}

export default async function BlogIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const posts = await getPublishedPosts();
  const [featured, ...rest] = posts;

  const jsonLd = [
    blogSchema(
      posts.map((p) => ({
        title: p.title,
        path: `/blog/${p.slug}`,
        datePublished: p.published_at ?? p.updated_at,
        image: p.cover_image_url
      }))
    ),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Blog", path: "/blog" }
    ])
  ];

  return (
    <main className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLdString(jsonLd) }} />

      <section className="bg-primary-band px-6 py-12 text-white sm:py-16">
        <div className="mx-auto max-w-6xl">
          <nav aria-label="Breadcrumb" className="text-xs text-white/60">
            <Link href={`/${locale}`} className="hover:text-white">
              Home
            </Link>{" "}
            / <span className="text-white/90">Blog</span>
          </nav>
          <h1 className="mt-3 font-serif text-3xl font-bold sm:text-5xl">The AstroKraft Blog</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
            Straight answers on Vedic astrology, gemstones, Rudraksha and Vastu — written by our team in Silchar.
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-6 py-10 sm:py-14">
        {posts.length === 0 ? (
          <p className="py-16 text-center text-sm text-ink-muted">New articles are on the way. Check back soon.</p>
        ) : (
          <>
            {featured ? (
              <Link
                href={`/${locale}/blog/${featured.slug}`}
                className="group grid overflow-hidden rounded-xl border border-surface-border bg-surface-card shadow-sm transition-shadow hover:shadow-md lg:grid-cols-2"
              >
                <div className="relative aspect-[1.91/1] bg-surface-tint lg:aspect-auto lg:min-h-[320px]">
                  <Image
                    src={featured.cover_image_url}
                    alt={featured.cover_image_alt}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 576px"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col justify-center gap-3 p-6 sm:p-8">
                  <span className="w-fit rounded-full bg-saffron px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-foreground">
                    Latest
                  </span>
                  <h2 className="font-serif text-2xl font-bold leading-snug text-foreground group-hover:text-primary sm:text-3xl">
                    {featured.title}
                  </h2>
                  <p className="text-sm leading-relaxed text-ink-body">{featured.excerpt}</p>
                  <PostMeta date={featured.published_at} author={featured.author_name} />
                </div>
              </Link>
            ) : null}

            {rest.length > 0 ? (
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((post) => (
                  <Link
                    key={post.id}
                    href={`/${locale}/blog/${post.slug}`}
                    className="group flex flex-col overflow-hidden rounded-xl border border-surface-border bg-surface-card shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="relative aspect-[1.91/1] bg-surface-tint">
                      <Image
                        src={post.cover_image_url}
                        alt={post.cover_image_alt}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 384px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-5">
                      <h2 className="font-serif text-lg font-bold leading-snug text-foreground group-hover:text-primary">
                        {post.title}
                      </h2>
                      <p className="line-clamp-3 text-sm leading-relaxed text-ink-body">{post.excerpt}</p>
                      <div className="mt-auto pt-2">
                        <PostMeta date={post.published_at} author={post.author_name} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}

function PostMeta({ date, author }: { date?: string | null; author: string }) {
  return (
    <p className="text-xs text-ink-muted">
      {author}
      {date ? (
        <>
          {" · "}
          <time dateTime={date}>{formatBlogDate(date)}</time>
        </>
      ) : null}
    </p>
  );
}
